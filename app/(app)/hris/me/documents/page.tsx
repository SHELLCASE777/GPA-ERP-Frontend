"use client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, ChevronLeft, Banknote, FolderOpen } from "lucide-react";
import Link from "next/link";
import { hrisMeApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, fmtDate } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "";

export default function MyDocumentsPage() {
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["hris", "me", "documents"],
    queryFn: () => hrisMeApi.getDocuments().then((r) => r.data),
  });

  const payslips  = docs.filter(d => d.doc_type === "payslip");
  const empDocs   = docs.filter(d => d.doc_type !== "payslip");

  const EMP_DOC_LABELS: Record<string, string> = {
    KTP: "KTP", NPWP: "NPWP", BPJS_TK: "BPJS TK", BPJS_KES: "BPJS Kesehatan",
    IJAZAH: "Ijazah", SKCK: "SKCK", OTHER: "Lainnya",
  };

  function handleDownload(url: string, filename: string) {
    // Build full URL if relative
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const a = document.createElement("a");
    a.href = fullUrl;
    a.download = filename;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Back link */}
      <Link href="/hris/me" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition-colors w-fit">
        <ChevronLeft size={15} />
        Kembali ke Portal
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dokumen Saya</h1>
        <p className="text-sm text-gray-400 mt-0.5">Slip gaji dan dokumen karyawan yang dapat diunduh</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <>
          {/* Slip Gaji */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Banknote size={15} className="text-orange-500" />
              <h2 className="text-sm font-semibold text-gray-800">Slip Gaji</h2>
              <Badge className="ml-auto text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                {payslips.length} file
              </Badge>
            </div>
            {payslips.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Slip gaji belum tersedia
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {payslips.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <Banknote size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                      <p className="text-[11px] text-gray-400">{doc.period_label ?? fmtDate(doc.date)}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.file_url, doc.name)}
                      className="text-gray-400 hover:text-teal-600 transition-colors p-1.5 rounded-lg hover:bg-teal-50"
                      title="Unduh">
                      <Download size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Dokumen Karyawan */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FolderOpen size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-800">Dokumen Karyawan</h2>
              <Badge className="ml-auto text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                {empDocs.length} file
              </Badge>
            </div>
            {empDocs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Belum ada dokumen yang diunggah HR
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {empDocs.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {EMP_DOC_LABELS[doc.doc_type] ?? doc.doc_type}
                      </p>
                      <p className="text-[11px] text-gray-400">{fmtDate(doc.date)}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.file_url, doc.name)}
                      className="text-gray-400 hover:text-teal-600 transition-colors p-1.5 rounded-lg hover:bg-teal-50"
                      title="Unduh">
                      <Download size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
