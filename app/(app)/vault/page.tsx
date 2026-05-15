"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Plus, Pencil, Trash2, CheckCircle, X, Search,
} from "lucide-react";
import { vaultApi, costCodesApi } from "@/lib/api";
import { formatCurrency, fmtDateTime, ROLE_LABEL, getErrorMessage } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toastSuccess, toastError } from "@/lib/hooks/use-toast";
import { ProtectedRoute } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type {
  ApprovalRule, ApprovalRuleCreate, CostCode, CostCodeCreate,
  CostCodeCategory, RoleName,
} from "@/lib/types";

const TABS = ["Approval Matrix", "Cost Codes", "Audit Log"] as const;
type VaultTab = typeof TABS[number];

const COST_CODE_CATS: CostCodeCategory[] = ["Direct", "Site", "Personnel", "Overhead", "Other"];
const ROLES: RoleName[] = ["SUPER_ADMIN", "MD", "PM", "COST_CONTROL", "FINANCE", "GA", "STAFF"];

const CATEGORY_COLORS: Record<string, string> = {
  Direct:    "bg-blue-50 text-blue-700 border-blue-200",
  Site:      "bg-green-50 text-green-700 border-green-200",
  Personnel: "bg-purple-50 text-purple-700 border-purple-200",
  Overhead:  "bg-amber-50 text-amber-700 border-amber-200",
  Other:     "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Approval Matrix ───────────────────────────────────────────────────────────
function ApprovalMatrixTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApprovalRule | null>(null);
  const [form, setForm] = useState<ApprovalRuleCreate>({
    min_amount: 0, required_role: "PM", priority: 10,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["approval-rules"],
    queryFn: () => vaultApi.listRules().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => editing ? vaultApi.updateRule(editing.id, form) : vaultApi.createRule(form),
    onSuccess: () => {
      toastSuccess(editing ? "Rule updated" : "Rule created");
      qc.invalidateQueries({ queryKey: ["approval-rules"] });
      setShowForm(false);
      setEditing(null);
      setForm({ min_amount: 0, required_role: "PM", priority: 10 });
    },
    onError: (e) => toastError("Failed", getErrorMessage(e)),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => vaultApi.deactivateRule(id),
    onSuccess: () => {
      toastSuccess("Rule deactivated");
      qc.invalidateQueries({ queryKey: ["approval-rules"] });
    },
    onError: (e) => toastError("Failed", getErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {rules.length} active rule{rules.length !== 1 ? "s" : ""} — applied at expense submit time
        </p>
        <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => {
          setEditing(null);
          setForm({ min_amount: 0, required_role: "PM", priority: 10 });
          setShowForm((v) => !v);
        }}>
          Add Rule
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">{editing ? "Edit Approval Rule" : "New Approval Rule"}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Amount (IDR) *</label>
              <input
                type="number"
                value={form.min_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_amount: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Amount (empty = unlimited)</label>
              <input
                type="number"
                value={form.max_amount ?? ""}
                onChange={(e) => setForm((f) => ({
                  ...f, max_amount: e.target.value ? Number(e.target.value) : undefined,
                }))}
                placeholder="∞"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Required Role *</label>
              <select
                value={form.required_role}
                onChange={(e) => setForm((f) => ({ ...f, required_role: e.target.value as RoleName }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority (lower = checked first)</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Category filter (optional)</label>
              <select
                value={form.cost_code_category ?? ""}
                onChange={(e) => setForm((f) => ({
                  ...f, cost_code_category: e.target.value ? e.target.value as CostCodeCategory : undefined,
                }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Any category</option>
                {COST_CODE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              onClick={() => create.mutate()}
              disabled={create.isPending}
            >
              {create.isPending ? "Saving..." : editing ? "Save Rule" : "Create Rule"}
            </Button>
          </div>
        </Card>
      )}

      <Card padding={false}>
        {isLoading ? <TableSkeleton rows={5} cols={6} /> : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Priority</th>
                <th className="th">Amount Range</th>
                <th className="th hidden md:table-cell">Category</th>
                <th className="th">Required Role</th>
                <th className="th">Status</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td text-center text-gray-400 py-8 text-xs">
                    No rules defined yet — click Add Rule to create one
                  </td>
                </tr>
              ) : rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="td">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="td num text-sm font-semibold text-gray-800">
                    {formatCurrency(rule.min_amount)} – {rule.max_amount ? formatCurrency(rule.max_amount) : "∞"}
                  </td>
                  <td className="td hidden md:table-cell">
                    <span className="text-xs text-gray-500">
                      {rule.cost_code_category ?? "Any"}
                    </span>
                  </td>
                  <td className="td">
                    <Badge className="bg-primary-50 text-primary border-primary/20">
                      {ROLE_LABEL[rule.required_role] ?? rule.required_role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="td">
                    {rule.is_active ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200" dot>Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200">Inactive</Badge>
                    )}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => {
                        setEditing(rule);
                        setForm({
                          min_amount: rule.min_amount,
                          max_amount: rule.max_amount ?? undefined,
                          cost_code_category: rule.cost_code_category ?? undefined,
                          required_role: rule.required_role,
                          priority: rule.priority,
                        });
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mr-1"
                      title="Edit rule"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Deactivate this rule?"))
                          deactivate.mutate(rule.id);
                      }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Deactivate rule"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── Cost Codes ────────────────────────────────────────────────────────────────
function CostCodesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CostCodeCreate>({ code: "", name: "", category: "Direct" });

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["cost-codes"],
    queryFn: () => costCodesApi.list(false).then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => costCodesApi.create(form),
    onSuccess: () => {
      toastSuccess("Cost code created");
      qc.invalidateQueries({ queryKey: ["cost-codes"] });
      setShowForm(false);
      setForm({ code: "", name: "", category: "Direct" });
    },
    onError: (e) => toastError("Failed", getErrorMessage(e)),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => costCodesApi.deactivate(id),
    onSuccess: () => {
      toastSuccess("Cost code deactivated");
      qc.invalidateQueries({ queryKey: ["cost-codes"] });
    },
    onError: (e) => toastError("Failed", getErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{codes.length} cost codes</p>
        <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setShowForm((v) => !v)}>
          Add Code
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">New Cost Code</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="D-001"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CostCodeCategory }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {COST_CODE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Material & Equipment"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.code || !form.name}
            >
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </Card>
      )}

      <Card padding={false}>
        {isLoading ? <TableSkeleton rows={6} cols={5} /> : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Code</th>
                <th className="th">Name</th>
                <th className="th hidden md:table-cell">Category</th>
                <th className="th hidden lg:table-cell">Parent</th>
                <th className="th">Active</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td text-center text-gray-400 py-8 text-xs">
                    No cost codes yet — click Add Code to create one
                  </td>
                </tr>
              ) : codes.map((cc) => (
                <tr key={cc.id} className={cn("hover:bg-gray-50/50 transition-colors", !cc.is_active && "opacity-50")}>
                  <td className="td num text-xs font-semibold text-gray-500">{cc.code}</td>
                  <td className="td">
                    <span className={`text-sm font-medium text-gray-900 ${cc.parent_id ? "pl-3 border-l-2 border-gray-200" : "font-semibold"}`}>
                      {cc.name}
                    </span>
                  </td>
                  <td className="td hidden md:table-cell">
                    <Badge className={cn("border", CATEGORY_COLORS[cc.category] ?? "bg-gray-100 text-gray-500 border-gray-200")}>
                      {cc.category}
                    </Badge>
                  </td>
                  <td className="td hidden lg:table-cell num text-xs text-gray-400">
                    {cc.parent_id ?? "—"}
                  </td>
                  <td className="td">
                    {cc.is_active
                      ? <CheckCircle size={14} className="text-green-500" />
                      : <span className="text-xs text-gray-300">Inactive</span>
                    }
                  </td>
                  <td className="td">
                    {cc.is_active && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Deactivate ${cc.code}?`))
                            deactivate.mutate(cc.id);
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
function AuditLogTab() {
  const [entityFilter, setEntityFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-log", entityFilter],
    queryFn: () => vaultApi.auditLog(
      entityFilter ? { entity_type: entityFilter } : undefined
    ).then((r) => r.data),
  });

  const ENTITY_TYPES = Array.from(new Set(logs.map((l) => l.entity_type))).sort();

  const filtered = search
    ? logs.filter((l) =>
        l.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        String(l.entity_id).includes(search)
      )
    : logs;

  const ACTION_COLORS: Record<string, string> = {
    CREATE:     "bg-green-50 text-green-700 border-green-200",
    UPDATE:     "bg-blue-50 text-blue-700 border-blue-200",
    DELETE:     "bg-red-50 text-red-700 border-red-200",
    DEACTIVATE: "bg-orange-50 text-orange-700 border-orange-200",
    CANCEL:     "bg-red-50 text-red-700 border-red-200",
    IMPORT:     "bg-purple-50 text-purple-700 border-purple-200",
    SUBMIT:     "bg-cyan-50 text-cyan-700 border-cyan-200",
    APPROVE:    "bg-green-50 text-green-700 border-green-200",
    REJECT:     "bg-red-50 text-red-700 border-red-200",
    PAY:        "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entity, action, ID…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <p className="text-xs text-gray-400 ml-auto">{filtered.length} entries</p>
      </div>

      <Card padding={false}>
        {isLoading ? <TableSkeleton rows={8} cols={5} /> : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Timestamp</th>
                <th className="th">Entity</th>
                <th className="th">Action</th>
                <th className="th hidden md:table-cell">User</th>
                <th className="th hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td text-center text-gray-400 py-10 text-xs">
                    No audit entries found
                  </td>
                </tr>
              ) : filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="td">
                    <span className="text-xs text-gray-500 num">{fmtDateTime(log.created_at)}</span>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-700">{log.entity_type}</span>
                      <span className="num text-[10px] text-gray-400">#{log.entity_id}</span>
                    </div>
                  </td>
                  <td className="td">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide",
                      ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600 border-gray-200"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="td hidden md:table-cell">
                    <span className="num text-xs text-gray-500">
                      {log.changed_by ? `#${log.changed_by}` : "—"}
                    </span>
                  </td>
                  <td className="td hidden lg:table-cell">
                    <span className="text-xs text-gray-400 font-mono">
                      {log.ip_address ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VaultPage() {
  const [tab, setTab] = useState<VaultTab>("Approval Matrix");

  return (
    <ProtectedRoute
      roles={["SUPER_ADMIN"]}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldCheck size={36} className="text-gray-300 mb-4" />
          <p className="text-sm font-semibold text-gray-500">Access Restricted</p>
          <p className="text-xs text-gray-400 mt-1">The Vault is only accessible to Super Admins.</p>
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
            <ShieldCheck size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vault</h1>
            <p className="text-sm text-gray-400">Super Admin · System configuration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                tab === t ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Approval Matrix" && <ApprovalMatrixTab />}
        {tab === "Cost Codes"      && <CostCodesTab />}
        {tab === "Audit Log"       && <AuditLogTab />}
      </div>
    </ProtectedRoute>
  );
}
