"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "outline";
type Size    = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-gray-900 text-white hover:bg-gray-800 border border-gray-900",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400",
  accent:    "bg-accent text-white hover:bg-accent-dark border border-accent",
  ghost:     "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
  danger:    "bg-red-600 text-white hover:bg-red-700 border border-red-600",
  outline:   "bg-transparent text-primary border border-primary hover:bg-primary-50",
};

const SIZES: Record<Size, string> = {
  xs: "text-xs px-2.5 py-1 gap-1",
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-5 py-2.5 gap-2",
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
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none active:scale-[0.97]",
        "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900/30",
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
