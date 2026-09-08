import React, { useState } from "react";
import {
  Receipt,
  Search,
  Filter,
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  Trash2,
} from "lucide-react";
import { Invoice, UserRole } from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { ThreeWayMatchAuditModal } from "./ThreeWayMatchAuditModal";
import { DeleteConfirmModal } from "../Common/DeleteConfirmModal";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { SASOfficialDocumentData } from "../Common/SASOfficialDocumentView";
import { transformInvoiceToSASDoc } from "../../utils/sasDocumentTransformer";
import { FileText } from "lucide-react";

interface InvoiceListViewProps {
  invoices: Invoice[];
  currentRole: UserRole;
  onApprovePayment: (invoiceId: string, note: string) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  currentRole,
  onApprovePayment,
  onDeleteInvoice,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sasDocPreview, setSasDocPreview] = useState<SASOfficialDocumentData | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMatchStatus, setFilterMatchStatus] = useState<string>("ALL");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesMatch =
      filterMatchStatus === "ALL" || inv.threeWayMatch.status === filterMatchStatus;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMatch && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Invoicing & 3-Way Matching (Finance)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
              {invoices.length} Faktur Masuk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekonsiliasi otomatis 3 pilar: Purchase Order, Berita Acara (BAST), dan Faktur Pajak Vendor sebelum transfer dana.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Faktur Invoice, PO, atau nama vendor..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Status 3-Way:</span>
          <select
            value={filterMatchStatus}
            onChange={(e) => setFilterMatchStatus(e.target.value)}
            className="bg-transparent border-0 font-medium text-slate-800 focus:ring-0 cursor-pointer pr-4"
          >
            <option value="ALL">Semua Hasil Audit</option>
            <option value="MATCHED">Matched 100% (Siap Bayar)</option>
            <option value="PENDING">Menunggu Rekonsiliasi</option>
            <option value="MISMATCH">Mismatch / Selisih</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">No. Invoice & Tanggal</th>
                <th className="p-4">Nama Rekanan / Vendor</th>
                <th className="p-4">Referensi PO & BAST</th>
                <th className="p-4">Nominal Tagihan</th>
                <th className="p-4">Status 3-Way Match</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4">Status Pembayaran</th>
                <th className="p-4 text-center">Aksi Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isMatched = inv.threeWayMatch.status === "MATCHED";
                const isPaid = inv.status === "PAID";

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-purple-700">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(inv.invoiceDate)}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {inv.vendorName}
                    </td>

                    <td className="p-4 font-mono text-[11px] space-y-0.5">
                      <div className="text-indigo-600 font-bold">{inv.poNumber}</div>
                      <div className="text-emerald-600">{inv.grnNumber}</div>
                    </td>

                    <td className="p-4 font-mono font-black text-slate-900">
                      {formatRupiah(inv.amount)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                          isMatched
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isMatched ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{isMatched ? "MATCHED (100%)" : "PENDING AUDIT"}</span>
                      </span>
                    </td>

                    <td className="p-4 text-slate-700">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSasDocPreview(transformInvoiceToSASDoc(inv))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Lihat Format Dokumen Resmi PT SAS Aero Sishan (A4)"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          <span>Format SAS</span>
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all active:scale-98 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Audit</span>
                        </button>
                        {onDeleteInvoice && (
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Faktur Masuk"
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
      {invoiceToDelete && onDeleteInvoice && (
        <DeleteConfirmModal
          isOpen={!!invoiceToDelete}
          title="Hapus Faktur / Invoice Rekanan"
          itemTypeLabel="Dokumen Faktur"
          itemName={`${invoiceToDelete.vendorName} - ${formatRupiah(invoiceToDelete.amount)}`}
          itemCode={invoiceToDelete.invoiceNumber}
          warningNote="Menghapus berkas faktur ini akan membatalkan antrean verifikasi 3-way match dan pembayaran ke vendor."
          onCancel={() => setInvoiceToDelete(null)}
          onConfirm={() => {
            onDeleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }}
        />
      )}

      {selectedInvoice && (
        <ThreeWayMatchAuditModal
          isOpen={!!selectedInvoice}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onApprovePayment={onApprovePayment}
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
