"use client";
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
  footer?:   React.ReactNode;
  size?:     "sm" | "md" | "lg" | "xl";
}

const SIZE: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open, onClose, title, subtitle, children, footer, size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(15,23,42,0.42)] modal-backdrop animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-modal animate-slide-up overflow-hidden",
          SIZE[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[22px] pt-5 pb-4 border-b border-[#E7E5DF]">
          <div>
            <h2 className="text-[16px] font-bold text-[#0C2138]">{title}</h2>
            {subtitle && <p className="text-[12px] text-[#94A3B8] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F8FAF9] text-[#94A3B8] hover:text-[#0C2138] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-[22px] py-5 max-h-[64vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-[22px] py-4 border-t border-[#E7E5DF] bg-[#F8FAF9]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirm dialog ────────────────────────────────────────────────────────────

interface ConfirmProps {
  open:          boolean;
  onClose:       () => void;
  onConfirm:     () => void;
  title:         string;
  message:       string;
  confirmLabel?: string;
  danger?:       boolean;
  loading?:      boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = "Confirm", danger = false, loading = false,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="text-[13px] px-4 py-2 rounded-[8px] border border-[#D6D3CB] hover:bg-[#F8FAF9] text-[#33445A] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "text-[13px] px-4 py-2 rounded-[8px] font-semibold text-white transition-colors",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#06294A] hover:bg-[#021B33]",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[13px] text-[#33445A]">{message}</p>
    </Modal>
  );
}
