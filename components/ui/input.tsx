"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, left, right, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {left && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">{left}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900",
              "placeholder:text-gray-400 px-3 py-2",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
              "transition-colors duration-150",
              left  && "pl-9",
              right && "pr-9",
              error && "border-red-400 focus:ring-red-400/30",
              className
            )}
            {...rest}
          />
          {right && (
            <span className="absolute right-3 text-gray-400 pointer-events-none">{right}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint  && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, children, className, id, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900",
            "px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "transition-colors duration-150 cursor-pointer",
            error && "border-red-400 focus:ring-red-400/30",
            className
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const tid = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={tid} className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={tid}
          rows={3}
          className={cn(
            "w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900",
            "placeholder:text-gray-400 px-3 py-2 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            error && "border-red-400",
            className
          )}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
