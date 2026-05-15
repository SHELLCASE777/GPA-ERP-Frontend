"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Search, Filter, SlidersHorizontal, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, MoreHorizontal, CheckCircle2, Send,
  XCircle, ArrowDownUp, ClipboardList, FileSpreadsheet, Copy, Printer,
  History,
} from "lucide-react";
import { expensesApi, pettyCashReportsApi, projectsApi } from "@/lib/api";
import {
  formatCurrency, fmtDateTime, EXPENSE_STATUS_LABEL,
  EXPENSE_STATUS_COLORS, getErrorMessage,
} from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpenseStatusBadge, ApproverPill } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import NewExpenseModal from "@/components/spending/new-expense-modal";
import PettyCashReportModal from "./components/petty-cash-report-modal";
import ExpenseVoucherModal from "./components/expense-voucher-modal";
import { ApprovalTimeline } from "./components/approval-timeline";
import { toastSuccess, toastError } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Expense, ExpenseStatus } from "@/lib/types";

type SortKey   = "id" | "amount" | "created_at" | "status";
type SortDir   = "asc" | "desc";
const PAGE_SIZE = 10;

const STATUS_OPTIONS: { label: string; value: ExpenseStatus | "" }[] = [
  { label: "All Statuses",  value: "" },
  { label: "Draft",         value: "draft" },
  { label: "Submitted",     value: "submitted" },
  { label: "Verified",      value: "verified" },
  { label: "Approved",      value: "approved" },
  { label: "Paid",          value: "paid" },
  { label: "Rejected",      value: "rejected" },
];

