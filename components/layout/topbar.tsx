"use client";
import { Search, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/ui/notification-bell";

const PAGE_CRUMBS: Record<string, { label: string; parent?: string }> = {
  "/dashboard":     { label: "Dashboard" },
  "/action-center": { label: "Action Center" },
  "/projects":      { label: "Project Command" },
  "/revenue":       { label: "Revenue", parent: "Finance" },
  "/spending":      { label: "Spending", parent: "Finance" },
  "/inventory":     { label: "Inventory & Assets", parent: "Operations" },
  "/legal":         { label: "Legal & Proposals" },
  "/reports":       { label: "Reports" },
  "/vault":         { label: "Vault" },
  "/settings":      { label: "Settings" },
};

const MODULE_TABS = [
  { label: "OPERATIONS", href: "/inventory", paths: ["/inventory", "/action-center"], keys: ["inventory", "action_center"] },
  { label: "FINANCE", href: "/spending", paths: ["/spending", "/revenue"], keys: ["spending", "revenue_ar"] },
  { label: "PROCUREMENT", href: "/legal", paths: ["/legal"], keys: ["legal"] },
];

interface TopbarProps {
  onNewExpense?:  () => void;
  onSearchOpen?:  () => void;
}

export function Topbar({ onNewExpense, onSearchOpen }: TopbarProps) {
  const pathname = usePathname();
  const { canAccessMenu } = useAuth();
  const crumb    = PAGE_CRUMBS[pathname] ?? { label: "GPA ERP" };
  const visibleTabs = MODULE_TABS.filter((tab) => tab.keys.some(canAccessMenu));

  const activeModule = visibleTabs.find((m) =>
    m.paths.some((p) => pathname.startsWith(p))
  )?.label ?? null;

  return (
    <header className="fixed left-[220px] right-0 top-0 h-14 bg-white border-b border-gray-100 z-30 flex items-center px-5 gap-4">
      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
        <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
          Workspace
        </Link>
        {crumb.parent && (
          <>
            <ChevronRight size={11} />
            <span>{crumb.parent}</span>
          </>
        )}
        <ChevronRight size={11} />
        <span className="font-medium text-gray-700">{crumb.label}</span>
      </div>

      {/* ── Module tabs ───────────────────────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold tracking-widest rounded-md transition-all duration-150",
              tab.label === activeModule
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-700"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* ── Search trigger ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center max-w-md">
        <button
          onClick={onSearchOpen}
          className="relative w-full flex items-center gap-2 pl-9 pr-10 py-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 transition-all text-left"
        >
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <span>Search expenses, projects, invoices…</span>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono hidden sm:block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Right actions ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <NotificationBell />
        {canAccessMenu("spending") && (
          <button
            onClick={onNewExpense}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} />
            New Expense
          </button>
        )}
      </div>
    </header>
  );
}
