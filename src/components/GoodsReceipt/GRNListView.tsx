import React, { useState } from "react";
import {
  PackageCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  FileCheck,
  Trash2,
} from "lucide-react";
import { GoodsReceipt } from "../../types/procurement";
import { formatDate, getStatusBadge } from "../../utils/formatters";
import { GRNModal } from "./GRNModal";
import { DeleteConfirmModal } from "../Common/DeleteConfirmModal";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { SASOfficialDocumentData } from "../Common/SASOfficialDocumentView";
import { transformBASTToSASDoc } from "../../utils/sasDocumentTransformer";

interface GRNListViewProps {
  goodsReceipts: GoodsReceipt[];
  onDeleteGRN?: (grnId: string) => void;
}

export const GRNListView: React.FC<GRNListViewProps> = ({ goodsReceipts, onDeleteGRN }) => {
  const [selectedGRN, setSelectedGRN] = useState<GoodsReceipt | null>(null);
  const [sasDocPreview, setSasDocPreview] = useState<SASOfficialDocumentData | null>(null);
  const [grnToDelete, setGrnToDelete] = useState<GoodsReceipt | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredGRNs = goodsReceipts.filter(
    (g) =>
      g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Penerimaan Barang & BAST (Goods Receipt)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              {goodsReceipts.length} BAST Diterbitkan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan Berita Acara Serah Terima (BAST), pengecekan kualitas QC fisik, dan serah terima aset.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. BAST, No. PO, atau nama vendor..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* BAST List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">No. BAST & Tanggal</th>
                <th className="p-4">Referensi No. PO</th>
                <th className="p-4">Nama Rekanan / Vendor</th>
                <th className="p-4">Lokasi Penerimaan</th>
                <th className="p-4">Petugas QC / Penerima</th>
                <th className="p-4">Status Hasil QC</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGRNs.map((grn) => {
                const isPassed = grn.inspectionStatus === "PASSED";

                return (
                  <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-emerald-700">
                        {grn.grnNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(grn.receiptDate)}
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-indigo-600">
                      {grn.poNumber}
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {grn.vendorName}
                    </td>

                    <td className="p-4 text-slate-600">
                      {grn.warehouseLocation}
                    </td>

                    <td className="p-4 text-slate-700">
                      {grn.receivedBy}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-flex items-center gap-1 ${
                          isPassed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        <span>{grn.inspectionStatus}</span>
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSasDocPreview(transformBASTToSASDoc(grn))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Lihat Format Dokumen Resmi PT SAS Aero Sishan (A4)"
                        >
                          <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                          <span>Format SAS</span>
                        </button>
                        <button
                          onClick={() => setSelectedGRN(grn)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat BAST</span>
                        </button>
                        {onDeleteGRN && (
                          <button
                            onClick={() => setGrnToDelete(grn)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus BAST"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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
      {grnToDelete && onDeleteGRN && (
        <DeleteConfirmModal
          isOpen={!!grnToDelete}
          title="Hapus BAST / Goods Receipt"
          itemTypeLabel="Dokumen BAST"
          itemName={`BAST untuk PO ${grnToDelete.poNumber}`}
          itemCode={grnToDelete.grnNumber}
          warningNote="Menghapus BAST ini akan menghapus catatan penerimaan fisik barang dan status lolos inspeksi QC terkait."
          onCancel={() => setGrnToDelete(null)}
          onConfirm={() => {
            onDeleteGRN(grnToDelete.id);
            setGrnToDelete(null);
          }}
        />
      )}

      {selectedGRN && (
        <GRNModal
          isOpen={!!selectedGRN}
          selectedGRN={selectedGRN}
          onClose={() => setSelectedGRN(null)}
          onSaveGRN={() => {}}
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
