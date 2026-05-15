"use client";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastState, type Toast } from "@/lib/hooks/use-toast";

const CONFIGS = {
  success: { icon: CheckCircle2, border: "border-l-green-500",  iconClass: "text-green-400" },
  error:   { icon: XCircle,      border: "border-l-red-500",    iconClass: "text-red-400"   },
  warning: { icon: AlertTriangle,border: "border-l-amber-500",  iconClass: "text-amber-400" },
  info:    { icon: Info,         border: "border-l-blue-500",   iconClass: "text-blue-400"  },
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon: Icon, border, iconClass } = CONFIGS[toast.variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 w-80 bg-[#1C1C1E] text-white",
        "rounded-xl border-l-4 px-4 py-3.5 shadow-toast animate-slide-in-right",
        border
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-500 hover:text-gray-300 shrink-0 mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastState();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
