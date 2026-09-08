import React, { useState } from "react";
import {
  Gavel,
  PlusCircle,
  Search,
  Filter,
  Sparkles,
  Award,
  Send,
  Calendar,
  Users,
  Eye,
  CheckCircle2,
  FileText,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import {
  RFQ,
  VendorBid,
  Vendor,
  UserRole,
} from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { BidEvaluationModal } from "./BidEvaluationModal";
import { SubmitBidModal } from "./SubmitBidModal";
import { RFQModal } from "./RFQModal";
import { DeleteConfirmModal } from "../Common/DeleteConfirmModal";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { SASOfficialDocumentData } from "../Common/SASOfficialDocumentView";
import { transformRFQToSASDoc } from "../../utils/sasDocumentTransformer";

interface RFQListViewProps {
  rfqs: RFQ[];
  vendors: Vendor[];
  currentRole: UserRole;
  onSaveRFQ: (rfq: RFQ) => void;
  onSubmitBid: (rfqId: string, bid: VendorBid) => void;
  onAwardVendor: (rfqId: string, vendorId: string, vendorName: string) => void;
  onCreatePOFromAwardedRFQ: (rfq: RFQ) => void;
  onDeleteRFQ?: (rfqId: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const RFQListView: React.FC<RFQListViewProps> = ({
  rfqs,
  vendors,
  currentRole,
  onSaveRFQ,
  onSubmitBid,
  onAwardVendor,
  onCreatePOFromAwardedRFQ,
  onDeleteRFQ,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const [selectedEvaluationRFQ, setSelectedEvaluationRFQ] = useState<RFQ | null>(null);
  const [selectedBidSubmitRFQ, setSelectedBidSubmitRFQ] = useState<RFQ | null>(null);
  const [sasDocPreview, setSasDocPreview] = useState<SASOfficialDocumentData | null>(null);
  const [rfqToDelete, setRfqToDelete] = useState<RFQ | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesStatus = filterStatus === "ALL" || rfq.status === filterStatus;
    const matchesSearch =
      rfq.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              e-Tendering & Permintaan Penawaran (RFQ)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {rfqs.length} Paket
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proses lelang elektronik, pembukaan penawaran rekanan, dan evaluasi komite berbasis AI.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Paket RFQ Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor tender atau nama paket pengadaan..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-0 font-medium text-slate-800 focus:ring-0 cursor-pointer pr-4"
          >
            <option value="ALL">Semua Tahapan</option>
            <option value="PUBLISHED">Masa Penawaran (Published)</option>
            <option value="EVALUATION">Evaluasi Komite</option>
            <option value="AWARDED">Selesai (Pemenang Ditetapkan)</option>
          </select>
        </div>
      </div>

      {/* RFQ Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRFQs.map((rfq) => {
          const badge = getStatusBadge(rfq.status);
          const isAwarded = rfq.status === "AWARDED";

          return (
            <div
              key={rfq.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {rfq.rfqNumber}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {rfq.tenderType.replace("_", " ")}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                  {rfq.title}
                </h3>
                {rfq.prNumber && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sumber: {rfq.prNumber} • {rfq.category}
                  </p>
                )}

                {/* Metrics Summary */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                      Pagu HPS Resmi
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatRupiah(rfq.hpsBudget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                      Batas Penawaran
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatDate(rfq.submissionDeadline)}
                    </span>
                  </div>
                </div>

                {/* Bids received preview */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      <strong className="text-slate-900">{rfq.bids.length}</strong> Rekanan Memasukkan Penawaran
                    </span>
                  </div>

                  {isAwarded && (
                    <div className="text-emerald-700 font-bold flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>Winner: {rfq.awardedVendorName?.split(" ")[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* SAS Official Document Template Preview */}
                  <button
                    onClick={() => setSasDocPreview(transformRFQToSASDoc(rfq))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    title="Buka Dokumen Resmi SAS (Sesuai Format Perusahaan)"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>Format Resmi SAS</span>
                  </button>

                  {/* Submit bid button for simulation */}
                  <button
                    onClick={() => setSelectedBidSubmitRFQ(rfq)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Send className="h-3.5 w-3.5 text-blue-600" />
                    <span>+ Submit Penawaran</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete RFQ button */}
                  {onDeleteRFQ && (
                    <button
                      onClick={() => setRfqToDelete(rfq)}
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Hapus Tender / RFQ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Evaluation Modal Button */}
                  <button
                    onClick={() => setSelectedEvaluationRFQ(rfq)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-98"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                    <span>Evaluasi & AI Scoring</span>
                  </button>

                  {/* Create PO if Awarded */}
                  {isAwarded && (
                    <button
                      onClick={() => onCreatePOFromAwardedRFQ(rfq)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      title="Terbitkan Purchase Order untuk pemenang lelang ini"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Terbitkan PO</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {rfqToDelete && onDeleteRFQ && (
        <DeleteConfirmModal
          isOpen={!!rfqToDelete}
          title="Hapus Tender / Request for Quotation"
          itemTypeLabel="Dokumen Tender RFQ"
          itemName={rfqToDelete.title}
          itemCode={rfqToDelete.rfqNumber}
          warningNote="Menghapus tender ini akan membatalkan seluruh berkas penawaran rekanan yang telah masuk."
          onCancel={() => setRfqToDelete(null)}
          onConfirm={() => {
            onDeleteRFQ(rfqToDelete.id);
            setRfqToDelete(null);
          }}
        />
      )}

      {/* Modals */}
      {selectedEvaluationRFQ && (
        <BidEvaluationModal
          isOpen={!!selectedEvaluationRFQ}
          rfq={selectedEvaluationRFQ}
          onClose={() => setSelectedEvaluationRFQ(null)}
          onAwardVendor={(rfqId, vId, vName) => {
            onAwardVendor(rfqId, vId, vName);
            setSelectedEvaluationRFQ(null);
          }}
        />
      )}

      {selectedBidSubmitRFQ && (
        <SubmitBidModal
          isOpen={!!selectedBidSubmitRFQ}
          rfq={selectedBidSubmitRFQ}
          vendors={vendors}
          onClose={() => setSelectedBidSubmitRFQ(null)}
          onSubmitBid={(rfqId, bid) => {
            onSubmitBid(rfqId, bid);
            setSelectedBidSubmitRFQ(null);
          }}
        />
      )}

      {isCreateModalOpen && (
        <RFQModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSaveRFQ={onSaveRFQ}
        />
      )}

      {/* Official SAS Aero Sishan Document Viewer & Printable Modal */}
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
