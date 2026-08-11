import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Inspection, Severity, Status } from '@qit/shared';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteInspection } from '@/store/slices/inspectionsSlice';
import { inspectionService } from '@/services/inspectionService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ResolveDialog from '@/components/inspections/ResolveDialog';
import { cn } from '@/lib/utils';

// ── Style maps ────────────────────────────────────────────────────────────────

const severityBadge: Record<Severity, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  Major:    'bg-amber-100 text-amber-700 border border-amber-200',
  Minor:    'bg-green-100 text-green-700 border border-green-200',
};

const statusBadge: Record<Status, string> = {
  Open:     'border border-blue-400 text-blue-600',
  Resolved: 'bg-green-500 text-white',
};

// ── Detail field ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
      <Skeleton className="h-5 w-16" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <hr />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-11 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InspectionDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const dispatch     = useAppDispatch();
  const { toast }    = useToast();
  const inspectionId = Number(id);

  const currentUser   = useAppSelector((s) => s.auth.user);
  const isSubmitting  = useAppSelector((s) => s.inspections.isSubmitting);
  const reduxItem     = useAppSelector((s) =>
    s.inspections.items.find((i) => i.id === inspectionId)
  );

  const [inspection,   setInspection]   = useState<Inspection | null>(reduxItem ?? null);
  const [loading,      setLoading]      = useState(!reduxItem);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [resolveOpen,  setResolveOpen]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch from API if not in Redux store
  useEffect(() => {
    if (!reduxItem) {
      inspectionService
        .getInspection(inspectionId)
        .then(setInspection)
        .catch((e: Error) => setFetchError(e.message))
        .finally(() => setLoading(false));
    }
  }, [inspectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep in sync when Redux updates (e.g., after resolve)
  useEffect(() => {
    if (reduxItem) setInspection(reduxItem);
  }, [reduxItem]);

  // ── RBAC ──────────────────────────────────────────────────────────────────

  const isAdmin = currentUser?.role === 'admin';

  const canResolve =
    !!inspection &&
    inspection.status === 'Open' &&
    !!currentUser &&
    (isAdmin || inspection.createdBy === currentUser.id);

  const canDelete = isAdmin;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!inspection) return;
    const result = await dispatch(deleteInspection(inspection.id));
    if (deleteInspection.fulfilled.match(result)) {
      toast({ title: 'Inspection deleted', description: `Inspection #${inspection.id} removed.` });
      navigate('/inspections');
    } else {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: (result.payload as string) ?? 'Could not delete inspection.',
      });
      setConfirmDelete(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <DetailSkeleton />;

  if (fetchError || !inspection) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive/60" />
        <p className="font-medium text-destructive">
          {fetchError ?? 'Inspection not found.'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/inspections')}>
          Back to Inspections
        </Button>
      </div>
    );
  }

  const dateLabel     = format(parseISO(inspection.date), 'd MMM yyyy');
  const createdLabel  = format(parseISO(inspection.createdAt), 'd MMM yyyy, HH:mm');
  const resolvedLabel = inspection.resolvedAt
    ? format(parseISO(inspection.resolvedAt), 'd MMM yyyy, HH:mm')
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <CardContent className="pt-6">

          {/* Machine ID + Severity badge */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Machine / Line
              </p>
              <p className="mt-0.5 text-2xl font-bold text-foreground">
                {inspection.machineLineId}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-sm font-semibold',
                severityBadge[inspection.severity]
              )}
            >
              {inspection.severity}
            </span>
          </div>

          {/* Status badge */}
          <div className="mt-3">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                statusBadge[inspection.status]
              )}
            >
              {inspection.status === 'Open' ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              {inspection.status}
            </span>
          </div>

          <hr className="my-4 border-border" />

          {/* Fields grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Defect Type">{inspection.defectType}</Field>
            <Field label="Inspection Date">{dateLabel}</Field>
            <Field label="Logged At">{createdLabel}</Field>
            <Field label="Logged By">
              {inspection.createdByUsername ?? (inspection.createdBy ? `User #${inspection.createdBy}` : '—')}
              {inspection.createdBy === currentUser?.id && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  you
                </span>
              )}
            </Field>
            {inspection.remarks && (
              <div className="col-span-2">
                <Field label="Remarks">{inspection.remarks}</Field>
              </div>
            )}
          </dl>

          {/* Resolution box */}
          {inspection.status === 'Resolved' && (
            <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Resolution Note
              </p>
              <p className="mt-1 text-sm leading-relaxed text-green-800">
                {inspection.resolutionNote}
              </p>
              {resolvedLabel && (
                <p className="mt-2 text-xs text-green-600">Resolved on {resolvedLabel}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {/* Resolve */}
            {canResolve && (
              <Button className="w-full" size="lg" onClick={() => setResolveOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Resolved
              </Button>
            )}

            {/* Delete (admin only) */}
            {canDelete && !confirmDelete && (
              <Button
                variant="destructive"
                className="w-full"
                size="lg"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Inspection
              </Button>
            )}

            {/* Inline delete confirmation */}
            {canDelete && confirmDelete && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-3 text-sm font-medium text-destructive">
                  Permanently delete this inspection? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isSubmitting}
                    onClick={handleDelete}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      'Confirm Delete'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ResolveDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        inspectionId={inspection.id}
      />
    </div>
  );
}
