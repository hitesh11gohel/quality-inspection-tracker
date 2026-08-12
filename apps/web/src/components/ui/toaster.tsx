/**
 * Toaster — renders all active toasts from the useToast store.
 * Mount this once at the root of the app (inside App.tsx).
 *
 * All toasts share a neutral card background; the variant is communicated
 * solely through a coloured icon on the left so the notification never
 * looks alarming by itself.
 */
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const icon =
          variant === "destructive" ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          );

        return (
          <Toast key={id} variant={variant} {...props}>
            {icon}
            <div className="flex-1 min-w-0 grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
