import React, { useState } from "react";
import {
  X,
  Printer,
  ShoppingBag,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  Download,
  Check,
} from "lucide-react";
import { PurchaseOrder } from "../../types/procurement";
import { formatRupiah, formatDate, getStatusBadge } from "../../utils/formatters";
import { exportPurchaseOrderDirectPDF, downloadElementAsPDF, triggerCleanPrint } from "../../utils/pdfExport";
import { SASLogo } from "../Common/SASLogo";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { transformPOToSASDoc } from "../../utils/sasDocumentTransformer";

interface PODetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder;
  onProceedToBAST?: (po: PurchaseOrder) => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  isOpen,
  onClose,
  po,
  onProceedToBAST,
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showOfficialSASDoc, setShowOfficialSASDoc] = useState(false);

  if (!isOpen) return null;

  const badge = getStatusBadge(po.status);

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Try high-resolution DOM capture first, with programmatic fallback
      const success = await downloadElementAsPDF(
        "printable-po-document",
        `Purchase-Order-${po.poNumber.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`,
        { title: `Purchase Order - ${po.poNumber}` }
      );
      if (!success) {
        exportPurchaseOrderDirectPDF(po);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      exportPurchaseOrderDirectPDF(po);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    triggerCleanPrint("printable-po-document", `Purchase Order ${po.poNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Actions Bar (not printed) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                Surat Pesanan Resmi (Purchase Order)
              </h3>
              <p className="text-xs text-slate-300">
                Nomor: {po.poNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOfficialSASDoc(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Lihat Format Resmi PT SAS Aero Sishan (A4)"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Format Resmi SAS</span>
            </button>
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
                  <span>{isExportingPDF ? "Menyiapkan PDF..." : "Unduh PDF"}</span>
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

        {/* Printable Official Purchase Order Document */}
        <div id="printable-po-document" className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-900 text-xs bg-white">
          {/* Company Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <SASLogo size={42} showText={true} />
              <p className="text-[11px] text-slate-700 font-semibold pt-1">
                Divisi Pengadaan Barang & Jasa (Supply Chain & Procurement Directorate)
              </p>
              <p className="text-[10px] text-slate-500">
                Jl. Lodaya No.32, Bandung, Jawa Barat | Telp/Fax: (022) 730-1234
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-sm font-black uppercase text-indigo-700 tracking-wider">
                PURCHASE ORDER (PO)
              </span>
              <div className="font-mono font-bold text-slate-900 text-xs">
                {po.poNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Tanggal Terbit: {formatDate(po.issueDate)}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${badge.bg} ${badge.text} ${badge.border}`}>
                {po.status}
              </span>
            </div>
          </div>

          {/* Vendor & Shipping Details */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                DITUJUKAN KEPADA (VENDOR / REKANAN):
              </span>
              <h4 className="font-bold text-slate-900 text-sm">{po.vendorName}</h4>
              <p className="text-slate-600">{po.vendorAddress}</p>
              <p className="text-slate-600">Email: {po.vendorEmail}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                INFORMASI KONTRAK & SYARAT BAYAR:
              </span>
              <p className="text-slate-700">
                <strong className="text-slate-900">Unit Pemohon:</strong> {po.department}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Batas Pengiriman:</strong> {formatDate(po.deliveryDeadline)}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Ketentuan Pembayaran:</strong> {po.paymentTerms}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Rincian Barang / Jasa Yang Dipesan
            </h4>
            <table className="w-full border-collapse text-left border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 border-r border-slate-200 text-center">No</th>
                  <th className="p-3 border-r border-slate-200">Uraian Barang / Jasa & Spesifikasi Teknis</th>
                  <th className="p-3 w-20 border-r border-slate-200 text-center">Qty</th>
                  <th className="p-3 w-24 border-r border-slate-200 text-center">Satuan</th>
                  <th className="p-3 w-36 border-r border-slate-200 text-right">Harga Satuan</th>
                  <th className="p-3 w-40 text-right">Jumlah (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {po.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-3 text-center border-r border-slate-200 text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{item.specification}</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 font-bold">
                      {item.quantity}
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 text-slate-600">
                      {item.unit}
                    </td>
                    <td className="p-3 text-right border-r border-slate-200 font-mono">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={4} className="p-2.5 border-r border-slate-200"></td>
                  <td className="p-2.5 text-right border-r border-slate-200 text-slate-600">Subtotal:</td>
                  <td className="p-2.5 text-right font-mono text-slate-900">
                    {formatRupiah(po.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="p-2.5 border-r border-slate-200"></td>
                  <td className="p-2.5 text-right border-r border-slate-200 text-slate-600">PPN 11%:</td>
                  <td className="p-2.5 text-right font-mono text-slate-900">
                    {formatRupiah(po.ppnAmount)}
                  </td>
                </tr>
                <tr className="bg-indigo-50/80 text-sm">
                  <td colSpan={4} className="p-3 border-r border-slate-200 text-indigo-900">
                    Grand Total Tagihan Kontrak:
                  </td>
                  <td colSpan={2} className="p-3 text-right font-mono font-black text-indigo-700 text-base">
                    {formatRupiah(po.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes & Terms */}
          {po.notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
              <strong className="text-slate-900">Instruksi Khusus & Pengiriman:</strong> {po.notes}
            </div>
          )}

          {/* Digital Signature Box */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center p-4 border border-slate-200 rounded-xl space-y-8">
              <span className="text-[11px] font-bold text-slate-600 block">
                Disetujui & Diterima Oleh Rekanan (Vendor)
              </span>
              <div className="text-slate-400 text-xs italic">
                (Tanda tangan & Stempel Perusahaan)
              </div>
              <div className="border-t border-slate-300 pt-1 font-bold text-slate-800">
                {po.vendorName}
              </div>
            </div>

            <div className="text-center p-4 border border-indigo-200 bg-indigo-50/30 rounded-xl space-y-4">
              <span className="text-[11px] font-bold text-indigo-900 block">
                Disahkan Oleh Pejabat Pengadaan (Authorized Signature)
              </span>
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-xs py-2">
                <ShieldCheck className="h-5 w-5" />
                <span>DIGITALLY SIGNED & VERIFIED</span>
              </div>
              <div className="border-t border-indigo-200 pt-1">
                <div className="font-bold text-slate-900">{po.signedBy}</div>
                <div className="text-[10px] text-slate-500">Tgl Otorisasi: {po.signedDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (screen only) */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            PO ini memiliki kekuatan hukum mengikat setelah ditandatangani secara elektronik.
          </span>
          <div className="flex items-center gap-2">
            {onProceedToBAST && (
              <button
                onClick={() => onProceedToBAST(po)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                <span>Proses BAST / Penerimaan Barang</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Official SAS Aero Sishan Document Modal */}
      {showOfficialSASDoc && (
        <SASOfficialDocumentModal
          isOpen={showOfficialSASDoc}
          onClose={() => setShowOfficialSASDoc(false)}
          data={transformPOToSASDoc(po)}
        />
      )}
    </div>
  );
};
