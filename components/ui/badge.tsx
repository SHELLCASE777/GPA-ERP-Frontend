"use client";
import { cn } from "@/lib/utils";
import type { ExpenseStatus, ARStatus, ProjectStatus } from "@/lib/types";
import {
  EXPENSE_STATUS_COLORS, EXPENSE_STATUS_LABEL,
  PROJECT_STATUS_COLORS, AR_STATUS_COLORS,
} from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-badge",
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const c = EXPENSE_STATUS_COLORS[status];
  return (
    <Badge className={cn(c.bg, c.text, c.border)}>
      {EXPENSE_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const label: Record<ProjectStatus, string> = {
    active: "Active", completed: "Completed",
    on_hold: "On Hold", cancelled: "Cancelled",
  };
  return (
    <Badge className={cn("border", PROJECT_STATUS_COLORS[status])}>
      {label[status]}
    </Badge>
  );
}

export function ARStatusBadge({ status }: { status: ARStatus }) {
  return (
    <Badge className={cn("border", AR_STATUS_COLORS[status])}>
      {status === "confirmed" ? "Confirmed" : "Draft"}
    </Badge>
  );
}

export function ApproverPill({ role }: { role: string | null }) {
  if (!role) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
      <span className="w-1 h-1 rounded-full bg-amber-500" />
      Pending: {role.replace("_", " ")}
    </span>
  );
}
