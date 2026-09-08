import React, { useState } from "react";
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  PurchaseRequisition,
  UserRole,
} from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { PRModal } from "./PRModal";
import { DeleteConfirmModal } from "../Common/DeleteConfirmModal";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { SASOfficialDocumentData } from "../Common/SASOfficialDocumentView";
import { transformPRToSASDoc } from "../../utils/sasDocumentTransformer";

interface PRListViewProps {
  requisitions: PurchaseRequisition[];
  currentRole: UserRole;
  onSavePR: (pr: PurchaseRequisition) => void;
  onApprovePR: (prId: string, note: string) => void;
  onRejectPR: (prId: string, note: string) => void;
  onConvertToRFQ: (pr: PurchaseRequisition) => void;
  onDeletePR: (prId: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const PRListView: React.FC<PRListViewProps> = ({
  requisitions,
  currentRole,
  onSavePR,
  onApprovePR,
  onRejectPR,
  onConvertToRFQ,
  onDeletePR,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [sasDocPreview, setSasDocPreview] = useState<SASOfficialDocumentData | null>(null);
  const [prToDelete, setPrToDelete] = useState<PurchaseRequisition | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPRs = requisitions.filter((pr) => {
    const matchesDept = filterDepartment === "ALL" || pr.department === filterDepartment;
    const matchesStatus = filterStatus === "ALL" || pr.status === filterStatus;
    const matchesSearch =
      pr.prNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Purchase Requisition (PR)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              {requisitions.length} Permintaan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengajuan kebutuhan barang dan jasa dari seluruh unit kerja perusahaan.
          </p>
        </div>

        <button
          id="btn-create-new-pr"
          onClick={() => {
            setSelectedPR(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Pengajuan PR</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor PR, judul kebutuhan, atau nama pemohon..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500">Unit:</span>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-transparent border-0 font-medium text-slate-800 focus:ring-0 cursor-pointer pr-4"
            >
              <option value="ALL">Semua Unit Kerja</option>
              <option value="IT & Infrastructure">IT & Infrastructure</option>
              <option value="Operasional & Logistik">Operasional & Logistik</option>
              <option value="General Affairs & Fasilitas">General Affairs & Fasilitas</option>
              <option value="Marketing & Digital">Marketing & Digital</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-0 font-medium text-slate-800 focus:ring-0 cursor-pointer pr-4"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING_DEPT_HEAD">Pending Dept Head</option>
              <option value="PENDING_PROCUREMENT">Pending Panitia</option>
              <option value="APPROVED">Approved (Siap RFQ)</option>
              <option value="CONVERTED_TO_RFQ">Sudah Masuk Tender</option>
              <option value="REJECTED">Ditolak / Revisi</option>
            </select>
          </div>
        </div>
      </div>

      {/* PR Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">No. Requisition & Tgl</th>
                <th className="p-4">Judul Pengadaan</th>
                <th className="p-4">Unit Kerja & Pemohon</th>
                <th className="p-4">Estimasi Pagu HPS</th>
                <th className="p-4">Urgensi</th>
                <th className="p-4">Status Otorisasi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPRs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ditemukan data PR yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredPRs.map((pr) => {
                  const badge = getStatusBadge(pr.status);
                  const urgencyColor =
                    pr.urgency === "URGENT"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : pr.urgency === "HIGH"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <tr
                      key={pr.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-mono font-bold text-indigo-600">
                          {pr.prNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(pr.submissionDate)}
                        </div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {pr.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {pr.items.length} Rincian Item • {pr.category}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {pr.department}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pr.requesterName}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900">
                        {formatRupiah(pr.estimatedBudget)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${urgencyColor}`}
                        >
                          {pr.urgency}
                        </span>
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
                            onClick={() => setSasDocPreview(transformPRToSASDoc(pr))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Lihat Format Dokumen Resmi PT SAS Aero Sishan (A4)"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span>Format SAS</span>
                          </button>
                          <button
                            onClick={() => setSelectedPR(pr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Lihat & Review"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review</span>
                          </button>
                          <button
                            onClick={() => setPrToDelete(pr)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Hapus Pengajuan PR"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {prToDelete && (
        <DeleteConfirmModal
          isOpen={!!prToDelete}
          title="Hapus Purchase Requisition"
          itemTypeLabel="Pengajuan PR"
          itemName={prToDelete.title}
          itemCode={prToDelete.prNumber}
          warningNote="Menghapus PR ini akan membatalkan permohonan pengadaan barang/jasa terkait dari sistem."
          onCancel={() => setPrToDelete(null)}
          onConfirm={() => {
            onDeletePR(prToDelete.id);
            setPrToDelete(null);
          }}
        />
      )}

      {/* Modal Reusable for Create & View */}
      {(isCreateModalOpen || selectedPR) && (
        <PRModal
          isOpen={isCreateModalOpen || !!selectedPR}
          selectedPR={selectedPR}
          currentRole={currentRole}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedPR(null);
          }}
          onSavePR={onSavePR}
          onApprovePR={onApprovePR}
          onRejectPR={onRejectPR}
          onConvertToRFQ={onConvertToRFQ}
        />
      )}

      {/* SAS Official Document Modal */}
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
