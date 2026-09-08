import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PurchaseOrder,
  GoodsReceipt,
  PurchaseRequisition,
  RFQ,
  Vendor,
  ThreeWayMatchRecord,
  Invoice,
} from "../types/procurement";
import { formatRupiah, formatDate } from "./formatters";

/**
 * Capture an HTML DOM element and download it as an official PDF document
 */
export async function downloadElementAsPDF(
  element: HTMLElement | string,
  filename: string = "dokumen-procurement.pdf",
  options?: { title?: string; orientation?: "portrait" | "landscape" }
): Promise<boolean> {
  try {
    const targetEl: HTMLElement | null =
      typeof element === "string" ? document.getElementById(element) : element;

    if (!targetEl) {
      console.error("Target element not found for PDF export:", element);
      return false;
    }

    // Scroll to top of element for clean capture
    targetEl.scrollTop = 0;

    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: targetEl.scrollWidth || 1024,
    });

    const imgData = canvas.toDataURL("image/png");
    const orientation = options?.orientation || "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = orientation === "landscape" ? 297 : 210;
    const pageHeight = orientation === "landscape" ? 210 : 297;
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * availableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, "PNG", margin, position, availableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    // Additional pages if document is long
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, availableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to generate PDF from DOM:", error);
    // Fallback: Trigger standard browser print
    window.print();
    return false;
  }
}

/**
 * Print a clean printable document container
 */
