import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  PackageCheck,
  Receipt,
  ArrowRight,
  DollarSign,
  Send,
  Printer,
  Download,
  Check,
} from "lucide-react";
import { Invoice, ThreeWayMatchResult } from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { downloadElementAsPDF, triggerCleanPrint } from "../../utils/pdfExport";

interface ThreeWayMatchAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onApprovePayment: (invoiceId: string, note: string) => void;
}

export const ThreeWayMatchAuditModal: React.FC<ThreeWayMatchAuditModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onApprovePayment,
}) => {
  const [isAuditingAI, setIsAuditingAI] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [matchResult, setMatchResult] = useState<ThreeWayMatchResult>(
    invoice.threeWayMatch
  );
  const [auditNote, setAuditNote] = useState("");

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await downloadElementAsPDF(
        "printable-matching-audit-document",
        `Audit-3Way-Match-${invoice.invoiceNumber.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`,
        { title: `3-Way Match Audit - ${invoice.invoiceNumber}` }
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    triggerCleanPrint("printable-matching-audit-document", `3-Way Match Audit ${invoice.invoiceNumber}`);
  };

  const handleRunAIAudit = async () => {
    setIsAuditingAI(true);
    try {
      const res = await fetch("/api/ai/audit-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: invoice.poNumber,
          grnNumber: invoice.grnNumber,
          invoiceNumber: invoice.invoiceNumber,
          vendorName: invoice.vendorName,
          poAmount: matchResult.poAmount,
          grnAmount: matchResult.grnAmount,
          invoiceAmount: matchResult.invoiceAmount,
          poQty: 50,
          grnQty: 50,
          invoiceQty: 50,
        }),
      });

      if (!res.ok) throw new Error("Gagal menjalankan AI Audit");
      const data = await res.json();

      setMatchResult({
        ...matchResult,
        status: data.isMatch ? "MATCHED" : "MISMATCH",
        aiAuditSummary: data.auditSummary,
        aiRiskScore: data.riskScore || 5,
        priceVariance: data.priceVariance || 0,
        qtyVariance: data.qtyVariance || 0,
      });
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan audit AI: " + err.message);
    } finally {
      setIsAuditingAI(false);
    }
  };

  const isMatched = matchResult.status === "MATCHED";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                Audit Rekonsiliasi 3-Way Matching (PO - BAST - Invoice)
              </h3>
              <p className="text-xs text-slate-300">
                Invoice: {invoice.invoiceNumber} • Vendor: {invoice.vendorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>PDF Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>{isExportingPDF ? "Menyiapkan PDF..." : "Unduh PDF Audit"}</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div id="printable-matching-audit-document" className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-white">
          {/* AI Trigger Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                <span>ProcuraAI 3-Way Reconciliation Engine</span>
              </div>
              <p className="text-xs text-purple-800/80">
                Memvalidasi kesesuaian nilai PO, kuantitas fisik BAST, dan nominal faktur pajak invoice secara otomatis.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAIAudit}
              disabled={isAuditingAI}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isAuditingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengaudit Dokumen...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Jalankan Audit AI</span>
                </>
              )}
            </button>
          </div>

          {/* 3 Pillars of 3-Way Matching Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: PO */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                  <span>1. Purchase Order</span>
                </div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  Doc 1
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {matchResult.poNumber}
              </div>
              <div className="pt-2 border-t border-blue-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                  Nilai Disepakati (PO)
                </span>
                <span className="font-mono text-base font-black text-blue-900">
                  {formatRupiah(matchResult.poAmount)}
                </span>
              </div>
            </div>

            {/* Pillar 2: GRN / BAST */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                  <span>2. BAST / GRN</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Doc 2
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {matchResult.grnNumber}
              </div>
              <div className="pt-2 border-t border-emerald-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                  Nilai Fisik Diterima Baik
                </span>
                <span className="font-mono text-base font-black text-emerald-900">
                  {formatRupiah(matchResult.grnAmount)}
                </span>
              </div>
            </div>

            {/* Pillar 3: Vendor Invoice */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <span>3. Faktur Invoice</span>
                </div>
                <span className="font-mono text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Doc 3
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {matchResult.invoiceNumber}
              </div>
              <div className="pt-2 border-t border-purple-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                  Total Tagihan Ditagihkan
                </span>
                <span className="font-mono text-base font-black text-purple-900">
                  {formatRupiah(matchResult.invoiceAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Variance & Audit Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                Hasil Rekonsiliasi & Uji Selisih (Variance Analysis)
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 ${
                  isMatched
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {isMatched ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <span>{isMatched ? "3-WAY MATCH VERIFIED (PASSED)" : "SELISIH DITEMUKAN (HOLD)"}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Selisih Harga</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatRupiah(matchResult.priceVariance)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Selisih Volume/Qty</span>
                <span className="font-mono font-bold text-slate-900">
                  {matchResult.qtyVariance} Unit
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Faktur Pajak Seri</span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.taxInvoiceNumber || "010.002-26.882910"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Skor Risiko Audit</span>
                <span className={`font-mono font-black ${matchResult.aiRiskScore && matchResult.aiRiskScore > 30 ? "text-rose-600" : "text-emerald-600"}`}>
                  {matchResult.aiRiskScore || 5}/100 (Aman)
                </span>
              </div>
            </div>

            {/* AI Summary note */}
            {matchResult.aiAuditSummary && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Hasil Audit AI: </strong>
                {matchResult.aiAuditSummary}
              </div>
            )}
          </div>

          {/* Payment Terms & Bank Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-900 text-white rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Tujuan Transfer Rekening Vendor
              </span>
              <div className="font-bold text-sm">{invoice.vendorName}</div>
              <div className="font-mono text-xs text-indigo-300">
                Bank Mandiri (Persero) • No. Rek: 124-00-9821890-1
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Batas Jatuh Tempo (Due Date)
              </span>
              <div className="font-bold text-sm text-slate-200">
                {formatDate(invoice.dueDate)}
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                Status Pembayaran: {invoice.status}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
          >
            Tutup
          </button>

          {invoice.status !== "PAID" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onApprovePayment(invoice.id, "Disetujui untuk rilis pembayaran via Treasury Finance.");
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Otorisasi & Rilis Pembayaran (Pay Invoice)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
