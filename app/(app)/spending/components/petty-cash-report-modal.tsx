"use client";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ClipboardPaste, Loader2, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { costCentresApi, costCodesApi, pettyCashReportsApi, projectsApi } from "@/lib/api";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/hooks/use-toast";

type Row = {
  id: string;
  date: string;
  description: string;
  amount: string;
  receipt_url: string;
  source?: "manual" | "clipboard" | "ocr";
  ocr_text?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

function newRow(): Row {
  return { id: crypto.randomUUID(), date: "", description: "", amount: "", receipt_url: "", source: "manual" };
}

function parseAmount(value: string) {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return Number.parseFloat(normalized) || 0;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return undefined;
  const [, d, m, y] = match;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseClipboardRows(text: string): Row[] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,/).map((cell) => cell.trim()))
    .map((cells) => {
      const hasDate = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$/.test(cells[0] || "");
      const date = hasDate ? cells[0] : "";
      const description = hasDate ? cells[1] : cells[0];
      const amount = hasDate ? cells[2] : cells[1];
      const receipt = hasDate ? cells[3] : cells[2];
      return {
        id: crypto.randomUUID(),
        date: date || "",
        description: description || "",
        amount: amount || "",
        receipt_url: receipt || "",
        source: "clipboard" as const,
      };
    })
    .filter((row) => row.description && parseAmount(row.amount) > 0);
}

