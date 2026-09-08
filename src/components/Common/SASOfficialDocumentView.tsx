import React, { useState } from "react";
import {
  Printer,
  Download,
  Check,
  Edit3,
  Building2,
  FileText,
  Eye,
  Settings2,
} from "lucide-react";
import { SASLogo } from "./SASLogo";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { downloadElementAsPDF, triggerCleanPrint } from "../../utils/pdfExport";

export type SASDocType = "RFQ" | "PR" | "PO" | "BAST" | "INVOICE";

export interface SASDocItem {
  itemNo: number;
  materialService: string;
  description: string;
  qty: number;
  unit: string;
  targetDeliveryDate?: string;
  unitPrice?: number;
  totalPrice?: number;
  orderedQty?: number;
  receivedQty?: number;
  condition?: string;
}

export interface SASOfficialDocumentData {
  docType: SASDocType;
  docNumber: string;
  docDate: string;
  refPrNumber?: string;
  refRfqNumber?: string;
  refPoNumber?: string;
  refBastNumber?: string;
  deliveryNoteNumber?: string;
  
  // Organization / Delivery to
  deliverToName?: string;
  deliverToAddress?: string;
  deliverToCity?: string;

  // Department / Destination
  divisionName?: string;
  divisionAddress?: string;
  divisionFax?: string;

  // Project Info
  projectName?: string;
  descNetwork?: string;

  // Vendor / Recipient Info ("Kepada / To")
  toName: string;
  toAddress?: string;
  toPhone?: string;
  toFax?: string;
  beforeDate?: string;

  // Items
  items: SASDocItem[];

  // Remarks / Terms
  remarks?: string;
  termsAndConditions?: string;

  // Signer Info
  signerOrg?: string;
  signerDept?: string;
  signerName?: string;
  signerTitle?: string;

  // Dual Signer for PO / BAST
  counterpartOrg?: string;
  counterpartName?: string;
  counterpartTitle?: string;

  // Financial Summary (for PO / Invoice / PR)
  subtotal?: number;
  taxAmount?: number;
  grandTotal?: number;
}

interface SASOfficialDocumentViewProps {
  data: SASOfficialDocumentData;
  onClose?: () => void;
  showControlBar?: boolean;
}

