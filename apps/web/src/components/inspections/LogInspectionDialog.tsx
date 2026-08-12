import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { createInspection } from "@/store/slices/inspectionsSlice";
import type { DefectType, Severity } from "@qit/shared";
import { DEFECT_TYPES, SEVERITIES } from "@qit/shared";
import { format } from "date-fns";
import { Calendar, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

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
    selected: "border-red-500 bg-red-50 text-red-600",
    idle: "border-border bg-background text-foreground hover:bg-red-50 hover:border-red-300 hover:text-red-600",
  },
  Major: {
    selected: "border-amber-500 bg-amber-50 text-amber-600",
    idle: "border-border bg-background text-foreground hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600",
  },
  Minor: {
    selected: "border-green-500 bg-green-50 text-green-600",
    idle: "border-border bg-background text-foreground hover:bg-green-50 hover:border-green-300 hover:text-green-600",
  },
};

interface LogInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogInspectionDialog({
  open,
  onOpenChange,
}: LogInspectionDialogProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const isSubmitting = useAppSelector((s) => s.inspections.isSubmitting);

  const dateInputRef = useRef<HTMLInputElement>(null);

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

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
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
      onOpenChange(false);
      toast({
        title: "Inspection logged",
        description: "Defect recorded successfully.",
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Inspection</DialogTitle>
          <DialogDescription>
            Record a new fabric-production defect.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-date">
              Date <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                ref={dateInputRef}
                id="dialog-date"
                type="date"
                value={form.date}
                onChange={(e) => {
                  setForm((f) => ({ ...f, date: e.target.value }));
                  if (errors.date)
                    setErrors((er) => ({ ...er, date: undefined }));
                }}
                className={cn(
                  "pr-9 [&::-webkit-calendar-picker-indicator]:hidden",
                  errors.date &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    dateInputRef.current?.showPicker();
                  } catch {
                    dateInputRef.current?.click();
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Machine / Line ID */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-machineLineId">
              Machine / Line ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-machineLineId"
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
            <Label>
              Defect Type <span className="text-destructive">*</span>
            </Label>
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

          {/* Severity */}
          <div className="space-y-1.5">
            <Label>
              Severity <span className="text-destructive">*</span>
            </Label>
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
              <Label htmlFor="dialog-remarks">Remarks</Label>
              <span className="text-xs text-muted-foreground">
                {form.remarks.length}/500
              </span>
            </div>
            <Textarea
              id="dialog-remarks"
              placeholder="Additional notes..."
              value={form.remarks}
              maxLength={500}
              rows={3}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>

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
        </form>
      </DialogContent>
    </Dialog>
  );
}