export default function PettyCashReportModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [projectId, setProjectId] = useState("");
  const [costCodeId, setCostCodeId] = useState("");
  const [costCentreId, setCostCentreId] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then((r) => r.data.items),
    enabled: open,
  });
  const { data: costCodes = [] } = useQuery({
    queryKey: ["cost-codes"],
    queryFn: () => costCodesApi.list().then((r) => r.data),
    enabled: open,
  });
  const { data: costCentres = [] } = useQuery({
    queryKey: ["cost-centres"],
    queryFn: () => costCentresApi.list().then((r) => r.data),
    enabled: open,
  });

  const leafCodes = costCodes.filter((code) => code.parent_id !== null);
  const total = useMemo(() => rows.reduce((sum, row) => sum + parseAmount(row.amount), 0), [rows]);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  function addRows(pastedRows: Row[]) {
    setRows((current) => {
      const emptyOnly = current.length === 1 && !current[0].description && !current[0].amount;
      return emptyOnly ? pastedRows : [...current, ...pastedRows];
    });
  }

  function openPasteArea() {
    setShowPasteArea(true);
    // Auto-focus textarea after render
    setTimeout(() => pasteTextareaRef.current?.focus(), 50);
  }

  function handlePasteAreaChange(text: string) {
    if (!text.trim()) return;
    const parsed = parseClipboardRows(text);
    if (!parsed.length) {
      toastError("Paste failed", "No valid rows found. Expected columns: Date, Description, Amount (tab or comma-separated)");
      return;
    }
    addRows(parsed);
    toastSuccess("Rows pasted", `${parsed.length} item${parsed.length !== 1 ? "s" : ""} added`);
    setShowPasteArea(false);
  }

  function receiptRowFromOcr(text: string, fileName: string): Row {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const dateMatch = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
    const moneyMatches = Array.from(text.matchAll(/(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,})(?!\d)/gi))
      .map((match) => match[0])
      .filter((value) => parseAmount(value) > 0);
    const amount = moneyMatches
      .map((value) => ({ value, amount: parseAmount(value) }))
      .sort((a, b) => b.amount - a.amount)[0]?.value || "";
    const description = lines.find((line) =>
      !line.match(/\b(total|subtotal|tunai|cash|change|kembali|rp)\b/i) &&
      line.length >= 4
    ) || fileName.replace(/\.[^.]+$/, "");

    return {
      id: crypto.randomUUID(),
      date: dateMatch?.[1] || "",
      description,
      amount,
      receipt_url: fileName,
      source: "ocr",
      ocr_text: text,
    };
  }

  async function scanReceipts(files: FileList | null) {
    if (!files?.length) return;
    setOcrBusy(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const scannedRows: Row[] = [];
      const rawText: string[] = [];

      for (const file of Array.from(files)) {
        const result = await worker.recognize(file);
        const text = result.data.text.trim();
        rawText.push(`--- ${file.name} ---\n${text}`);
        scannedRows.push(receiptRowFromOcr(text, file.name));
      }

      await worker.terminate();
      setOcrText(rawText.join("\n\n"));
      addRows(scannedRows);
      toastSuccess("Receipt scanned", `${scannedRows.length} editable row${scannedRows.length !== 1 ? "s" : ""} added`);
    } catch (error) {
      toastError("OCR failed", getErrorMessage(error));
    } finally {
      setOcrBusy(false);
    }
  }

  const createBatch = useMutation({
    mutationFn: async () => {
      if (!projectId || !costCodeId) throw new Error("Select project and cost code first");
      const validRows = rows.filter((row) => row.description.trim() && parseAmount(row.amount) > 0);
      if (!validRows.length) throw new Error("Add at least one petty cash item");

      const response = await pettyCashReportsApi.create({
        month,
        project_id: Number(projectId),
        cost_code_id: Number(costCodeId),
        cost_centre_id: costCentreId ? Number(costCentreId) : undefined,
        title: `Petty Cash ${month}`,
        lines: validRows.map((row) => ({
          spent_on: normalizeDate(row.date),
          description: row.description.trim(),
          amount: parseAmount(row.amount),
          receipt_url: row.receipt_url || undefined,
          source: row.source ?? "manual",
          ocr_text: row.ocr_text || undefined,
        })),
      });
      return response.data;
    },
    onSuccess: (report) => {
      toastSuccess("Petty cash report created", `${report.lines.length} linked draft expense rows - ${formatCurrency(Number(report.total_amount))}`);
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["petty-cash-reports"] });
      setRows([newRow()]);
      onClose();
    },
    onError: (error) => toastError("Failed", getErrorMessage(error)),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Petty Cash Report"
      subtitle="Monthly batch entry with paste support from Excel or Sheets"
      size="xl"
      footer={
        <>
          <div className="mr-auto text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{rows.length}</span> rows · <span className="num font-bold text-gray-900">{formatCurrency(total)}</span>
          </div>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={createBatch.isPending} onClick={() => createBatch.mutate()}>
            Create Report
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input type="month" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project...">
            {projects.map((project) => <option key={project.id} value={project.id}>{project.code}</option>)}
          </Select>
          <Select label="Cost Code" value={costCodeId} onChange={(e) => setCostCodeId(e.target.value)} placeholder="Cost code...">
            {leafCodes.map((code) => <option key={code.id} value={code.id}>{code.code} · {code.name}</option>)}
          </Select>
          <Select label="Cost Centre" value={costCentreId} onChange={(e) => setCostCentreId(e.target.value)} placeholder="Cost centre...">
            {costCentres.map((centre) => <option key={centre.id} value={centre.id}>{centre.code} · {centre.name}</option>)}
          </Select>
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs text-gray-500">
              Copy rows from Excel or Sheets (Date, Description, Amount), then click <b>Paste Rows</b> and press <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono">Ctrl+V</kbd>.
            </p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
                {ocrBusy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                {ocrBusy ? "Scanning..." : "Scan Receipt"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => scanReceipts(event.target.files)}
                />
              </label>
              <Button variant="secondary" size="sm" icon={<ClipboardPaste size={13} />} onClick={openPasteArea}>
                Paste Rows
              </Button>
            </div>
          </div>

          {showPasteArea && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-[10px] font-mono">Ctrl+V</kbd> to paste your copied rows — or type/paste below, then click Import.
              </p>
              <textarea
                ref={pasteTextareaRef}
                rows={5}
                className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-mono text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                placeholder={"2026-05-10\tTaxi ke proyek\t85000\n2026-05-11\tMakan siang tim\t240000\n2026-05-12\tParkir\t15000"}
                onPaste={(e) => {
                  // Let paste land in textarea, then parse after React re-renders
                  const pasted = e.clipboardData.getData("text");
                  setTimeout(() => handlePasteAreaChange(pasted), 0);
                }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPasteArea(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ClipboardPaste size={13} />}
                  onClick={() => handlePasteAreaChange(pasteTextareaRef.current?.value ?? "")}
                >
                  Import Rows
                </Button>
              </div>
            </div>
          )}
          {ocrText && (
            <details className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600">OCR text preview</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-gray-500">{ocrText}</pre>
            </details>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed bg-white border border-gray-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="th w-[120px]">Date</th>
                  <th className="th">Description</th>
                  <th className="th w-[150px] text-right">Amount</th>
                  <th className="th w-[210px]">Receipt</th>
                  <th className="th w-[48px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td"><input className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5" value={row.date} onChange={(e) => updateRow(row.id, { date: e.target.value })} placeholder="2026-05-13" /></td>
                    <td className="td"><input className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5" value={row.description} onChange={(e) => updateRow(row.id, { description: e.target.value })} placeholder="Taxi, parking, meal..." /></td>
                    <td className="td"><input className="w-full text-xs text-right font-mono border border-gray-200 rounded-md px-2 py-1.5" value={row.amount} onChange={(e) => updateRow(row.id, { amount: e.target.value })} placeholder="0" /></td>
                    <td className="td"><input className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5" value={row.receipt_url} onChange={(e) => updateRow(row.id, { receipt_url: e.target.value })} placeholder="https://..." /></td>
                    <td className="td text-right">
                      <button type="button" className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setRows((current) => [...current, newRow()])}>
            Add Row
          </Button>
        </div>
      </div>
    </Modal>
  );
}
