import React, { useState } from "react";
import {
  X,
  PackageCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Send,
  Printer,
  Download,
  Check,
} from "lucide-react";
import { PurchaseOrder, GoodsReceipt, GRNItem } from "../../types/procurement";
import { formatDate } from "../../utils/formatters";
import { exportGoodsReceiptDirectPDF, downloadElementAsPDF, triggerCleanPrint } from "../../utils/pdfExport";
import { SASLogo } from "../Common/SASLogo";
import { SASOfficialDocumentModal } from "../Common/SASOfficialDocumentModal";
import { transformBASTToSASDoc } from "../../utils/sasDocumentTransformer";

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPO?: PurchaseOrder | null;
  selectedGRN?: GoodsReceipt | null;
  onSaveGRN: (grn: GoodsReceipt) => void;
}

export const GRNModal: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  targetPO,
  selectedGRN,
  onSaveGRN,
}) => {
  const isViewMode = !!selectedGRN;
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showOfficialSASDoc, setShowOfficialSASDoc] = useState(false);

  const [receivedBy, setReceivedBy] = useState(
    selectedGRN?.receivedBy || "Ahmad Fauzi (Warehouse & Asset Officer)"
  );
  const [warehouseLocation, setWarehouseLocation] = useState(
    selectedGRN?.warehouseLocation || "Gudang Sentral Cikarang DC-1"
  );
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState(
    selectedGRN?.deliveryNoteNumber || `SJ/VND/2026/08-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [inspectionStatus, setInspectionStatus] = useState<"PASSED" | "PASSED_WITH_EXCEPTION" | "REJECTED">(
    selectedGRN?.inspectionStatus || "PASSED"
  );
  const [inspectorNotes, setInspectorNotes] = useState(
    selectedGRN?.inspectorNotes || "Seluruh fisik barang diperiksa lengkap, segel utuh, spesifikasi sesuai PO, dan siap dioperasikan."
  );

  const [items, setItems] = useState<GRNItem[]>(
    selectedGRN?.items ||
      targetPO?.items.map((it) => ({
        id: `grni-${it.id}`,
        poItemId: it.id,
        name: it.name,
        orderedQty: it.quantity,
        receivedQty: it.quantity,
        acceptedQty: it.quantity,
        rejectedQty: 0,
        unit: it.unit,
        conditionNote: "Kondisi 100% baru, berfungsi normal",
      })) || []
  );

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (selectedGRN) {
      setIsExportingPDF(true);
      try {
        const success = await downloadElementAsPDF(
          "printable-bast-document",
          `BAST-${selectedGRN.grnNumber.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`,
          { title: `Berita Acara Serah Terima - ${selectedGRN.grnNumber}` }
        );
        if (!success) {
          exportGoodsReceiptDirectPDF(selectedGRN);
        }
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error(err);
        exportGoodsReceiptDirectPDF(selectedGRN);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } finally {
        setIsExportingPDF(false);
      }
    }
  };

  const handlePrint = () => {
    triggerCleanPrint("printable-bast-document", `BAST ${selectedGRN?.grnNumber || ""}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newGRN: GoodsReceipt = {
      id: `grn-${Date.now()}`,
      grnNumber: `BAST/GRN/2026/${new Date().getMonth() + 1}/${Math.floor(1000 + Math.random() * 9000)}`,
      poId: targetPO?.id || "po-ref",
      poNumber: targetPO?.poNumber || "PO/PROC/2026/08/0054",
      vendorName: targetPO?.vendorName || "PT Rekanan Terverifikasi",
      receiptDate: new Date().toISOString().split("T")[0],
      receivedBy,
      warehouseLocation,
      deliveryNoteNumber,
      inspectionStatus,
      items,
      inspectorNotes,
      bastSigned: true,
    };

    onSaveGRN(newGRN);
    onClose();
  };

  const handleItemQtyChange = (
    index: number,
    field: "receivedQty" | "acceptedQty" | "rejectedQty",
    val: number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                {isViewMode ? `Berita Acara Serah Terima (BAST): ${selectedGRN?.grnNumber}` : "Penerimaan Barang & Penerbitan BAST"}
              </h3>
              <p className="text-xs text-slate-300">
                Referensi PO: {targetPO?.poNumber || selectedGRN?.poNumber} • Rekanan: {targetPO?.vendorName || selectedGRN?.vendorName}
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
                  title="Lihat Format Resmi PT SAS Aero Sishan (A4)"
                >
                  <FileCheck className="h-4 w-4" />
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
                      <span>{isExportingPDF ? "Menyiapkan PDF..." : "Unduh PDF BAST"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak BAST</span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
          <div id="printable-bast-document" className="p-8 space-y-6 text-xs text-slate-900 bg-white">
            {/* Letterhead for BAST */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <SASLogo size={42} showText={true} />
                <p className="text-[11px] text-slate-700 font-semibold pt-1">
                  Unit Pengendalian Mutu & Logistik (Quality Control & Warehouse Management)
                </p>
                <p className="text-[10px] text-slate-500">
                  Jl. Lodaya No.32, Bandung, Jawa Barat | Telp/Fax: (022) 730-1234
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-sm font-black uppercase text-emerald-700 tracking-wider">
                  BERITA ACARA SERAH TERIMA (BAST)
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs">
                  {selectedGRN?.grnNumber || "DRAFT BAST PENERIMAAN"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Tanggal: {formatDate(selectedGRN?.receiptDate || new Date().toISOString())}
                </div>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Petugas Penerima / QC Inspector</label>
                <input
                  type="text"
                  disabled={isViewMode}
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-100 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Lokasi Gudang / Destinasi Penerimaan</label>
                <input
                  type="text"
                  disabled={isViewMode}
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">No. Surat Jalan Vendor (Delivery Note)</label>
                <input
                  type="text"
                  disabled={isViewMode}
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono disabled:bg-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Status Uji Kelayakan & QC</label>
                <select
                  disabled={isViewMode}
                  value={inspectionStatus}
                  onChange={(e) => setInspectionStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold disabled:bg-slate-100"
                >
                  <option value="PASSED">Lolos Uji Penuh (Passed 100%)</option>
                  <option value="PASSED_WITH_EXCEPTION">Lolos dengan Catatan / Parsial</option>
                  <option value="REJECTED">Ditolak / Barang Rusak / Tidak Sesuai</option>
                </select>
              </div>
            </div>

            {/* Physical Verification Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Hasil Verifikasi Fisik, Mutu & Kuantitas Barang Masuk
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-3">Nama Item</th>
                      <th className="p-3 w-20 text-center">Dipesan</th>
                      <th className="p-3 w-24 text-center">Diterima</th>
                      <th className="p-3 w-24 text-center">Lolos QC</th>
                      <th className="p-3 w-20 text-center">Ditolak</th>
                      <th className="p-3">Kondisi & Catatan QC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-center text-slate-500 font-bold">
                          {item.orderedQty} {item.unit}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isViewMode}
                            min={0}
                            value={item.receivedQty}
                            onChange={(e) => handleItemQtyChange(idx, "receivedQty", Number(e.target.value))}
                            className="w-16 text-center px-1 py-1 bg-white border border-slate-300 rounded-md font-bold disabled:bg-transparent disabled:border-transparent"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isViewMode}
                            min={0}
                            value={item.acceptedQty}
                            onChange={(e) => handleItemQtyChange(idx, "acceptedQty", Number(e.target.value))}
                            className="w-16 text-center px-1 py-1 bg-white border border-emerald-300 text-emerald-700 font-bold rounded-md disabled:bg-transparent disabled:border-transparent"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isViewMode}
                            min={0}
                            value={item.rejectedQty}
                            onChange={(e) => handleItemQtyChange(idx, "rejectedQty", Number(e.target.value))}
                            className="w-16 text-center px-1 py-1 bg-white border border-rose-300 text-rose-700 font-bold rounded-md disabled:bg-transparent disabled:border-transparent"
                          />
                        </td>
                        <td className="p-3 text-slate-600">{item.conditionNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Catatan Berita Acara & Tim Penerima</label>
              <textarea
                disabled={isViewMode}
                rows={2}
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-100"
              />
            </div>

            {/* Digital Signature Box for BAST */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="text-center p-4 border border-slate-200 rounded-xl space-y-6">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Pihak Pertama (Yang Menyerahkan / Vendor)
                </span>
                <div className="text-slate-400 text-xs italic">
                  (Tanda tangan & Stempel Ekspedisi/Vendor)
                </div>
                <div className="border-t border-slate-300 pt-1 font-bold text-slate-800">
                  {targetPO?.vendorName || selectedGRN?.vendorName}
                </div>
              </div>

              <div className="text-center p-4 border border-emerald-200 bg-emerald-50/30 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-emerald-900 block">
                  Pihak Kedua (Yang Memeriksa & Menerima)
                </span>
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-xs py-1">
                  <ShieldCheck className="h-5 w-5" />
                  <span>QC PASSED & OFFICIALLY ACCEPTED</span>
                </div>
                <div className="border-t border-emerald-200 pt-1">
                  <div className="font-bold text-slate-900">{receivedBy}</div>
                  <div className="text-[10px] text-slate-500">Warehouse & Asset Management</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (screen only) */}
          <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            {!isViewMode && (
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Send className="h-4 w-4" />
                <span>Terbitkan & Tanda Tangani BAST</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Official SAS Aero Sishan Document Modal */}
      {showOfficialSASDoc && selectedGRN && (
        <SASOfficialDocumentModal
          isOpen={showOfficialSASDoc}
          onClose={() => setShowOfficialSASDoc(false)}
          data={transformBASTToSASDoc(selectedGRN)}
        />
      )}
    </div>
  );
};

