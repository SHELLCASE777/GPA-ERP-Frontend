"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

let _setToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function registerToastSetter(
  setter: React.Dispatch<React.SetStateAction<Toast[]>>
) {
  _setToasts = setter;
}

let _counter = 0;

export function toast(options: Omit<Toast, "id">) {
  if (!_setToasts) return;
  const id = `toast-${++_counter}`;
  _setToasts((prev) => [...prev, { ...options, id }]);
  setTimeout(() => {
    _setToasts?.((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
}

export const toastSuccess = (title: string, description?: string) =>
  toast({ title, description, variant: "success" });

export const toastError = (title: string, description?: string) =>
  toast({ title, description, variant: "error" });

export const toastWarning = (title: string, description?: string) =>
  toast({ title, description, variant: "warning" });

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { registerToastSetter(setToasts); }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, dismiss };
}