export function triggerCleanPrint(elementId?: string, documentTitle?: string) {
  if (elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${documentTitle || "Dokumen Pengadaan Resmi"}</title>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
              <style>
                @page { size: A4 portrait; margin: 15mm; }
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #0f172a; background: #fff; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; }
                th { background-color: #f1f5f9; font-weight: bold; }
                .no-print { display: none !important; }
              </style>
            </head>
            <body onload="window.print();window.close()">
              <div class="print-container">
                ${el.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    }
  }

  // If iframe or popup is blocked, perform window.print
  window.print();
}

/**
 * Direct programmatic PDF generator for Purchase Order (PO)
 */
export function exportPurchaseOrderDirectPDF(po: PurchaseOrder) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  let y = 18;

  // Header Letterhead
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, 180, 18, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PT ENTERPRISE KORPORA INDONESIA", margin + 5, y + 7);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Direktorat Pengadaan Barang & Jasa (Supply Chain & Procurement)", margin + 5, y + 13);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SURAT PESANAN RESMI", 195 - margin - 48, y + 7);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`NO: ${po.poNumber}`, 195 - margin - 48, y + 13);

  y += 24;

  // PO Meta Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI PEMESANAN & VENDOR:", margin, y);
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, 180, 26, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Kepada Rekanan: ${po.vendorName}`, margin + 4, y + 6);
  doc.text(`Alamat: ${po.vendorAddress}`, margin + 4, y + 11);
  doc.text(`Email / Kontak: ${po.vendorEmail}`, margin + 4, y + 16);
  doc.text(`Status PO: ${po.status}`, margin + 4, y + 21);

  doc.text(`Unit Pemohon: ${po.department}`, 115, y + 6);
  doc.text(`Tanggal Terbit: ${formatDate(po.issueDate)}`, 115, y + 11);
  doc.text(`Batas Kirim: ${formatDate(po.deliveryDeadline)}`, 115, y + 16);
  doc.text(`Syarat Bayar: ${po.paymentTerms}`, 115, y + 21);

  y += 32;

  // Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("RINCIAN BARANG / JASA YANG DIPESAN:", margin, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, 180, 7, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, 180, 7, "S");

  doc.text("No", margin + 2, y + 5);
  doc.text("Uraian Barang / Jasa", margin + 12, y + 5);
  doc.text("Qty", margin + 105, y + 5);
  doc.text("Satuan", margin + 118, y + 5);
  doc.text("Harga Satuan (IDR)", margin + 135, y + 5);
  doc.text("Total (IDR)", margin + 160, y + 5);

  y += 7;

  // Table Body
  doc.setFont("helvetica", "normal");
  po.items.forEach((item, idx) => {
    doc.rect(margin, y, 180, 10, "S");
    doc.text(`${idx + 1}`, margin + 2, y + 6);
    
    // Name and spec truncated safely
    const itemName = item.name.length > 50 ? item.name.substring(0, 48) + "..." : item.name;
    doc.setFont("helvetica", "bold");
    doc.text(itemName, margin + 12, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const spec = (item.specification || "").substring(0, 58);
    doc.text(spec, margin + 12, y + 8);
    doc.setFontSize(8);

    doc.text(`${item.quantity}`, margin + 107, y + 6);
    doc.text(`${item.unit}`, margin + 118, y + 6);
    doc.text(`${formatRupiah(item.unitPrice)}`, margin + 135, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`${formatRupiah(item.totalPrice)}`, margin + 160, y + 6);
    doc.setFont("helvetica", "normal");

    y += 10;
  });

  // Table Totals
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, 180, 16, "FD");

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 135, y + 5);
  doc.text(`${formatRupiah(po.subtotal)}`, 160, y + 5);

  doc.text("PPN 11%:", 135, y + 9);
  doc.text(`${formatRupiah(po.ppnAmount)}`, 160, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text("GRAND TOTAL:", 135, y + 14);
  doc.text(`${formatRupiah(po.totalAmount)}`, 160, y + 14);
  doc.setTextColor(15, 23, 42);

  y += 22;

  // Notes
  if (po.notes) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.text(`Catatan & Instruksi Pengiriman: ${po.notes}`, margin, y);
    y += 8;
  }

  // Signature Blocks
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("LEMBAR PENGESAHAN & PERSETUJUAN KONTRAK:", margin, y);
  y += 4;

  const sigBoxWidth = 85;
  const sigBoxHeight = 32;

  // Vendor Signature
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigBoxWidth, sigBoxHeight, 2, 2, "S");
  doc.setFontSize(7.5);
  doc.text("Disetujui & Diterima Oleh Rekanan:", margin + 4, y + 5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text("(Tanda Tangan & Cap Basah Perusahaan)", margin + 4, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(po.vendorName, margin + 4, y + 28);

  // Corporate Procurement Signature
  doc.roundedRect(margin + sigBoxWidth + 10, y, sigBoxWidth, sigBoxHeight, 2, 2, "S");
  doc.text("Disahkan Oleh Kuasa Pengadaan:", margin + sigBoxWidth + 14, y + 5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text("DIGITALLY SIGNED & VERIFIED", margin + sigBoxWidth + 14, y + 14);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tgl Otorisasi: ${po.signedDate || formatDate(new Date().toISOString())}`, margin + sigBoxWidth + 14, y + 19);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(po.signedBy || "Ir. Irwan Kurniawan (Procurement Director)", margin + sigBoxWidth + 14, y + 28);

  // Download PDF
  const safePoNumber = po.poNumber.replace(/[/\\?%*:|"<>]/g, "-");
  doc.save(`PO-${safePoNumber}.pdf`);
}

/**
 * Direct programmatic PDF generator for Goods Receipt / BAST
 */
export function exportGoodsReceiptDirectPDF(grn: GoodsReceipt) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  let y = 18;

  // Header
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(margin, y, 180, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("BERITA ACARA SERAH TERIMA (BAST)", margin + 5, y + 7);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Penerimaan Barang & Jasa (Goods Receipt Note)", margin + 5, y + 13);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`NO: ${grn.grnNumber}`, 195 - margin - 45, y + 7);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`TGL: ${formatDate(grn.receiptDate)}`, 195 - margin - 45, y + 13);

  y += 24;

  // Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DATA REFERANSI PENGIRIMAN & PEMERIKSAAN:", margin, y);
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, 180, 24, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Nama Rekanan / Pengirim: ${grn.vendorName}`, margin + 4, y + 6);
  doc.text(`No. Referensi PO: ${grn.poNumber}`, margin + 4, y + 12);
  doc.text(`No. Surat Jalan Vendor: ${grn.deliveryNoteNumber}`, margin + 4, y + 18);

  doc.text(`Lokasi Penerimaan: ${grn.warehouseLocation}`, 115, y + 6);
  doc.text(`Petugas Pemeriksa: ${grn.receivedBy}`, 115, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(grn.inspectionStatus === "PASSED" ? 16 : 217, grn.inspectionStatus === "PASSED" ? 185 : 119, grn.inspectionStatus === "PASSED" ? 129 : 6);
  doc.text(`Hasil Uji Mutu (QC): ${grn.inspectionStatus}`, 115, y + 18);
  doc.setTextColor(15, 23, 42);

  y += 30;

  // Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("HASIL PEMERIKSAAN FISIK & KUANTITAS:", margin, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, 180, 7, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, 180, 7, "S");

  doc.text("No", margin + 2, y + 5);
  doc.text("Nama Barang / Komponen", margin + 12, y + 5);
  doc.text("Order", margin + 95, y + 5);
  doc.text("Diterima", margin + 110, y + 5);
  doc.text("Lolos QC", margin + 128, y + 5);
  doc.text("Reject", margin + 145, y + 5);
  doc.text("Catatan Kondisi", margin + 158, y + 5);

  y += 7;

  doc.setFont("helvetica", "normal");
  grn.items.forEach((it, idx) => {
    doc.rect(margin, y, 180, 9, "S");
    doc.text(`${idx + 1}`, margin + 2, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text(it.name.substring(0, 42), margin + 12, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(`${it.orderedQty} ${it.unit}`, margin + 95, y + 6);
    doc.text(`${it.receivedQty}`, margin + 110, y + 6);
    doc.setTextColor(16, 185, 129);
    doc.text(`${it.acceptedQty}`, margin + 128, y + 6);
    doc.setTextColor(225, 29, 72);
    doc.text(`${it.rejectedQty}`, margin + 145, y + 6);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7);
    doc.text((it.conditionNote || "Baik").substring(0, 20), margin + 158, y + 6);
    doc.setFontSize(8);
    y += 9;
  });

  y += 5;

  if (grn.inspectorNotes) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.text(`Catatan Berita Acara: ${grn.inspectorNotes}`, margin, y);
    y += 8;
  }

  // Signatures
  const sigBoxWidth = 85;
  const sigBoxHeight = 30;

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigBoxWidth, sigBoxHeight, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Pihak Pertama (Yang Menyerahkan / Vendor):", margin + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(grn.vendorName, margin + 4, y + 25);

  doc.roundedRect(margin + sigBoxWidth + 10, y, sigBoxWidth, sigBoxHeight, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.text("Pihak Kedua (Yang Menerima / Tim QC):", margin + sigBoxWidth + 14, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(grn.receivedBy, margin + sigBoxWidth + 14, y + 25);

  const safeGrnNumber = grn.grnNumber.replace(/[/\\?%*:|"<>]/g, "-");
  doc.save(`BAST-${safeGrnNumber}.pdf`);
}

/**
 * Direct programmatic PDF generator for Vendor Profile Sheet
 */
export function exportVendorProfileDirectPDF(vendor: Vendor) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  let y = 18;

  // Header Letterhead
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, 180, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PT ENTERPRISE KORPORA INDONESIA", margin + 5, y + 7);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Vendor Management System (VMS) - Lembar Profil & Uji Kepatuhan Rekanan", margin + 5, y + 13);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PROFIL REKANAN RESMI", 195 - margin - 50, y + 7);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`KODE: ${vendor.vendorCode}`, 195 - margin - 50, y + 13);

  y += 24;

  // Company Overview
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("1. IDENTITAS & LEGALITAS PERUSAHAAN", margin, y);
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, 180, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(vendor.name, margin + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Kategori Usaha: ${vendor.category}`, margin + 4, y + 13);
  doc.text(`Nomor Induk Berusaha (NIB): ${vendor.nib || "-"}`, margin + 4, y + 18);
  doc.text(`NPWP Perusahaan: ${vendor.npwp || "-"}`, margin + 4, y + 23);
  doc.text(`Domisili / Alamat: ${vendor.address || "-"} ${vendor.city ? `(${vendor.city})` : ""}`, margin + 4, y + 28);
  doc.text(`Email & Telepon: ${vendor.email || "-"} | ${vendor.phone || "-"}`, margin + 4, y + 33);

  y += 42;

  // Performance Scorecard
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("2. SCORECARD KINERJA & KEPATUHAN PENGADAAN (KPI)", margin, y);
  y += 4;

  const cardWidth = 42;
  const cardHeight = 18;

  // Metric 1: Rating
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text("Rating Evaluasi:", margin + 3, y + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${vendor.rating || 4.5} / 5.0 ⭐`, margin + 3, y + 14);

  // Metric 2: On-Time Delivery
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.roundedRect(margin + cardWidth + 4, y, cardWidth, cardHeight, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(6, 95, 70);
  doc.text("On-Time Delivery Rate:", margin + cardWidth + 7, y + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${vendor.onTimeDeliveryRate || 95}%`, margin + cardWidth + 7, y + 14);

  // Metric 3: Compliance Score
  doc.setFillColor(224, 231, 255); // indigo-100
  doc.roundedRect(margin + (cardWidth + 4) * 2, y, cardWidth, cardHeight, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(55, 48, 163);
  doc.text("Skor Kepatuhan (ABAC):", margin + (cardWidth + 4) * 2 + 3, y + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${vendor.complianceScore || vendor.performanceScore || 92}/100`, margin + (cardWidth + 4) * 2 + 3, y + 14);

  // Metric 4: Total Spend
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin + (cardWidth + 4) * 3, y, cardWidth, cardHeight, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text("Total Transaksi YTD:", margin + (cardWidth + 4) * 3 + 3, y + 6);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${formatRupiah(vendor.totalSpendYTD || 0)}`, margin + (cardWidth + 4) * 3 + 3, y + 14);

  y += 24;

  // Banking Details
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("3. INFORMASI REKENING BANK & VERIFIKASI PEMBAYARAN", margin, y);
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, 180, 20, 2, 2, "FD");

  const bankInfo = typeof vendor.bankAccount === "object"
    ? `${vendor.bankAccount.bankName} - No: ${vendor.bankAccount.accountNumber} (a/n ${vendor.bankAccount.accountHolder})`
    : vendor.bankAccount || "Bank Mandiri • 124-00-8899120-1";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Rekening Otorisasi: ${bankInfo}`, margin + 4, y + 7);
  doc.text(`Sertifikasi Terverifikasi: ${(vendor.certifications || ["ISO 9001:2015", "KBLI 62019"]).join(", ")}`, margin + 4, y + 14);

  y += 28;

  // Verification Certification Sign-off
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PENGESAHAN STATUS REKANAN RESMI (VMS COMPLIANCE AUDIT):", margin, y);
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, 180, 28, 2, 2, "S");
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text("STATUS: TERVERIFIKASI & MEMENUHI SYARAT KEPATUHAN PENGADAAN PERUSAHAAN", margin + 4, y + 6);
  doc.setTextColor(100, 116, 139);
  doc.text("Dokumen ini dihasilkan secara otomatis oleh ProcureEdge Enterprise Vendor Management System.", margin + 4, y + 12);
  doc.text(`Tanggal Cetak / Audit: ${formatDate(new Date().toISOString())} | Otorisator: Tim Vendor Qualification & Compliance`, margin + 4, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("PT ENTERPRISE KORPORA INDONESIA - SUPPLY CHAIN DIVISION", margin + 4, y + 24);

  const safeName = vendor.name.replace(/[/\\?%*:|"<>]/g, "-");
  doc.save(`Profil-Vendor-${safeName}.pdf`);
}
