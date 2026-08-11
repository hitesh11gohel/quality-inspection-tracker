import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { createInspection } from "@/store/slices/inspectionsSlice";
import type { DefectType, Severity } from "@qit/shared";
import { DEFECT_TYPES, SEVERITIES } from "@qit/shared";
import { format } from "date-fns";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormState {
  date: string;
  machineLineId: string;
  defectType: DefectType | "";
  severity: Severity | "";
  remarks: string;
}

interface FormErrors {
  date?: string;
  machineLineId?: string;
  defectType?: string;
  severity?: string;
}

const severityStyles: Record<Severity, { selected: string; idle: string }> = {
  Critical: {
    selected:
      "bg-red-500 border-red-500 text-white ring-2 ring-red-300 ring-offset-1",
    idle: "border-border bg-background text-foreground hover:bg-red-50 hover:border-red-300",
  },
  Major: {
    selected:
      "bg-amber-500 border-amber-500 text-white ring-2 ring-amber-300 ring-offset-1",
    idle: "border-border bg-background text-foreground hover:bg-amber-50 hover:border-amber-300",
  },
  Minor: {
    selected:
      "bg-green-500 border-green-500 text-white ring-2 ring-green-300 ring-offset-1",
    idle: "border-border bg-background text-foreground hover:bg-green-50 hover:border-green-300",
  },
};

export default function LogInspectionPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSubmitting = useAppSelector((s) => s.inspections.isSubmitting);

  const [form, setForm] = useState<FormState>({
    date: format(new Date(), "yyyy-MM-dd"),
    machineLineId: "",
    defectType: "",
    severity: "",
    remarks: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.date) errs.date = "Date is required";
    if (!form.machineLineId.trim())
      errs.machineLineId = "Machine / Line ID is required";
    if (!form.defectType) errs.defectType = "Defect type is required";
    if (!form.severity) errs.severity = "Severity is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      machineLineId: "",
      defectType: "",
      severity: "",
      remarks: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(
      createInspection({
        date: form.date,
        machineLineId: form.machineLineId.trim(),
        defectType: form.defectType as DefectType,
        severity: form.severity as Severity,
        remarks: form.remarks.trim() || undefined,
      })
    );

    if (createInspection.fulfilled.match(result)) {
      resetForm();
      toast({
        title: "Inspection logged",
        description: "Defect recorded successfully.",
        action: (
          <ToastAction
            altText="View all inspections"
            onClick={() => navigate("/inspections")}
          >
            View All
          </ToastAction>
        ),
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to log inspection",
        description:
          (result.payload as string) ??
          "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-4">
      <div className="mb-6 flex items-center gap-2">
        <PlusCircle className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Log Inspection</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Card wrapper on desktop, flat on mobile */}
        <div className="space-y-5 sm:rounded-lg sm:border sm:bg-card sm:p-6 sm:shadow-sm">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((f) => ({ ...f, date: e.target.value }));
                if (errors.date)
                  setErrors((er) => ({ ...er, date: undefined }));
              }}
              className={cn(
                errors.date &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Machine / Line ID */}
          <div className="space-y-1.5">
            <Label htmlFor="machineLineId">Machine / Line ID</Label>
            <Input
              id="machineLineId"
              type="text"
              placeholder="e.g. M-12, Line-3A"
              value={form.machineLineId}
              onChange={(e) => {
                setForm((f) => ({ ...f, machineLineId: e.target.value }));
                if (errors.machineLineId)
                  setErrors((er) => ({ ...er, machineLineId: undefined }));
              }}
              className={cn(
                errors.machineLineId &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.machineLineId && (
              <p className="text-sm text-destructive">{errors.machineLineId}</p>
            )}
          </div>

          {/* Defect Type */}
          <div className="space-y-1.5">
            <Label>Defect Type</Label>
            <Select
              value={form.defectType}
              onValueChange={(v) => {
                setForm((f) => ({ ...f, defectType: v as DefectType }));
                if (errors.defectType)
                  setErrors((er) => ({ ...er, defectType: undefined }));
              }}
            >
              <SelectTrigger
                className={cn(
                  errors.defectType &&
                    "border-destructive focus:ring-destructive"
                )}
              >
                <SelectValue placeholder="Select defect type" />
              </SelectTrigger>
              <SelectContent>
                {DEFECT_TYPES.map((dt) => (
                  <SelectItem key={dt} value={dt}>
                    {dt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.defectType && (
              <p className="text-sm text-destructive">{errors.defectType}</p>
            )}
          </div>

          {/* Severity toggle group */}
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITIES.map((sev) => {
                const isSelected = form.severity === sev;
                const styles = severityStyles[sev];
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, severity: sev }));
                      if (errors.severity)
                        setErrors((er) => ({ ...er, severity: undefined }));
                    }}
                    className={cn(
                      "flex min-h-12 items-center justify-center rounded-md border-2 text-sm font-semibold",
                      "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      isSelected ? styles.selected : styles.idle
                    )}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
            {errors.severity && (
              <p className="text-sm text-destructive">{errors.severity}</p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="remarks">
                Remarks{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {form.remarks.length}/500
              </span>
            </div>
            <Textarea
              id="remarks"
              placeholder="Additional notes..."
              value={form.remarks}
              maxLength={500}
              rows={3}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging…
              </>
            ) : (
              "Log Inspection"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
