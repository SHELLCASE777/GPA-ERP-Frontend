"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ChevronRight, Download, X } from "lucide-react";
import { hrisMeApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

function SlipDetailModal({ runId, onClose }: { runId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hris-me-payslip-detail", runId],
    queryFn: () => hrisMeApi.getPayslipDetail(runId).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
          <div>
            {data && (
              <>
                <p className="text-xs text-gray-400">Slip Gaji</p>
                <p className="text-base font-bold text-gray-900">
                  {MONTH_NAMES[(data.month ?? 1) - 1]} {data.year}
                </p>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {isLoading && (
          <div className="py-16 text-center text-sm text-gray-400">Memuat slip gaji...</div>
        )}

        {data && (
          <div className="p-5 space-y-4">
            {/* Employee info */}
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Karyawan</span>
                <span className="font-medium">{data.employee?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">No. Karyawan</span>
                <span className="font-medium">{data.employee?.employee_no}</span>
              </div>
              {data.employee?.bank_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank</span>
                  <span className="font-medium">{data.employee.bank_name} – {data.employee.bank_account}</span>
                </div>
              )}
            </div>

            {/* Allowances */}
            {data.components && data.components.filter((c) =>
              c.component_type !== "DEDUCTION" && c.component_type !== "BPJS" && c.component_type !== "TAX"
            ).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Penghasilan</p>
                <div className="space-y-1.5">
                  {data.components
                    .filter((c) => c.component_type !== "DEDUCTION" && c.component_type !== "BPJS" && c.component_type !== "TAX")
                    .map((c, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{c.component_name}</span>
                        <span className="font-medium">{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  {data.thr_amount ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">THR</span>
                      <span className="font-medium text-amber-600">{formatCurrency(data.thr_amount)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-between text-sm font-semibold border-t mt-2 pt-2">
                  <span>Gaji Kotor</span>
                  <span>{formatCurrency(data.gross_salary)}</span>
                </div>
              </div>
            )}

            {/* Deductions */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Potongan</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">BPJS TK (Karyawan)</span>
                  <span className="font-medium text-red-600">- {formatCurrency(data.bpjs_tk_employee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">BPJS Kes (Karyawan)</span>
                  <span className="font-medium text-red-600">- {formatCurrency(data.bpjs_kes_employee)}</span>
                </div>
                {data.pph21_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      PPh 21 {data.pph21_method === "GROSS_UP" ? "(Ditanggung Perusahaan)" : ""}
                    </span>
                    <span className={cn("font-medium", data.pph21_method === "GROSS_UP" ? "text-gray-400" : "text-red-600")}>
                      {data.pph21_method === "GROSS_UP" ? "ditanggung" : `- ${formatCurrency(data.pph21_amount)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Net */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-teal-900">Gaji Bersih (Take Home)</span>
                <span className="text-lg font-bold text-teal-700">{formatCurrency(data.net_salary)}</span>
              </div>
            </div>

            {/* Employer BPJS (informational) */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Kontribusi Perusahaan (BPJS)</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>BPJS TK (Perusahaan)</span>
                  <span>{formatCurrency(data.bpjs_tk_employer)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>BPJS Kes (Perusahaan)</span>
                  <span>{formatCurrency(data.bpjs_kes_employer)}</span>
                </div>
              </div>
            </div>

            {/* Download PDF */}
            {data.pdf_url && (
              <a href={data.pdf_url} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 border-teal-600 text-white text-sm">
                  <Download size={14} className="mr-2" /> Unduh Slip PDF
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyPayslipPage() {
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["hris-me-payslips"],
    queryFn: () => hrisMeApi.getPayslips().then((r) => r.data),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Slip Gaji Saya</h1>

      {isLoading && (
        <div className="py-12 text-center text-sm text-gray-400">Memuat...</div>
      )}

      <div className="space-y-2">
        {(payslips ?? []).map((slip) => (
          <button
            key={slip.run_id}
            className="w-full text-left"
            onClick={() => setSelectedRunId(slip.run_id)}
          >
            <Card className="border hover:border-teal-300 transition-colors">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {MONTH_NAMES[slip.month - 1]} {slip.year}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kotor: {formatCurrency(slip.gross_salary)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-base font-bold text-teal-700">{formatCurrency(slip.net_salary)}</p>
                      {slip.thr_amount ? (
                        <Badge className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 mt-0.5">
                          + THR
                        </Badge>
                      ) : null}
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </Card>
          </button>
        ))}

        {!isLoading && payslips?.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            <Banknote size={36} className="mx-auto mb-3 opacity-30" />
            Slip gaji akan muncul di sini setelah payroll diproses
          </div>
        )}
      </div>

      {selectedRunId && (
        <SlipDetailModal runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
      )}
    </div>
  );
}
