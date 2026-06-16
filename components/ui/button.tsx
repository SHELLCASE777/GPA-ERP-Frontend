"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "outline";
type Size    = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-[#06294A] text-white hover:bg-[#021B33] border border-[#06294A]",
  secondary: "bg-white text-[#33445A] border border-[#D6D3CB] hover:bg-[#F8FAF9] hover:border-[#C4C0B6]",
  accent:    "bg-[#F2B713] text-[#021B33] hover:bg-[#CE9A08] border border-[#F2B713] hover:border-[#CE9A08]",
  ghost:     "bg-transparent text-[#5E7186] hover:bg-[#F8FAF9] hover:text-[#0C2138] border border-transparent",
  danger:    "bg-red-600 text-white hover:bg-red-700 border border-red-600",
  outline:   "bg-transparent text-[#06294A] border border-[#0A3A63] hover:bg-[#EEF3F8]",
};

const SIZES: Record<Size, string> = {
  xs: "text-xs px-2.5 py-1 gap-1",
  sm: "text-[12px] px-[11px] py-[6px] gap-1.5",
  md: "text-[13px] px-[15px] py-2 gap-1.5",
  lg: "text-sm px-5 py-2.5 gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "secondary",
  size    = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-[8px] transition-all duration-[180ms] select-none active:scale-[0.975]",
        "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0A3A63]/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : icon}
      {children}
    </button>
  );
}
