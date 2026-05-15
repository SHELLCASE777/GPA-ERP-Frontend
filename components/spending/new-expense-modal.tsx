"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Paperclip, Camera, ClipboardPaste, Loader2, X, FileImage } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { projectsApi, costCodesApi, costCentresApi, expensesApi } from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/hooks/use-toast";
import { getErrorMessage, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import type { CostCode } from "@/lib/types";

const schema = z.object({
  project_id:    z.coerce.number().min(1, "Select a project"),
  cost_code_id:  z.coerce.number().min(1, "Select a cost code"),
  cost_centre_id: z.coerce.number().optional(),
  amount:        z.coerce.number().min(0.01, "Amount must be > 0"),
  description:   z.string().min(3, "At least 3 characters"),
  vendor_name:   z.string().max(255).optional().or(z.literal("")),
  reference_no:  z.string().max(100).optional().or(z.literal("")),
  receipt_url:   z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; }

export default function NewExpenseModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => expensesApi.uploadReceipt(file),
    onSuccess: (res) => {
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${res.data.url}`;
      setValue("receipt_url", fullUrl, { shouldValidate: true });
      setUploadedFilename(res.data.filename || res.data.url.split("/").pop() || "file");
      toastSuccess("Receipt uploaded", res.data.filename ?? "");
    },
    onError: (err) => toastError("Upload failed", getErrorMessage(err)),
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  }

  const { register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const projectId = watch("project_id");

  // Load projects + cost codes
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

  // Group cost codes by category
  const categories = Array.from(new Set(costCodes.map((c) => c.category)));
  const filteredCodes = selectedCategory
    ? costCodes.filter((c) => c.category === selectedCategory && c.parent_id !== null)
    : costCodes.filter((c) => c.parent_id !== null); // only leaf codes

  const createMutation = useMutation({
    mutationFn: (data: FormData) => expensesApi.create({
      ...data,
      cost_centre_id: data.cost_centre_id && data.cost_centre_id > 0 ? data.cost_centre_id : undefined,
    }),
    onSuccess: (res) => {
      toastSuccess("Expense created", `Draft #${res.data.id} - ${formatCurrency(res.data.amount)}`);
      qc.invalidateQueries({ queryKey: ["expenses"] });
      reset();
      setAmountDisplay("");
      setSelectedCategory(null);
      setUploadedFilename(null);
      onClose();
    },
    onError: (err) => toastError("Failed to create expense", getErrorMessage(err)),
  });

  function handleClose() {
    reset(); setAmountDisplay(""); setSelectedCategory(null); setUploadedFilename(null);
    onClose();
  }

  // Format amount display with commas
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw   = e.target.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const int   = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setAmountDisplay(parts.length > 1 ? `${int}.${parts[1].slice(0, 2)}` : int);
    setValue("amount", parseFloat(raw) || 0, { shouldValidate: true });
  }

  // Handle paste from clipboard
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const num  = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) {
        setValue("amount", num, { shouldValidate: true });
        setAmountDisplay(num.toLocaleString("en", { maximumFractionDigits: 2 }));
      }
    } catch {}
  }

  const selectedProject = projects.find((p) => p.id === Number(projectId));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Expense"
      subtitle="Create a draft expense — submit it when ready for approval"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={isSubmitting || createMutation.isPending}
            onClick={handleSubmit((d) => createMutation.mutate(d))}
          >
            Create Draft
          </Button>
        </>
      }
    >
      <form className="space-y-4 text-sm" onSubmit={(e) => e.preventDefault()}>
        {/* Project */}
        <Select
          label="Project"
          placeholder="Select project…"
          error={errors.project_id?.message}
          {...register("project_id")}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
            </option>
          ))}
        </Select>

        {/* Budget indicator */}
        {selectedProject && (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs">
            <span className="text-gray-500">Available budget</span>
            <span className={`num font-semibold ${
              selectedProject.budget < 0 ? "text-red-600" : "text-green-600"
            }`}>
              {formatCurrency(selectedProject.budget)}
            </span>
          </div>
        )}

        {/* Category + Cost Code (cascading) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Category
            </label>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => {
                setSelectedCategory(e.target.value || null);
                setValue("cost_code_id", 0);
              }}
              className="w-full min-w-0 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 cursor-pointer"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Select
            label="Cost Code"
            placeholder="Select code…"
            error={errors.cost_code_id?.message}
            className="text-xs"
            {...register("cost_code_id")}
          >
            {filteredCodes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Cost Centre"
          placeholder="Source of money..."
          className="text-xs"
          {...register("cost_centre_id")}
        >
          {costCentres.map((centre) => (
            <option key={centre.id} value={centre.id}>
              {centre.code} · {centre.name}
            </option>
          ))}
        </Select>

        {/* Amount */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                {getCurrencySymbol()}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-xs border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={pasteFromClipboard}
              title="Paste from clipboard"
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ClipboardPaste size={15} />
            </button>
          </div>
          {errors.amount && (
            <p className="text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Brief description of the expense…"
          error={errors.description?.message}
          {...register("description")}
        />

        {/* Vendor + Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Vendor / Supplier"
            placeholder="e.g. PT Sumber Jaya"
            className="text-xs"
            {...register("vendor_name")}
          />
          <Input
            label="Reference No."
            placeholder="e.g. INV-2026-001"
            className="text-xs"
            {...register("reference_no")}
          />
        </div>

        {/* Receipt */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Receipt (optional)
          </label>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex gap-2 items-start">
            <Input
              placeholder="https://drive.google.com/… or paste link"
              error={errors.receipt_url?.message}
              className="flex-1 min-w-0 text-xs"
              {...register("receipt_url")}
            />
            <button
              type="button"
              title="Take photo"
              disabled={uploadMutation.isPending}
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending
                ? <Loader2 size={15} className="animate-spin" />
                : <Camera size={15} />}
            </button>
            <button
              type="button"
              title="Attach file (JPG, PNG, PDF — max 10 MB)"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Paperclip size={15} />
            </button>
          </div>

          {/* Uploaded file chip */}
          {uploadedFilename && (
            <div className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg w-fit max-w-full">
              <FileImage size={12} className="text-green-600 shrink-0" />
              <span className="text-[11px] text-green-700 truncate max-w-[200px]">{uploadedFilename}</span>
              <button
                type="button"
                onClick={() => { setValue("receipt_url", ""); setUploadedFilename(null); }}
                className="text-green-500 hover:text-green-700 shrink-0"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-400">
            Upload langsung (JPG, PNG, PDF, maks 10 MB) atau tempel link Google Drive / SharePoint
          </p>
        </div>
      </form>
    </Modal>
  );
}
