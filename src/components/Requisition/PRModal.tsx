import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  Calendar,
  Printer,
  Download,
  Check,
} from "lucide-react";
import {
  PurchaseRequisition,
  PRItem,
  Department,
  UserRole,
} from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { downloadElementAsPDF, triggerCleanPrint } from "../../utils/pdfExport";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { transformPRToSASDoc } from "../../utils/sasDocumentTransformer";

interface PRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePR: (pr: PurchaseRequisition) => void;
  onApprovePR?: (prId: string, note: string) => void;
  onRejectPR?: (prId: string, note: string) => void;
  onConvertToRFQ?: (pr: PurchaseRequisition) => void;
  selectedPR?: PurchaseRequisition | null;
  currentRole: UserRole;
}

export const PRModal: React.FC<PRModalProps> = ({
  isOpen,
  onClose,
  onSavePR,
  onApprovePR,
  onRejectPR,
  onConvertToRFQ,
  selectedPR,
  currentRole,
}) => {
  const isViewMode = !!selectedPR;
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showOfficialSASDoc, setShowOfficialSASDoc] = useState(false);

  const [title, setTitle] = useState(selectedPR?.title || "");
  const [department, setDepartment] = useState<Department>(
    selectedPR?.department || "IT & Infrastructure"
  );
  const [category, setCategory] = useState(
    selectedPR?.category || "IT & Infrastructure"
  );
  const [urgency, setUrgency] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">(
    selectedPR?.urgency || "NORMAL"
  );
  const [justification, setJustification] = useState(
    selectedPR?.justification || ""
  );
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    selectedPR?.targetDeliveryDate || "2026-09-30"
  );
  const [items, setItems] = useState<PRItem[]>(
    selectedPR?.items || [
      {
        id: "item-1",
        name: "",
        specification: "",
        quantity: 1,
        unit: "Unit",
        estimatedPrice: 0,
        totalPrice: 0,
      },
    ]
  );

  const [approvalNote, setApprovalNote] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedFeedback, setAiGeneratedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalEstimatedBudget = items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: "",
        specification: "",
        quantity: 1,
        unit: "Unit",
        estimatedPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof PRItem,
    value: any
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "estimatedPrice") {
      const q = field === "quantity" ? Number(value) : item.quantity;
      const p = field === "estimatedPrice" ? Number(value) : item.estimatedPrice;
      item.totalPrice = (q || 0) * (p || 0);
    }
    updated[index] = item;
    setItems(updated);
  };

  // AI Assistant: Generate Specs & HPS from Title & Justification
  const handleAIGenerateSpecs = async () => {
    if (!title) {
      setAiError("Mohon masukkan Judul Pengadaan terlebih dahulu untuk dianalisis oleh AI.");
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);
    setAiGeneratedFeedback(null);

    try {
      const res = await fetch("/api/ai/generate-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          budget: totalEstimatedBudget || 100000000,
          description: justification,
          urgency,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal terhubung ke AI Service");
      }

      const data = await res.json();
      if (data && Array.isArray(data.technicalSpecs) && data.technicalSpecs.length > 0) {
        const generatedItems: PRItem[] = data.technicalSpecs.map((spec: any, idx: number) => {
          const qty = Number(spec.qty || spec.quantity) || 1;
          const price = Number(spec.hpsUnit || spec.estimatedUnitPrice || spec.price) || 10000000;
          return {
            id: `ai-item-${idx}-${Date.now()}`,
            name: spec.item || spec.name || "Item Pengadaan",
            specification: spec.specification || spec.specs || "",
            quantity: qty,
            unit: spec.unit || "Unit",
            estimatedPrice: price,
            totalPrice: qty * price,
          };
        });

        setItems(generatedItems);
        setAiGeneratedFeedback(
          `✨ AI berhasil menyusun ${generatedItems.length} rincian spesifikasi teknis dan estimasi HPS standar industri.`
        );
      } else {
        setAiGeneratedFeedback("✨ Spesifikasi teknis telah diperbarui.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Gagal memproses rekomendasi AI.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Harap isi judul pengadaan");
      return;
    }

    const newPR: PurchaseRequisition = {
      id: selectedPR?.id || `pr-${Date.now()}`,
      prNumber: selectedPR?.prNumber || `PR/2026/${new Date().getMonth() + 1}/${department.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      department,
      requesterName: selectedPR?.requesterName || "Aulia Khairunnisa, S.T. (Procurement User)",
      requesterEmail: selectedPR?.requesterEmail || "aulia.kh@enterprise.corp",
      category,
      urgency,
      justification,
      estimatedBudget: totalEstimatedBudget,
      items,
      status: selectedPR?.status || "PENDING_DEPT_HEAD",
      submissionDate: selectedPR?.submissionDate || new Date().toISOString().split("T")[0],
      targetDeliveryDate,
      approvalHistory: selectedPR?.approvalHistory || [
        {
          stage: "Draft Submission",
          approver: "Aulia Khairunnisa (User)",
          status: "APPROVED",
          timestamp: new Date().toLocaleString("id-ID"),
          note: "Dokumen Permintaan Pembelian (PR) diajukan ke Dept Head.",
        },
      ],
    };

    onSavePR(newPR);
    onClose();
  };

  const handleDownloadPDF = async () => {
    if (selectedPR) {
      setIsExportingPDF(true);
      try {
        await downloadElementAsPDF(
          "printable-pr-document",
          `Purchase-Requisition-${selectedPR.prNumber.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`,
          { title: `Purchase Requisition - ${selectedPR.prNumber}` }
        );
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExportingPDF(false);
      }
    }
  };

  const handlePrint = () => {
    triggerCleanPrint("printable-pr-document", `Purchase Requisition ${selectedPR?.prNumber || ""}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                {isViewMode ? `Detail Permintaan: ${selectedPR.prNumber}` : "Buat Purchase Requisition (PR) Baru"}
              </h3>
              <p className="text-xs text-slate-300">
                Dokumen pengajuan pengadaan barang/jasa unit kerja terintegrasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isViewMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowOfficialSASDoc(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Tampilkan dalam Format Resmi PT SAS Aero Sishan (A4)"
                >
                  <FileText className="h-4 w-4" />
                  <span>Format Resmi SAS</span>
                </button>
                <button
                  type="button"
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
                      <span>{isExportingPDF ? "Menyiapkan PDF..." : "Unduh PDF PR"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div id="printable-pr-document" className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Status Badge for View Mode */}
          {selectedPR && (
            <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status Saat Ini:</span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getStatusBadge(selectedPR.status).bg} ${getStatusBadge(selectedPR.status).text} ${getStatusBadge(selectedPR.status).border}`}>
                  {selectedPR.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Diajukan: {formatDate(selectedPR.submissionDate)}</span>
                <span>•</span>
                <span>Target: {formatDate(selectedPR.targetDeliveryDate)}</span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800">
                Judul Pengadaan / Kebutuhan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isViewMode}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengadaan 50 Unit Laptop Karyawan Enterprise & Docking Station"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Departemen Pemohon</label>
              <select
                disabled={isViewMode}
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
              >
                <option value="IT & Infrastructure">IT & Infrastructure</option>
                <option value="Operasional & Logistik">Operasional & Logistik</option>
                <option value="General Affairs & Fasilitas">General Affairs & Fasilitas</option>
                <option value="Marketing & Digital">Marketing & Digital</option>
                <option value="Human Capital">Human Capital</option>
                <option value="Finance & Komersial">Finance & Komersial</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Kategori Pengadaan</label>
              <select
                disabled={isViewMode}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
              >
                <option value="IT & Infrastructure">Hardware & IT Infrastructure</option>
                <option value="Operasional & Logistik">Alat Operasional & Logistik</option>
                <option value="General Affairs & Fasilitas">ATK, APD K3 & Fasilitas Gedung</option>
                <option value="Marketing & Digital">Marketing, Media & Creative Production</option>
                <option value="Jasa Profesional">Jasa Konsultasi & Outsourcing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Tingkat Urgensi</label>
              <select
                disabled={isViewMode}
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
              >
                <option value="LOW">Low (Rutin/Terencana)</option>
                <option value="NORMAL">Normal (Standar SLA 14 Hari)</option>
                <option value="HIGH">High (Prioritas Operasional)</option>
                <option value="URGENT">Urgent / Critical (Emergency PO)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Target Tanggal Penerimaan</label>
              <input
                type="date"
                disabled={isViewMode}
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800">
                Justifikasi Kebutuhan & Kerangka Acuan Kerja (KAK Singkat)
              </label>
              <textarea
                disabled={isViewMode}
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Jelaskan latar belakang kebutuhan, tujuan operasional, dan dampak jika tidak diadakan..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* AI Specification Assistance Tool */}
          {!isViewMode && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>ProcuraAI Assistant: Otomatisasi Spesifikasi & Estimasi HPS</span>
                </div>
                <p className="text-[11px] text-indigo-700/80">
                  AI akan menyusun item rincian teknis, unit, dan estimasi harga wajar sesuai standar pengadaan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAIGenerateSpecs}
                disabled={isGeneratingAI}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Specs AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {aiGeneratedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{aiGeneratedFeedback}</span>
            </div>
          )}

          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Item Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Daftar Rincian Barang / Jasa (Items Breakdown)
              </h4>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Baris Item</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10">No</th>
                    <th className="p-3">Nama Barang / Jasa</th>
                    <th className="p-3">Spesifikasi Teknis</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-24">Satuan</th>
                    <th className="p-3 w-32">Est. Harga Satuan</th>
                    <th className="p-3 w-36 text-right">Total Est.</th>
                    {!isViewMode && <th className="p-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          disabled={isViewMode}
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          placeholder="Nama item"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs disabled:bg-transparent disabled:border-transparent font-medium"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          disabled={isViewMode}
                          value={item.specification}
                          onChange={(e) => handleItemChange(idx, "specification", e.target.value)}
                          placeholder="Spesifikasi & brand"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          disabled={isViewMode}
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs text-center disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          disabled={isViewMode}
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          placeholder="Unit/Set"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs text-center disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          disabled={isViewMode}
                          min={0}
                          value={item.estimatedPrice}
                          onChange={(e) => handleItemChange(idx, "estimatedPrice", e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs text-right font-mono disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 font-mono">
                        {formatRupiah(item.totalPrice || 0)}
                      </td>
                      {!isViewMode && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <tr>
                    <td colSpan={5} className="p-3 text-right">
                      Total Estimasi Anggaran Pagu (HPS Awal):
                    </td>
                    <td colSpan={!isViewMode ? 2 : 1} className="p-3 text-right text-indigo-700 text-sm font-mono font-black">
                      {formatRupiah(totalEstimatedBudget)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Approval History if in View Mode */}
          {selectedPR && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Riwayat Approval & Audit Trail
              </h4>
              <div className="space-y-2">
                {(selectedPR.approvalHistory || []).map((history, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{history.stage}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{history.approver}</span>
                      </div>
                      {history.note && (
                        <p className="text-slate-600 italic">"{history.note}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${history.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {history.status}
                      </span>
                      {history.timestamp && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {history.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Notes for Approvers */}
          {isViewMode && (currentRole === "approver_head" || currentRole === "procurement_officer") && selectedPR.status !== "APPROVED" && selectedPR.status !== "CONVERTED_TO_RFQ" && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-purple-900">
                Catatan Persetujuan / Catatan Panitia:
              </label>
              <textarea
                rows={2}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Berikan arahan pagu anggaran atau persetujuan lelang..."
                className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {!isViewMode ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Kirim Pengajuan PR</span>
              </button>
            ) : (
              <>
                {/* Approver actions */}
                {(currentRole === "approver_head" || currentRole === "procurement_officer") && selectedPR.status !== "APPROVED" && selectedPR.status !== "CONVERTED_TO_RFQ" && onApprovePR && onRejectPR && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onRejectPR(selectedPR.id, approvalNote || "Dokumen perlu direvisi.");
                        onClose();
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Tolak / Minta Revisi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApprovePR(selectedPR.id, approvalNote || "Disetujui untuk proses tender.");
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                    >
                      Setujui (Approve PR)
                    </button>
                  </>
                )}

                {/* Procurement Specialist Convert to RFQ action */}
                {currentRole === "procurement_officer" && selectedPR.status === "APPROVED" && onConvertToRFQ && (
                  <button
                    type="button"
                    onClick={() => {
                      onConvertToRFQ(selectedPR);
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Konversi ke Paket Tender (RFQ)</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Official SAS Aero Sishan Document Modal */}
      {selectedPR && showOfficialSASDoc && (
        <SASOfficialDocumentModal
          isOpen={showOfficialSASDoc}
          onClose={() => setShowOfficialSASDoc(false)}
          data={transformPRToSASDoc(selectedPR)}
        />
      )}
    </div>
  );
};