// ── Action menu ───────────────────────────────────────────────────────────────
function ActionMenu({
  expense,
  onRefresh,
  onDuplicate,
  onPrintVoucher,
}: {
  expense: Expense;
  onRefresh: () => void;
  onDuplicate: (expense: Expense) => void;
  onPrintVoucher: (expense: Expense) => void;
}) {
  const [open,           setOpen]           = useState(false);
  const [historyOpen,    setHistoryOpen]    = useState(false);

  const {
    data:     auditHistory,
    isFetching: auditFetching,
    refetch:  refetchAudit,
  } = useQuery({
    queryKey: ["expense-audit", expense.id],
    queryFn:  () => expensesApi.audit(expense.id).then((r) => r.data),
    enabled:  false,
  });

  function useAction(fn: () => Promise<unknown>, successMsg: string) {
    return async () => {
      try { await fn(); toastSuccess(successMsg); onRefresh(); }
      catch (e) { toastError("Action failed", getErrorMessage(e)); }
      finally { setOpen(false); }
    };
  }

  const canSubmit  = expense.status === "draft" || expense.status === "rejected";
  const canVerify  = expense.status === "submitted";
  const canApprove = expense.status === "submitted" || expense.status === "verified";
  const canPay     = expense.status === "approved";
  const canReject  = !["paid","hard_locked","rejected"].includes(expense.status);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-white border border-gray-100 rounded-xl shadow-modal w-48 py-1 overflow-hidden">
            {canSubmit && (
              <button
                onClick={useAction(() => expensesApi.submit(expense.id), "Expense submitted")}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Send size={12} className="text-blue-500" /> Submit for approval
              </button>
            )}
            {canVerify && (
              <button
                onClick={useAction(() => expensesApi.verify(expense.id), "Expense verified")}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CheckCircle2 size={12} className="text-cyan-500" /> Verify
              </button>
            )}
            {canApprove && (
              <button
                onClick={useAction(() => expensesApi.approve(expense.id), "Expense approved")}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CheckCircle2 size={12} className="text-green-500" /> Approve
              </button>
            )}
            {canPay && (
              <button
                onClick={useAction(() => expensesApi.pay(expense.id), "Marked as paid")}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CheckCircle2 size={12} className="text-purple-500" /> Mark paid
              </button>
            )}

            {/* ── Utility actions ──────────────────────────────────────── */}
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { onDuplicate(expense); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy size={12} className="text-amber-500" /> Duplicate
            </button>
            <button
              onClick={() => { onPrintVoucher(expense); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer size={12} className="text-gray-500" /> Print Voucher
            </button>

            {/* ── Approval history ─────────────────────────────────────── */}
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => {
                const next = !historyOpen;
                setHistoryOpen(next);
                if (next && !auditHistory) refetchAudit();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <History size={12} className="text-indigo-500" />
              History
              {auditFetching && (
                <span className="ml-auto w-3 h-3 border border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
              )}
            </button>
            {historyOpen && (
              <div className="px-3 pb-2 max-h-64 overflow-y-auto">
                <ApprovalTimeline
                  history={
                    auditHistory
                      ? auditHistory.map((log) => ({
                          action:    log.action,
                          role:      null,
                          user_id:   log.changed_by ?? 0,
                          timestamp: log.created_at,
                          note:      null,
                        }))
                      : (expense.approval_history ?? [])
                  }
                />
              </div>
            )}

            {canReject && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={useAction(
                    () => expensesApi.reject(expense.id, "Rejected via action menu"),
                    "Expense rejected"
                  )}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <XCircle size={12} /> Reject
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sortable header ───────────────────────────────────────────────────────────
function SortTh({
  label, field, sort, dir, onSort,
}: {
  label: string; field: SortKey;
  sort: SortKey; dir: SortDir;
  onSort: (f: SortKey) => void;
}) {
  const active = sort === field;
  return (
    <th
      className="th cursor-pointer select-none hover:text-gray-600 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
          {active && dir === "asc"
            ? <ChevronUp size={10} />
            : <ChevronDown size={10} />}
        </span>
      </span>
    </th>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SpendingPage() {
  const qc           = useQueryClient();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [newOpen,       setNewOpen]      = useState(false);
  const [pettyOpen,     setPettyOpen]    = useState(false);
  const [voucherExpense,setVoucherExpense] = useState<Expense | null>(null);
  const [search,        setSearch]       = useState("");
  const [statusFilter,  setStatus]       = useState<ExpenseStatus | "">("");
  const [projectFilter, setProject]      = useState<number | "">("");
  const [sortKey,       setSort]         = useState<SortKey>("id");
  const [sortDir,       setSortDir]      = useState<SortDir>("desc");
  const [page,          setPage]         = useState(1);

  // Auto-open new expense modal when navigated via FAB (?new=1)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setNewOpen(true);
      router.replace("/spending");
    }
  }, [searchParams, router]);

  const duplicateMutation = useMutation({
    mutationFn: (expense: Expense) =>
      expensesApi.create({
        project_id:     expense.project_id,
        cost_code_id:   expense.cost_code_id,
        cost_centre_id: expense.cost_centre_id ?? undefined,
        amount:         expense.amount,
        description:    expense.description,
        vendor_name:    expense.vendor_name ?? undefined,
        reference_no:   expense.reference_no ?? undefined,
      }),
    onSuccess: () => {
      toastSuccess("Duplicated successfully");
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e) => toastError("Duplicate failed", getErrorMessage(e)),
  });

  const { data: allExpenses = [], isLoading, refetch } = useQuery({
    queryKey: ["expenses", statusFilter, projectFilter],
    queryFn: () =>
      expensesApi.list({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(projectFilter ? { project_id: Number(projectFilter) } : {}),
        limit: 200,
      }).then((r) => r.data.items),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn:  () => projectsApi.list({ limit: 200 }).then((r) => r.data.items),
  });

  const { data: pettyReports = [] } = useQuery({
    queryKey: ["petty-cash-reports", projectFilter],
    queryFn: () =>
      pettyCashReportsApi.list({
        ...(projectFilter ? { project_id: Number(projectFilter) } : {}),
        limit: 20,
      }).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ["expenses-stats", projectFilter],
    queryFn: () =>
      expensesApi.stats(projectFilter ? { project_id: Number(projectFilter) } : undefined)
        .then((r) => r.data),
  });

  // Client-side sort + search
  const filtered = useMemo(() => {
    let rows = allExpenses.filter((e) =>
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      String(e.id).includes(search) ||
      (e.cost_code?.name ?? "").toLowerCase().includes(search.toLowerCase())
    );

    rows = [...rows].sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === "id")         { av = a.id;         bv = b.id; }
      else if (sortKey === "amount") { av = a.amount;    bv = b.amount; }
      else if (sortKey === "status") { av = a.status;    bv = b.status; }
      else                          { av = a.created_at; bv = b.created_at; }
      return sortDir === "asc"
        ? av < bv ? -1 : av > bv ? 1 : 0
        : av > bv ? -1 : av < bv ? 1 : 0;
    });
    return rows;
  }, [allExpenses, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSort(key); setSortDir("desc"); }
    setPage(1);
  }

  // Summary stats — sourced from server aggregation (no pagination limit)
  const pendingCount  = allExpenses.filter((e) =>
    ["submitted","verified"].includes(e.status)
  ).length;
  const pettyTotal = pettyReports.reduce((s, report) => s + Number(report.total_amount), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Spending</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Expenses & Petty Cash · {allExpenses.length} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<ClipboardList size={13} />}
            onClick={() => setPettyOpen(true)}
          >
            Petty Cash Report
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={13} />}
            onClick={() => setNewOpen(true)}
          >
            New Expense
          </Button>
        </div>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Logged",       value: formatCurrency(stats?.total_logged ?? 0),   color: "text-gray-900" },
          { label: "Approved / Paid",     value: formatCurrency(stats?.total_approved ?? 0), color: "text-green-600" },
          { label: "Petty Cash Batches",  value: `${pettyReports.length} · ${formatCurrency(pettyTotal)}`, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-card">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{s.label}</p>
            <p className={`num text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {pettyReports.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-card">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Petty Cash Reports</h2>
            </div>
            <span className="text-xs text-gray-400">{pendingCount} expense{pendingCount !== 1 ? "s" : ""} awaiting approval</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {pettyReports.slice(0, 6).map((report) => (
              <div key={report.id} className="rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800 truncate">{report.report_no}</p>
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">{report.status}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                  <span>{report.month} · {report.lines.length} lines</span>
                  <span className="num font-semibold text-gray-700">{formatCurrency(Number(report.total_amount))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search description, ID…"
            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white w-56 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value as ExpenseStatus | ""); setPage(1); }}
          className="text-xs border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-gray-600"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Project filter */}
        <select
          value={projectFilter}
          onChange={(e) => { setProject(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
          className="text-xs border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-gray-600 max-w-[180px]"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.code}</option>
          ))}
        </select>

        <div className="ml-auto text-xs text-gray-400 num">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Card padding={false}>
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <SortTh label="#"        field="id"         sort={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="th">Project</th>
                  <th className="th">Description</th>
                  <th className="th hidden md:table-cell">Cost Code</th>
                  <SortTh label="Amount"   field="amount"     sort={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortTh label="Status"   field="status"     sort={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortTh label="Date"     field="created_at" sort={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="th hidden lg:table-cell">Approver</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="td text-center text-gray-400 py-14">
                      No expenses match your filters
                    </td>
                  </tr>
                ) : (
                  pageRows.map((exp) => (
                    <tr
                      key={exp.id}
                      className={cn(
                        "hover:bg-gray-50/60 transition-colors",
                        exp.status === "rejected" && "bg-red-50/30"
                      )}
                    >
                      <td className="td num text-gray-400 text-xs">#{exp.id}</td>
                      <td className="td">
                        <span className="num text-xs font-semibold text-gray-500">
                          {projects.find((p) => p.id === exp.project_id)?.code ?? "—"}
                        </span>
                      </td>
                      <td className="td max-w-[180px]">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {exp.description}
                        </p>
                      </td>
                      <td className="td hidden md:table-cell">
                        <span className="text-xs text-gray-400 num">
                          {exp.cost_code?.code ?? "—"}
                        </span>
                      </td>
                      <td className="td text-right">
                        <span className="num font-semibold text-gray-900 text-sm">
                          {formatCurrency(exp.amount)}
                        </span>
                      </td>
                      <td className="td">
                        <ExpenseStatusBadge status={exp.status} />
                      </td>
                      <td className="td text-xs text-gray-400 hidden md:table-cell num whitespace-nowrap">
                        {fmtDateTime(exp.created_at)}
                      </td>
                      <td className="td hidden lg:table-cell">
                        {exp.current_approver_role ? (
                          <ApproverPill role={exp.current_approver_role} />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="td">
                        <ActionMenu
                          expense={exp}
                          onRefresh={() => qc.invalidateQueries({ queryKey: ["expenses"] })}
                          onDuplicate={(e) => duplicateMutation.mutate(e)}
                          onPrintVoucher={(e) => setVoucherExpense(e)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 num">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={cn(
                          "w-7 h-7 text-xs rounded-md transition-all",
                          page === n
                            ? "bg-gray-900 text-white font-semibold"
                            : "text-gray-500 hover:bg-gray-50 border border-gray-200"
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* FAB (mobile) */}
      <button
        onClick={() => setNewOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 sm:hidden z-30"
      >
        <Plus size={20} />
      </button>

      <NewExpenseModal open={newOpen} onClose={() => setNewOpen(false)} />
      <PettyCashReportModal open={pettyOpen} onClose={() => setPettyOpen(false)} />
      <ExpenseVoucherModal
        open={!!voucherExpense}
        onClose={() => setVoucherExpense(null)}
        expense={voucherExpense}
      />
    </div>
  );
}
