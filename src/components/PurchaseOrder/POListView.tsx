import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  FileCheck,
  PackageCheck,
  Printer,
  Calendar,
  Building,
  Trash2,
  FileSpreadsheet,
  FileText,
  ExternalLink,
} from "lucide-react";
import { PurchaseOrder, UserRole } from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { PODetailModal } from "./PODetailModal";
import { DeleteConfirmModal } from "../Common/DeleteConfirmModal";
import { mailMergePurchaseOrderDoc } from "../../services/googleWorkspaceService";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { SASOfficialDocumentData } from "../Common/SASOfficialDocumentView";
import { transformPOToSASDoc } from "../../utils/sasDocumentTransformer";

interface POListViewProps {
  purchaseOrders: PurchaseOrder[];
  currentRole: UserRole;
  onProceedToBAST: (po: PurchaseOrder) => void;
  onDeletePO: (poId: string) => void;
  onOpenGoogleWorkspace?: (tab?: "sheets" | "docs") => void;
}

export const POListView: React.FC<POListViewProps> = ({
  purchaseOrders,
  currentRole,
  onProceedToBAST,
  onDeletePO,
  onOpenGoogleWorkspace,
}) => {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [sasDocPreview, setSasDocPreview] = useState<SASOfficialDocumentData | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isMergingPOId, setIsMergingPOId] = useState<string | null>(null);
  const [docFeedback, setDocFeedback] = useState<{ url: string; title: string } | null>(null);

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesStatus = filterStatus === "ALL" || po.status === filterStatus;
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleQuickMailMerge = async (po: PurchaseOrder) => {
    setIsMergingPOId(po.id);
    try {
      const res = await mailMergePurchaseOrderDoc(po);
      setDocFeedback({ url: res.documentUrl, title: res.title });
    } catch (err: any) {
      if (onOpenGoogleWorkspace) {
        onOpenGoogleWorkspace("docs");
      }
    } finally {
      setIsMergingPOId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Purchase Orders (Surat Pesanan & Kontrak)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              {purchaseOrders.length} Kontrak PO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Surat pesanan resmi terbit lengkap dengan syarat pembayaran, rincian PPN 11%, dan otorisasi digital.
          </p>
        </div>

        {onOpenGoogleWorkspace && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenGoogleWorkspace("sheets")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              title="Sinkronkan data PO ke Google Sheets"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Sinkron ke Sheets</span>
            </button>

            <button
              onClick={() => onOpenGoogleWorkspace("docs")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
              title="Mail Merge Kontrak PO ke Google Docs"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Mail Merge Docs</span>
            </button>
          </div>
        )}
      </div>

      {/* Docs Feedback Notification */}
      {docFeedback && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Dokumen Google Docs berhasil dibuat: <strong>{docFeedback.title}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={docFeedback.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1"
            >
              <span>Buka di Google Docs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => setDocFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold px-1.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. PO, judul pengadaan, atau nama rekanan vendor..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Status PO:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-0 font-medium text-slate-800 focus:ring-0 cursor-pointer pr-4"
          >
            <option value="ALL">Semua Status</option>
            <option value="ISSUED">Diterbitkan (Issued)</option>
            <option value="IN_PRODUCTION_DELIVERY">Proses Produksi / Delivery</option>
            <option value="COMPLETED">Selesai (BAST & Lunas)</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">No. PO & Terbit</th>
                <th className="p-4">Uraian Kontrak Pengadaan</th>
                <th className="p-4">Vendor Rekanan</th>
                <th className="p-4">Unit Pemohon</th>
                <th className="p-4">Total Kontrak (Inc. PPN)</th>
                <th className="p-4">Batas Pengiriman</th>
                <th className="p-4">Status PO</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.map((po) => {
                const badge = getStatusBadge(po.status);

                return (
                  <tr
                    key={po.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-mono font-bold text-indigo-600">
                        {po.poNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(po.issueDate)}
                      </div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {po.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {po.items.length} Item Barang • {po.paymentTerms}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {po.vendorName}
                    </td>

                    <td className="p-4 text-slate-600">
                      {po.department}
                    </td>

                    <td className="p-4 font-mono font-black text-slate-900">
                      {formatRupiah(po.totalAmount)}
                    </td>

                    <td className="p-4 text-slate-700">
                      {formatDate(po.deliveryDeadline)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleQuickMailMerge(po)}
                          disabled={isMergingPOId === po.id}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                          title="Mail Merge Kontrak PO ke Google Docs"
                        >
                          <FileText className={`h-3.5 w-3.5 ${isMergingPOId === po.id ? "animate-spin text-blue-500" : ""}`} />
                        </button>

                        <button
                          onClick={() => setSasDocPreview(transformPOToSASDoc(po))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Lihat Format Dokumen Resmi PT SAS Aero Sishan (A4)"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          <span>Format SAS</span>
                        </button>

                        <button
                          onClick={() => setSelectedPO(po)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat PO</span>
                        </button>

                        {po.status !== "COMPLETED" && (
                          <button
                            onClick={() => onProceedToBAST(po)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                            title="Proses Penerimaan Barang & BAST"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>BAST</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPoToDelete(po)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kontrak PO"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {poToDelete && (
        <DeleteConfirmModal
          isOpen={!!poToDelete}
          title="Hapus Kontrak Purchase Order"
          itemTypeLabel="Kontrak PO"
          itemName={poToDelete.title}
          itemCode={poToDelete.poNumber}
          warningNote="Menghapus Purchase Order ini akan menghapus data kontrak pemesanan dari sistem secara permanen."
          onCancel={() => setPoToDelete(null)}
          onConfirm={() => {
            onDeletePO(poToDelete.id);
            setPoToDelete(null);
          }}
        />
      )}

      {/* Selected PO Modal */}
      {selectedPO && (
        <PODetailModal
          isOpen={!!selectedPO}
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onProceedToBAST={(po) => {
            onProceedToBAST(po);
            setSelectedPO(null);
          }}
        />
      )}

      {/* Official SAS Aero Sishan Document Modal */}
      {sasDocPreview && (
        <SASOfficialDocumentModal
          isOpen={!!sasDocPreview}
          onClose={() => setSasDocPreview(null)}
          data={sasDocPreview}
        />
      )}
    </div>
  );
};
