import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { resolveInspection } from '@/store/slices/inspectionsSlice';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: number;
}

export default function ResolveDialog({ open, onOpenChange, inspectionId }: ResolveDialogProps) {
  const dispatch     = useAppDispatch();
  const { toast }    = useToast();
  const isSubmitting = useAppSelector((s) => s.inspections.isSubmitting);

  const [note,  setNote]  = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setNote('');
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (note.trim().length < 10) {
      setError('Resolution note must be at least 10 characters.');
      return;
    }
    setError(null);

    const result = await dispatch(
      resolveInspection({ id: inspectionId, resolutionNote: note.trim() })
    );

    if (resolveInspection.fulfilled.match(result)) {
      toast({
        title: 'Inspection resolved',
        description: 'The defect has been marked as resolved.',
      });
      setNote('');
      onOpenChange(false);
    } else {
      setError((result.payload as string) ?? 'Failed to resolve. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Inspection</DialogTitle>
          <DialogDescription>
            Provide a resolution note explaining how the defect was addressed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="resolution-note">Resolution Note</Label>
          <Textarea
            id="resolution-note"
            rows={4}
            placeholder="Describe how the defect was resolved…"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error && e.target.value.trim().length >= 10) setError(null);
            }}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resolving…
              </>
            ) : (
              'Mark as Resolved'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