export const SASOfficialDocumentView: React.FC<SASOfficialDocumentViewProps> = ({
  data: initialData,
  onClose,
  showControlBar = true,
}) => {
  const [docData, setDocData] = useState<SASOfficialDocumentData>(initialData);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Document Title & Subtitle based on docType
  const getDocHeaderTitles = () => {
    switch (docData.docType) {
      case "RFQ":
        return {
          idTitle: "PERMOHONAN PENAWARAN HARGA",
          enTitle: "REQUEST FOR QUOTATION",
          instructionId:
            "Mohon dapat dikirimkan penawaran harga terbaik, berikut syarat-syarat pembayaran dan waktu pengiriman untuk item dibawah ini.",
          instructionEn:
            "Please send quotation for your best price, including terms of payment and delivery time for items as follows.",
          refLabel: "PR Number",
          refValue: docData.refPrNumber || "-",
        };
      case "PR":
        return {
          idTitle: "SURAT PERMINTAAN PEMBELIAN",
          enTitle: "PURCHASE REQUISITION",
          instructionId:
            "Mohon dapat diproses pengadaan barang/jasa sesuai dengan spesifikasi teknis dan estimasi kebutuhan operasional dibawah ini.",
          instructionEn:
            "Please process procurement of goods/services according to the technical specifications and operational requirements below.",
          refLabel: "Department",
          refValue: docData.divisionName || "IT & Infrastructure",
        };
      case "PO":
        return {
          idTitle: "SURAT PESANAN",
          enTitle: "PURCHASE ORDER",
          instructionId:
            "Harap dikirimkan barang/jasa yang tercantum dibawah ini sesuai dengan syarat, ketentuan, dan harga yang telah disepakati bersama.",
          instructionEn:
            "Please deliver the items/services listed below in accordance with the agreed terms, conditions, and pricing.",
          refLabel: "PR / RFQ Number",
          refValue: `${docData.refPrNumber || "-"} / ${docData.refRfqNumber || "-"}`,
        };
      case "BAST":
        return {
          idTitle: "BERITA ACARA SERAH TERIMA",
          enTitle: "GOODS RECEIPT NOTE (BAST)",
          instructionId:
            "Pada hari ini telah diserahterimakan dan diperiksa kelayakan fisik, kuantitas, serta kesesuaian mutu barang/jasa dibawah ini.",
          instructionEn:
            "On this day, the physical condition, quantity, and quality conformity of the goods/services below have been handed over and inspected.",
          refLabel: "PO / Ref No",
          refValue: docData.refPoNumber || docData.deliveryNoteNumber || "-",
        };
      case "INVOICE":
        return {
          idTitle: "FAKTUR TAGIHAN PEMBAYARAN",
          enTitle: "COMMERCIAL INVOICE",
          instructionId:
            "Rincian tagihan pembayaran atas pekerjaan/pengadaan barang/jasa yang telah diserahterimakan dan disetujui sesuai kontrak.",
          instructionEn:
            "Billing breakdown for goods/services that have been completed, handed over, and formally approved per contract.",
          refLabel: "PO & BAST Ref",
          refValue: `${docData.refPoNumber || "-"} | ${docData.refBastNumber || "-"}`,
        };
    }
  };

  const titles = getDocHeaderTitles();
  const documentContainerId = `sas-doc-${docData.docNumber.replace(/[^a-zA-Z0-9]/g, "-")}`;

  const handlePrint = () => {
    triggerCleanPrint(documentContainerId, `${titles.idTitle} - ${docData.docNumber}`);
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const filename = `${docData.docType}_${docData.docNumber.replace(/[/\\?%*:|"<>]/g, "_")}.pdf`;
      const success = await downloadElementAsPDF(documentContainerId, filename, {
        title: `${titles.idTitle} ${docData.docNumber}`,
      });
      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Top Action Bar */}
      {showControlBar && (
        <div className="px-6 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  Format Resmi PT SAS Aero Sishan (SAS)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded">
                  {docData.docType}
                </span>
              </div>
              <p className="text-sm font-bold text-white font-mono">{docData.docNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                isEditMode
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditMode ? "Selesai Edit" : "Sesuaikan Data / Parameter"}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>PDF Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>{isExportingPDF ? "Menyiapkan PDF..." : "Unduh PDF"}</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-blue-400" />
              <span>Cetak / Print A4</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Panel (Drawer/Collapsible) */}
      {isEditMode && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 print:hidden transition-all text-xs">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Settings2 className="h-4 w-4 text-amber-700" />
                Penyesuaian Parameter Template Dokumen Resmi:
              </span>
              <span className="text-[11px] text-amber-700">
                Perubahan langsung diterapkan pada tampilan kertas di bawah.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Project:
                </label>
                <input
                  type="text"
                  value={docData.projectName || ""}
                  onChange={(e) => setDocData({ ...docData, projectName: e.target.value })}
                  placeholder="Nama Project"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Desc Network:
                </label>
                <input
                  type="text"
                  value={docData.descNetwork || ""}
                  onChange={(e) => setDocData({ ...docData, descNetwork: e.target.value })}
                  placeholder="Desc Network"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Kepada / To (Vendor/Rekanan):
                </label>
                <input
                  type="text"
                  value={docData.toName || ""}
                  onChange={(e) => setDocData({ ...docData, toName: e.target.value })}
                  placeholder="Nama Penerima"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Sebelum / Batas Waktu:
                </label>
                <input
                  type="text"
                  value={docData.beforeDate || ""}
                  onChange={(e) => setDocData({ ...docData, beforeDate: e.target.value })}
                  placeholder="Contoh: 15 September 2026"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Telp Rekanan:
                </label>
                <input
                  type="text"
                  value={docData.toPhone || ""}
                  onChange={(e) => setDocData({ ...docData, toPhone: e.target.value })}
                  placeholder="021-..."
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Fax Rekanan:
                </label>
                <input
                  type="text"
                  value={docData.toFax || ""}
                  onChange={(e) => setDocData({ ...docData, toFax: e.target.value })}
                  placeholder="021-..."
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Nama Terkait (Penandatangan):
                </label>
                <input
                  type="text"
                  value={docData.signerName || ""}
                  onChange={(e) => setDocData({ ...docData, signerName: e.target.value })}
                  placeholder="Nama Penandatangan"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                  Jabatan:
                </label>
                <input
                  type="text"
                  value={docData.signerTitle || ""}
                  onChange={(e) => setDocData({ ...docData, signerTitle: e.target.value })}
                  placeholder="Jabatan"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
        {/* The Exact A4 Paper Sheet matching TEMPLATE RFQ.jpg */}
        <div
          id={documentContainerId}
          className="bg-white text-black shadow-xl rounded-xs w-full max-w-[210mm] min-h-[297mm] p-[16mm] sm:p-[20mm] flex flex-col justify-between select-text print:shadow-none print:m-0 print:p-[15mm] print:w-full print:max-w-none"
          style={{
            fontFamily: "'Times New Roman', Times, serif, Arial",
            color: "#000000",
            backgroundColor: "#ffffff",
          }}
        >
          {/* TOP SECTION */}
          <div className="space-y-4">
            {/* Top Bar: Logo & Deliver To (Left) + Document Meta (Right) */}
            <div className="flex items-start justify-between gap-6">
              {/* Top Left: SAS Logo + Delivery Address */}
              <div className="space-y-3">
                <SASLogo size={54} showText={true} />

                <div className="text-[11px] leading-tight space-y-0.5">
                  <p className="font-normal">Untuk dikirim ke:</p>
                  <p className="italic text-slate-700">Please deliver to:</p>
                  <p className="font-bold text-[12px] pt-0.5">
                    {docData.deliverToName || "PT SAS Aero Sishan (SAS)"}
                  </p>
                  <p>{docData.deliverToAddress || "Jl. Lodaya No.32"}</p>
                  <p>{docData.deliverToCity || "Bandung"}</p>
                </div>
              </div>

              {/* Top Right: Date & Number Block */}
              <div className="text-[11px] leading-relaxed text-left min-w-[210px] pt-1">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-24 font-normal py-0.5">Date</td>
                      <td className="w-3">:</td>
                      <td className="font-medium">{docData.docDate || "08-Sep-2026"}</td>
                    </tr>
                    <tr>
                      <td className="font-normal py-0.5">{docData.docType} Number</td>
                      <td>:</td>
                      <td className="font-bold font-mono text-[11.5px]">{docData.docNumber}</td>
                    </tr>
                    {docData.refPrNumber && (
                      <tr>
                        <td className="font-normal py-0.5">PR Number</td>
                        <td>:</td>
                        <td className="font-medium font-mono">{docData.refPrNumber}</td>
                      </tr>
                    )}
                    {docData.refRfqNumber && (
                      <tr>
                        <td className="font-normal py-0.5">RFQ Number</td>
                        <td>:</td>
                        <td className="font-medium font-mono">{docData.refRfqNumber}</td>
                      </tr>
                    )}
                    {docData.refPoNumber && (
                      <tr>
                        <td className="font-normal py-0.5">PO Number</td>
                        <td>:</td>
                        <td className="font-medium font-mono">{docData.refPoNumber}</td>
                      </tr>
                    )}
                    {docData.deliveryNoteNumber && (
                      <tr>
                        <td className="font-normal py-0.5">Surat Jalan No.</td>
                        <td>:</td>
                        <td className="font-medium font-mono">{docData.deliveryNoteNumber}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Title Header with clean black horizontal line */}
            <div className="pt-2 text-center">
              <h1 className="text-[14px] sm:text-[15px] font-bold tracking-normal uppercase leading-tight">
                {titles.idTitle}
              </h1>
              <h2 className="text-[12px] sm:text-[13px] font-bold italic tracking-normal uppercase leading-tight pt-0.5">
                {titles.enTitle}
              </h2>
              {/* Solid horizontal black line */}
              <div className="w-full border-b-2 border-black mt-1.5 mb-3" />
            </div>

            {/* Two-Column Middle Section */}
            <div className="grid grid-cols-2 gap-6 text-[11px] leading-tight">
              {/* Left Column: Penawaran harga dikirim / Divisi Pengadaan & Project */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <p className="font-normal">
                    {docData.docType === "RFQ"
                      ? "Penawaran harga dikirim/ fax ke:"
                      : docData.docType === "PO"
                      ? "Faktur & Dokumen dikirim ke:"
                      : docData.docType === "BAST"
                      ? "Lokasi Serah Terima & Pemeriksaan:"
                      : "Diajukan Kepada:"}
                  </p>
                  <p className="italic text-slate-700">
                    {docData.docType === "RFQ"
                      ? "Quotation form/ fax to:"
                      : docData.docType === "PO"
                      ? "Invoice & document to:"
                      : docData.docType === "BAST"
                      ? "Handover & inspection site:"
                      : "Submitted to:"}
                  </p>
                  <p className="font-bold pt-0.5">
                    {docData.divisionName || "DIVISI PENGADAAN"}
                  </p>
                  <p>{docData.divisionAddress || "Jl. Lodaya No.32 Bandung"}</p>
                  <p>Fax: {docData.divisionFax || "-"}</p>
                </div>

                <div className="pt-1 space-y-1">
                  <div className="flex">
                    <span className="w-24 font-normal">Project</span>
                    <span className="w-3">:</span>
                    <span className="font-medium flex-1">
                      {docData.projectName || "Pengadaan Barang & Jasa Operasional"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-normal">Desc Network</span>
                    <span className="w-3">:</span>
                    <span className="font-medium flex-1">
                      {docData.descNetwork || "Network & Core Infrastructure"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Kepada / To (Vendor) & Sebelum / Before */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <p className="font-normal">
                    {docData.docType === "BAST" ? "Pihak Pertama (Penyedia):" : "Kepada:"}
                  </p>
                  <p className="italic text-slate-700">
                    {docData.docType === "BAST" ? "First Party (Supplier):" : "To:"}
                  </p>
                  <p className="font-bold text-[11.5px] pt-0.5">{docData.toName || "PT Vendor Rekanan"}</p>
                  {docData.toAddress && <p>{docData.toAddress}</p>}
                  <div className="flex items-center gap-4 pt-0.5">
                    <p>Telp : {docData.toPhone || "-"}</p>
                    <p>Fax : {docData.toFax || "-"}</p>
                  </div>
                </div>

                <div className="pt-1 space-y-0.5">
                  <p className="font-normal">
                    {docData.docType === "RFQ"
                      ? "Sebelum:"
                      : docData.docType === "PO"
                      ? "Target Pengiriman:"
                      : docData.docType === "BAST"
                      ? "Tanggal Diterima:"
                      : "Target Selesai:"}
                  </p>
                  <p className="italic text-slate-700">
                    {docData.docType === "RFQ"
                      ? "Before:"
                      : docData.docType === "PO"
                      ? "Delivery Target:"
                      : docData.docType === "BAST"
                      ? "Received Date:"
                      : "Target Date:"}
                  </p>
                  <p className="font-medium pt-0.5">
                    {docData.beforeDate || "Sesuai Jadwal Tender / Pengadaan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Notice Sentence */}
            <div className="pt-2">
              <p className="text-[11px] leading-tight font-normal">
                {titles.instructionId}
              </p>
              <p className="text-[10.5px] leading-tight italic text-slate-800 pt-0.5">
                {titles.instructionEn}
              </p>
              {/* Thin black line below instruction */}
              <div className="w-full border-b border-black mt-2 mb-2" />
            </div>

            {/* Itemized Table matching image with 1px black borders */}
            <div className="overflow-x-auto">
              <table
                className="w-full text-black text-[10.5px]"
                style={{
                  borderCollapse: "collapse",
                  border: "1px solid #000000",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "5px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "38px",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "5px 6px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "120px",
                      }}
                    >
                      Material/Service
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "5px 6px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "5px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "48px",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "5px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "48px",
                      }}
                    >
                      Unit
                    </th>

                    {/* Columns depending on document type */}
                    {docData.docType === "RFQ" && (
                      <th
                        style={{
                          border: "1px solid #000000",
                          padding: "5px 6px",
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "130px",
                        }}
                      >
                        Target Delivery Date
                      </th>
                    )}

                    {docData.docType === "PR" && (
                      <>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "90px",
                          }}
                        >
                          Target Date
                        </th>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "110px",
                          }}
                        >
                          Est. Unit (IDR)
                        </th>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "120px",
                          }}
                        >
                          Est. Total (IDR)
                        </th>
                      </>
                    )}

                    {docData.docType === "PO" && (
                      <>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "110px",
                          }}
                        >
                          Harga Satuan (IDR)
                        </th>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "120px",
                          }}
                        >
                          Total Harga (IDR)
                        </th>
                      </>
                    )}

                    {docData.docType === "BAST" && (
                      <>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 4px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "55px",
                          }}
                        >
                          Diterima
                        </th>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "120px",
                          }}
                        >
                          Kondisi & Mutu
                        </th>
                      </>
                    )}

                    {docData.docType === "INVOICE" && (
                      <>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "110px",
                          }}
                        >
                          Harga (IDR)
                        </th>
                        <th
                          style={{
                            border: "1px solid #000000",
                            padding: "5px 6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "120px",
                          }}
                        >
                          Total (IDR)
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {docData.items && docData.items.length > 0 ? (
                    docData.items.map((it, idx) => (
                      <tr key={idx}>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 4px",
                            textAlign: "center",
                          }}
                        >
                          {it.itemNo || idx + 1}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 8px",
                            textAlign: "left",
                            fontWeight: "500",
                          }}
                        >
                          {it.materialService || "Material / Service"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 8px",
                            textAlign: "left",
                          }}
                        >
                          {it.description}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 4px",
                            textAlign: "center",
                          }}
                        >
                          {it.qty}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 4px",
                            textAlign: "center",
                          }}
                        >
                          {it.unit}
                        </td>

                        {docData.docType === "RFQ" && (
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "6px 8px",
                              textAlign: "center",
                            }}
                          >
                            {it.targetDeliveryDate || docData.beforeDate || "-"}
                          </td>
                        )}

                        {docData.docType === "PR" && (
                          <>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 6px",
                                textAlign: "center",
                              }}
                            >
                              {it.targetDeliveryDate || "-"}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "right",
                                fontFamily: "monospace",
                              }}
                            >
                              {formatRupiah(it.unitPrice || 0)}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "right",
                                fontFamily: "monospace",
                                fontWeight: "bold",
                              }}
                            >
                              {formatRupiah(it.totalPrice || (it.unitPrice || 0) * it.qty)}
                            </td>
                          </>
                        )}

                        {docData.docType === "PO" && (
                          <>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "right",
                                fontFamily: "monospace",
                              }}
                            >
                              {formatRupiah(it.unitPrice || 0)}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "right",
                                fontFamily: "monospace",
                                fontWeight: "bold",
                              }}
                            >
                              {formatRupiah(it.totalPrice || (it.unitPrice || 0) * it.qty)}
                            </td>
                          </>
                        )}

                        {docData.docType === "BAST" && (
                          <>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 4px",
                                textAlign: "center",
                                fontWeight: "bold",
                              }}
                            >
                              {it.receivedQty ?? it.qty}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "left",
                              }}
                            >
                              {it.condition || "Kondisi 100% Baru & Sesuai"}
                            </td>
                          </>
                        )}

                        {docData.docType === "INVOICE" && (
                          <>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "right",
                                fontFamily: "monospace",
                              }}
                            >
                              {formatRupiah(it.unitPrice || 0)}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "right",
                                fontFamily: "monospace",
                                fontWeight: "bold",
                              }}
                            >
                              {formatRupiah(it.totalPrice || (it.unitPrice || 0) * it.qty)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={docData.docType === "PO" || docData.docType === "PR" ? 7 : 6}
                        style={{
                          border: "1px solid #000000",
                          padding: "12px",
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        (Tidak ada item dalam rincian)
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Subtotal & Tax for PO / PR / Invoice */}
                {(docData.docType === "PO" || docData.docType === "PR" || docData.docType === "INVOICE") && (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={docData.docType === "PR" ? 6 : 5}
                        style={{
                          border: "1px solid #000000",
                          padding: "4px 8px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        Subtotal:
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "4px 8px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        {formatRupiah(docData.subtotal || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={docData.docType === "PR" ? 6 : 5}
                        style={{
                          border: "1px solid #000000",
                          padding: "4px 8px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        PPN 11%:
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "4px 8px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        {formatRupiah(docData.taxAmount || Math.round((docData.subtotal || 0) * 0.11))}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: "#fcfcfc" }}>
                      <td
                        colSpan={docData.docType === "PR" ? 6 : 5}
                        style={{
                          border: "1px solid #000000",
                          padding: "5px 8px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        TOTAL AKHIR (IDR):
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "5px 8px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          fontSize: "11px",
                        }}
                      >
                        {formatRupiah(docData.grandTotal || (docData.subtotal || 0) * 1.11)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Remarks / Keterangan Section matching image */}
            <div className="pt-2 space-y-1">
              <p className="font-bold text-[11px]">Remarks/Keterangan:</p>
              <div className="text-[10.5px] leading-tight space-y-0.5">
                <p className="font-normal underline">
                  *Kejelasan dan Syarat {docData.docType} tertulis di belakang halaman ini
                </p>
                <p className="italic text-slate-700">
                  Others Term & Condition {docData.docType} as behind this page
                </p>
                {docData.remarks && (
                  <p className="text-slate-800 pt-1 font-medium italic">
                    Catatan Khusus: {docData.remarks}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: SIGNATURES & FOOTER */}
          <div className="pt-8 space-y-6">
            {/* Signature Area */}
            {docData.docType === "PO" || docData.docType === "BAST" ? (
              // Dual Signatures for 2-party agreements
              <div className="grid grid-cols-2 gap-8 text-[11px] leading-tight">
                <div className="text-center space-y-1">
                  <p className="font-bold">{docData.counterpartOrg || docData.toName || "PIHAK VENDOR / REKANAN"}</p>
                  <p className="italic text-slate-700">Disetujui / Diserahkan Oleh</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">
                      [ Tanda Tangan & Stempel Resmi ]
                    </span>
                  </div>
                  <p className="font-bold underline">
                    {docData.counterpartName || "Direktur / Pimpinan Rekanan"}
                  </p>
                  <p className="text-[10.5px]">{docData.counterpartTitle || "Kuasa Direksi"}</p>
                </div>

                <div className="text-center space-y-1">
                  <p className="font-bold">
                    {docData.signerOrg || "PT SAS Aero Sishan (SAS)"}
                  </p>
                  <p className="font-bold text-[11px]">
                    {docData.signerDept || "DIVISI PENGADAAN"}
                  </p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">
                      [ Tanda Tangan & Cap Perusahaan ]
                    </span>
                  </div>
                  <p className="font-bold underline">
                    {docData.signerName || "Nama Terkait"}
                  </p>
                  <p className="text-[10.5px]">{docData.signerTitle || "Jabatan"}</p>
                </div>
              </div>
            ) : (
              // Single Signature Block at bottom right matching TEMPLATE RFQ.jpg
              <div className="flex justify-end text-[11px] leading-tight">
                <div className="text-center w-64 space-y-1">
                  <p className="font-bold">
                    {docData.signerOrg || "PT SAS Aero Sishan (SAS)"}
                  </p>
                  <p className="font-bold text-[11px]">
                    {docData.signerDept || "DIVISI PENGADAAN"}
                  </p>
                  <div className="h-20 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">
                      [ Tanda Tangan & Cap ]
                    </span>
                  </div>
                  <p className="font-bold underline text-[11.5px]">
                    {docData.signerName || "Nama Terkait"}
                  </p>
                  <p className="text-[10.5px]">{docData.signerTitle || "Jabatan"}</p>
                </div>
              </div>
            )}

            {/* Footer Bottom Right: From RFQ No & Page 1 of 1 */}
            <div className="flex items-center justify-end text-[10px] leading-tight pt-4 border-t border-slate-200 print:border-black">
              <div className="text-right">
                <p>From {docData.docType} No: {docData.docNumber}</p>
                <p>Page 1 of 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
