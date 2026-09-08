import { getAccessToken, googleSignIn } from "./googleAuth";
import {
  Vendor,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  RFQ,
} from "../types/procurement";
import { formatRupiah, formatDate } from "../utils/formatters";

/**
 * Ensures a valid access token is available, or triggers Google Sign In
 */
export const ensureToken = async (): Promise<string> => {
  const token = await getAccessToken();
  if (token) return token;

  const result = await googleSignIn();
  if (!result?.accessToken) {
    throw new Error("Autentikasi Google diperlukan untuk mengakses Google Sheets & Docs.");
  }
  return result.accessToken;
};

// ==========================================
// GOOGLE SHEETS API INTEGRATION
// ==========================================

export interface GoogleSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  rowsCount: number;
}

/**
 * Creates a formatted Google Spreadsheet with sheets for Procurement data
 */
export const createProcurementSpreadsheet = async (
  title: string,
  sheetsData: Array<{
    sheetTitle: string;
    headers: string[];
    rows: (string | number)[][];
  }>
): Promise<GoogleSpreadsheetResult> => {
  const token = await ensureToken();

  // 1. Create spreadsheet with specified sheets
  const createPayload = {
    properties: {
      title: `${title} - SIAP e-Procurement`,
    },
    sheets: sheetsData.map((s) => ({
      properties: {
        title: s.sheetTitle,
        gridProperties: {
          rowCount: Math.max(s.rows.length + 10, 30),
          columnCount: Math.max(s.headers.length + 2, 12),
          frozenRowCount: 1,
        },
      },
    })),
  };

  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Gagal membuat Google Spreadsheet (Status ${createRes.status})`
    );
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl =
    spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate values for each sheet using values.batchUpdate
  const dataPayloads = sheetsData.map((s) => ({
    range: `'${s.sheetTitle}'!A1`,
    values: [s.headers, ...s.rows],
  }));

  const valueUpdateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: dataPayloads,
      }),
    }
  );

  if (!valueUpdateRes.ok) {
    console.warn("Gagal mengisi data sheet nilai secara batch:", await valueUpdateRes.text());
  }

  let totalRows = sheetsData.reduce((acc, s) => acc + s.rows.length, 0);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: `${title} - SIAP e-Procurement`,
    rowsCount: totalRows,
  };
};

/**
 * Synchronize Vendor Directory to a dedicated Google Sheet
 */
export const syncVendorsToGoogleSheet = async (
  vendors: Vendor[]
): Promise<GoogleSpreadsheetResult> => {
  const headers = [
    "Kode Vendor",
    "Nama Perusahaan",
    "Kategori Usaha",
    "Status Legalitas",
    "NPWP",
    "NIB / Izin Usaha",
    "Email Kontak",
    "No. Telepon",
    "Kota Domisili",
    "Rating Rekanan",
    "On-Time Delivery (%)",
    "Skor Kepatuhan",
    "Total Transaksi YTD (Rp)",
    "Rekening Bank",
    "Sertifikasi",
  ];

  const rows: (string | number)[][] = vendors.map((v) => {
    const bankStr: string =
      typeof v.bankAccount === "object" && v.bankAccount !== null
        ? `${v.bankAccount.bankName} - ${v.bankAccount.accountNumber} a.n ${v.bankAccount.accountHolder}`
        : String(v.bankAccount || "-");

    const certs = Array.isArray(v.certifications) ? v.certifications.join(", ") : "-";

    return [
      v.vendorCode || "",
      v.name || "",
      v.category || "",
      v.status || v.legalStatus || "ACTIVE_VERIFIED",
      v.npwp || "-",
      v.nib || "-",
      v.email || "-",
      v.phone || "-",
      v.city || "Jakarta",
      v.rating || 4.5,
      `${v.onTimeDeliveryRate || 95}%`,
      v.complianceScore || 90,
      v.totalSpendYTD || 0,
      bankStr,
      certs,
    ];
  });

  return createProcurementSpreadsheet(`Direktori Rekanan Vendor (${new Date().toLocaleDateString("id-ID")})`, [
    {
      sheetTitle: "Master Rekanan Vendor",
      headers,
      rows,
    },
  ]);
};

/**
 * Synchronize Purchase Orders (PO) to Google Sheets
 */
export const syncPOsToGoogleSheet = async (
  purchaseOrders: PurchaseOrder[]
): Promise<GoogleSpreadsheetResult> => {
  const headers = [
    "No. Purchase Order",
    "No. Requisition (PR)",
    "Judul Pengadaan",
    "Nama Rekanan / Vendor",
    "Tanggal Penerbitan",
    "Target Pengiriman",
    "Syarat Pembayaran",
    "Status PO",
    "Total Nilai Kontrak (Rp)",
    "Rincian Barang / Layanan",
  ];

  const rows = purchaseOrders.map((po) => {
    const itemsSummary = (po.items || [])
      .map((it) => `${it.name} (${it.quantity} ${it.unit})`)
      .join("; ");

    return [
      po.poNumber,
      po.prNumber || "-",
      po.title,
      po.vendorName,
      formatDate(po.issueDate),
      formatDate(po.deliveryDeadline),
      po.paymentTerms || "Net 30 Days",
      po.status,
      po.totalAmount,
      itemsSummary,
    ];
  });

  return createProcurementSpreadsheet(`Daftar Kontrak Purchase Order (${new Date().toLocaleDateString("id-ID")})`, [
    {
      sheetTitle: "Purchase Orders",
      headers,
      rows,
    },
  ]);
};

/**
 * Synchronize Master Procurement Database (All 5 Modules in One Spreadsheet)
 */
export const syncMasterProcurementWorkbook = async (data: {
  vendors: Vendor[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  invoices: Invoice[];
}): Promise<GoogleSpreadsheetResult> => {
  // 1. Vendors Sheet
  const vendorHeaders = [
    "Kode Vendor",
    "Nama Perusahaan",
    "Kategori",
    "Status Legal",
    "NPWP",
    "Email",
    "Telepon",
    "Rating",
    "On-Time (%)",
    "Total Transaksi (Rp)",
  ];
  const vendorRows = data.vendors.map((v) => [
    v.vendorCode,
    v.name,
    v.category,
    v.status || v.legalStatus || "ACTIVE",
    v.npwp || "-",
    v.email || "-",
    v.phone || "-",
    v.rating || 4.5,
    `${v.onTimeDeliveryRate || 95}%`,
    v.totalSpendYTD || 0,
  ]);

  // 2. PRs Sheet
  const prHeaders = [
    "No. PR",
    "Judul Permohonan",
    "Departemen",
    "Pemohon",
    "Prioritas",
    "Status Approval",
    "Tanggal Pengajuan",
    "Estimasi Anggaran (Rp)",
  ];
  const prRows = data.requisitions.map((pr) => [
    pr.prNumber,
    pr.title,
    pr.department,
    pr.requesterName,
    pr.urgency,
    pr.status,
    formatDate(pr.submissionDate),
    pr.estimatedBudget,
  ]);

  // 3. POs Sheet
  const poHeaders = [
    "No. PO",
    "No. PR Terkait",
    "Judul Kontrak",
    "Vendor Rekanan",
    "Tgl Terbit",
    "Deadline Pengiriman",
    "Status PO",
    "Nilai Kontrak (Rp)",
  ];
  const poRows = data.purchaseOrders.map((po) => [
    po.poNumber,
    po.prNumber || "-",
    po.title,
    po.vendorName,
    formatDate(po.issueDate),
    formatDate(po.deliveryDeadline),
    po.status,
    po.totalAmount,
  ]);

  // 4. BAST / GRN Sheet
  const grnHeaders = [
    "No. BAST / GRN",
    "No. PO Terkait",
    "Nama Vendor",
    "Tanggal Penerimaan",
    "Petugas Penerima",
    "Status Hasil QC",
    "Catatan Pemeriksaan",
  ];
  const grnRows = data.goodsReceipts.map((grn) => [
    grn.grnNumber,
    grn.poNumber,
    grn.vendorName,
    formatDate(grn.receiptDate),
    grn.receivedBy,
    grn.inspectionStatus,
    grn.inspectorNotes || "Barang diterima dalam kondisi baik.",
  ]);

  // 5. Invoices Sheet
  const invHeaders = [
    "No. Faktur Vendor",
    "No. PO Terkait",
    "No. BAST Terkait",
    "Nama Rekanan",
    "Tanggal Faktur",
    "Jatuh Tempo",
    "Status 3-Way Match",
    "Nilai Tagihan (Rp)",
  ];
  const invRows = data.invoices.map((inv) => [
    inv.invoiceNumber,
    inv.poNumber,
    inv.grnNumber,
    inv.vendorName,
    formatDate(inv.invoiceDate),
    formatDate(inv.dueDate),
    inv.status,
    inv.amount,
  ]);

  return createProcurementSpreadsheet(`Master Database Pengadaan (${new Date().toLocaleDateString("id-ID")})`, [
    { sheetTitle: "1. Rekanan Vendor", headers: vendorHeaders, rows: vendorRows },
    { sheetTitle: "2. Purchase Requisitions", headers: prHeaders, rows: prRows },
    { sheetTitle: "3. Purchase Orders", headers: poHeaders, rows: poRows },
    { sheetTitle: "4. BAST Penerimaan", headers: grnHeaders, rows: grnRows },
    { sheetTitle: "5. Faktur & Matching", headers: invHeaders, rows: invRows },
  ]);
};

// ==========================================
// GOOGLE DOCS MAIL MERGE INTEGRATION
// ==========================================

export interface GoogleDocResult {
  documentId: string;
  documentUrl: string;
  title: string;
}

/**
 * Creates a formatted Google Document and inserts rich text paragraphs
 */
export const createGoogleDocFromText = async (
  title: string,
  content: string
): Promise<GoogleDocResult> => {
  const token = await ensureToken();

  // 1. Create document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `${title} - SIAP e-Procurement`,
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Gagal membuat Google Doc (Status ${createRes.status})`
    );
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Insert content at end of document
  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content,
            },
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn("Gagal menyisipkan teks ke Google Doc:", await updateRes.text());
  }

  return {
    documentId,
    documentUrl,
    title: `${title} - SIAP e-Procurement`,
  };
};

/**
 * Mail Merge: Generates a Purchase Order Contract Document in Google Docs
 */
export const mailMergePurchaseOrderDoc = async (
  po: PurchaseOrder,
  customNotes?: string
): Promise<GoogleDocResult> => {
  const itemsText = (po.items || [])
    .map(
      (it, idx) =>
        `   ${idx + 1}. ${it.name}\n` +
        `      - Kuantitas: ${it.quantity} ${it.unit}\n` +
        `      - Harga Satuan: ${formatRupiah(it.unitPrice)}\n` +
        `      - Total Subtotal: ${formatRupiah(it.totalPrice)}`
    )
    .join("\n\n");

  const poDocTemplate = `
================================================================================
                    SURAT PERINTAH KERJA / PURCHASE ORDER (PO)
                       SISTEM INFORMASI PENGADAAN (SIAP)
================================================================================

NOMOR KONTRAK PO : ${po.poNumber}
NOMOR REFERENSI PR : ${po.prNumber || "PR-2026-001"}
TANGGAL PENERBITAN : ${formatDate(po.issueDate)}
DEADLINE PENGIRIMAN: ${formatDate(po.deliveryDeadline)}
STATUS KONTRAK    : RESMI / DITERBITKAN

--------------------------------------------------------------------------------
1. PIHAK PERTAMA (PEMBELI / PENGADAAN):
--------------------------------------------------------------------------------
   Nama Perusahaan : PT NUSANTARA DIGITAL CORP Tbk
   Departemen      : ${po.department || "Procurement & Supply Chain Division"}
   Alamat Kantor   : Gedung Cyber Tower Lt. 18, Jl. HR Rasuna Said, Jakarta Selatan 12940
   Email Pengadaan : procurement@nusantara-corp.co.id
   Telepon Kantor  : (021) 5299-8800

--------------------------------------------------------------------------------
2. PIHAK KEDUA (REKANAN / VENDOR PENYEDIA):
--------------------------------------------------------------------------------
   Nama Perusahaan : ${po.vendorName}
   Status Legal    : Rekanan Terverifikasi (KBLI & DJP Valid)
   Alamat Rekanan  : ${po.vendorAddress || "Kawasan Industri Terpadu, Jakarta"}
   Email Kontak    : ${po.vendorEmail || `commercial@${po.vendorName.toLowerCase().replace(/[^a-z0-9]/g, "")}.co.id`}

--------------------------------------------------------------------------------
3. SPESIFIKASI BARANG / JASA & RINCIAN HARGA:
--------------------------------------------------------------------------------
Judul Pengadaan: ${po.title}

RINCIAN ITEM:
${itemsText}

--------------------------------------------------------------------------------
TOTAL NILAI KONTRAK: ${formatRupiah(po.totalAmount)}
(Termasuk PPN 11% sebesar ${formatRupiah(po.ppnAmount)} sesuai ketentuan perpajakan Republik Indonesia)
--------------------------------------------------------------------------------

4. KETENTUAN DAN SYARAT PEMBAYARAN:
--------------------------------------------------------------------------------
   a. Syarat Pembayaran: ${po.paymentTerms || "Net 30 Days (30 Hari Kalender)"}
   b. Pembayaran ditransfer setelah Berita Acara Serah Terima (BAST) dan Faktur Pajak
      diverifikasi lolos uji 3-Way Matching (PO, BAST, Faktur).
   c. Lokasi Pengiriman: Warehouse & IT Logistics Hub, Jakarta.
   d. Ketepatan waktu pengiriman mempengaruhi skor kepatuhan rekanan (Vendor Scorecard).

${customNotes ? `5. CATATAN KHUSUS PENGADAAN:\n   ${customNotes}\n` : ""}
--------------------------------------------------------------------------------
LEMBAR PENGESAHAN KONTRAK:
--------------------------------------------------------------------------------

PIHAK PERTAMA (PEMBELI)                  PIHAK KEDUA (PENYEDIA)
PT NUSANTARA DIGITAL CORP Tbk            ${po.vendorName}



_____________________________            _____________________________
${po.signedBy || "Ir. Irwan Kurniawan"}                Direktur Utama / Perwakilan Sah
VP Procurement & Supply Chain            Tgl: ${formatDate(po.signedDate || po.issueDate)}
`;

  return createGoogleDocFromText(`Purchase Order ${po.poNumber} - ${po.vendorName}`, poDocTemplate);
};

/**
 * Mail Merge: Generates a Berita Acara Serah Terima (BAST) Document in Google Docs
 */
export const mailMergeBASTDoc = async (
  grn: GoodsReceipt,
  poDetails?: PurchaseOrder
): Promise<GoogleDocResult> => {
  const itemsText = (grn.items || [])
    .map(
      (it, idx) =>
        `   ${idx + 1}. ${it.name} (Ref PO Item: ${it.poItemId})\n` +
        `      - Kuantitas Dipesan: ${it.orderedQty} ${it.unit}\n` +
        `      - Kuantitas Diterima: ${it.receivedQty} ${it.unit}\n` +
        `      - Diterima Baik: ${it.acceptedQty} ${it.unit} | Ditolak: ${it.rejectedQty} ${it.unit}\n` +
        `      - Catatan Kondisi: ${it.conditionNote || "Kondisi Baik & Bersegel"}`
    )
    .join("\n\n");

  const bastTemplate = `
================================================================================
              BERITA ACARA SERAH TERIMA BARANG / JASA (BAST)
                       SISTEM INFORMASI PENGADAAN (SIAP)
================================================================================

NOMOR DOKUMEN BAST : ${grn.grnNumber}
REFERENSI NOMOR PO : ${grn.poNumber}
TANGGAL PENERIMAAN : ${formatDate(grn.receiptDate)}
LOKASI PENERIMAAN  : ${grn.warehouseLocation || "Main Logistic & Receiving Center, Jakarta"}
SURAT JALAN VENDOR : ${grn.deliveryNoteNumber || "SJ-VND-2026/001"}

Pada hari ini, tanggal ${formatDate(grn.receiptDate)}, telah dilakukan pemeriksaan
dan serah terima barang/jasa untuk kontrak pesanan nomor ${grn.poNumber}.

--------------------------------------------------------------------------------
1. IDENTITAS PENYEDIA & PENERIMA:
--------------------------------------------------------------------------------
   Penyedia / Vendor  : ${grn.vendorName}
   Petugas Penerima   : ${grn.receivedBy} (Divisi Logistik & QA)
   Status Hasil QC    : ${grn.inspectionStatus === "PASSED" ? "LOLOS UJI KUALITAS 100%" : grn.inspectionStatus}

--------------------------------------------------------------------------------
2. RINCIAN HASIL INSPEKSI BARANG / JASA:
--------------------------------------------------------------------------------
${itemsText}

CATATAN PEMERIKSAAN KUALITAS:
${grn.inspectorNotes || "Semua barang telah diuji fisik, kelengkapan serial number, dan kartu garansi resmi. Dinyatakan memenuhi spesifikasi."}

--------------------------------------------------------------------------------
3. KESIMPULAN & REKOMENDASI PEMBAYARAN:
--------------------------------------------------------------------------------
Berdasarkan hasil pemeriksaan fisik dan uji fungsi teknis di atas, barang/jasa
dinyatakan TELAH DITERIMA DENGAN BAIK dan dokumen ini dapat dilanjutkan ke
proses 3-Way Matching untuk otorisasi pembayaran faktur keuangan.

LEMBAR TANDA TANGAN:

Pihak Penerima (Logistik & QC)           Pihak Penyedia / Vendor
PT Nusantara Digital Corp Tbk            ${grn.vendorName}



_____________________________            _____________________________
${grn.receivedBy}                        Petugas Pengirim / Kurir
NIP: LOG-2026-089                        Tgl: ${formatDate(grn.receiptDate)}
`;

  return createGoogleDocFromText(`BAST Serah Terima ${grn.grnNumber} - PO ${grn.poNumber}`, bastTemplate);
};

/**
 * Mail Merge: Generates Vendor Due Diligence & Profile Dossier in Google Docs
 */
export const mailMergeVendorDossierDoc = async (
  vendor: Vendor
): Promise<GoogleDocResult> => {
  const bankStr =
    typeof vendor.bankAccount === "object" && vendor.bankAccount !== null
      ? `${vendor.bankAccount.bankName} (No. Rek: ${vendor.bankAccount.accountNumber} a.n ${vendor.bankAccount.accountHolder})`
      : vendor.bankAccount || "Bank Mandiri - 124-00-8899120-1";

  const certs = Array.isArray(vendor.certifications)
    ? vendor.certifications.join(", ")
    : "ISO 9001:2015, KBLI 62019";

  const dossierTemplate = `
================================================================================
             BERKAS EVALUASI & UJI TUNTAS REKANAN (VENDOR DOSSIER)
                       SISTEM INFORMASI PENGADAAN (SIAP)
================================================================================

KODE REKANAN     : ${vendor.vendorCode}
NAMA PERUSAHAAN  : ${vendor.name}
KATEGORI USAHA   : ${vendor.category}
STATUS LEGALITAS : ${vendor.status || vendor.legalStatus || "ACTIVE_VERIFIED"}
TANGGAL LAPORAN  : ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}

--------------------------------------------------------------------------------
1. DATA LEGALITAS & ADMINISTRASI:
--------------------------------------------------------------------------------
   - Nomor Pokok Wajib Pajak (NPWP) : ${vendor.npwp || "01.234.567.8-012.000 (Valid DJP)"}
   - Nomor Induk Berusaha (NIB)    : ${vendor.nib || "9120001234567 (OSS RBA)"}
   - Alamat Domisili               : ${vendor.address || "Jl. HR Rasuna Said No. 45"}, ${vendor.city || "Jakarta"}
   - Email Resmi                   : ${vendor.email || "contact@vendor.co.id"}
   - Nomor Kontak Telepon          : ${vendor.phone || "(021) 5790-1234"}
   - Rekening Bank Resmi           : ${bankStr}
   - Sertifikasi & Lisensi Resmi   : ${certs}

--------------------------------------------------------------------------------
2. SCORECARD KINERJA & KPI PENGADAAN (VMS SCORECARD):
--------------------------------------------------------------------------------
   - Rating Kepuasan User (CSAT)   : ${vendor.rating || 4.8} / 5.0 Bintang
   - Tingkat Ketepatan Kirim       : ${vendor.onTimeDeliveryRate || 95}% (On-Time Delivery SLA)
   - Skor Kepatuhan & Audit        : ${vendor.complianceScore || 92} / 100
   - Total Transaksi Pengadaan YTD : ${formatRupiah(vendor.totalSpendYTD || 0)}

--------------------------------------------------------------------------------
3. HASIL ANALISIS UJI TUNTAS (DUE DILIGENCE SUMMARY):
--------------------------------------------------------------------------------
Rekanan telah memenuhi seluruh parameter kepatuhan pengadaan barang dan jasa
sesuai regulasi internal PT Nusantara Digital Corp Tbk dan perundang-undangan RI.
Rekanan berhak mengikuti lelang tender dan penunjukan langsung sesuai batas
kewenangan kategori ${vendor.category}.

Tim Penilai Kepatuhan Rekanan:
1. Vendor Management Office (VMO)
2. Divisi Legal & Compliance
3. Internal Audit Division
`;

  return createGoogleDocFromText(`Vendor Dossier ${vendor.vendorCode} - ${vendor.name}`, dossierTemplate);
};

/**
 * Mail Merge: Generates an RFQ / Tender Invitation in Google Docs
 */
export const mailMergeRFQDoc = async (rfq: RFQ): Promise<GoogleDocResult> => {
  const specsText = (rfq.technicalSpecs || [])
    .map(
      (spec, idx) =>
        `   ${idx + 1}. ${spec.item}\n` +
        `      - Kuantitas: ${spec.qty} ${spec.unit}\n` +
        `      - HPS Satuan: ${formatRupiah(spec.hpsUnit)}\n` +
        `      - Spesifikasi Teknis: ${spec.specification || "Sesuai Standar Industri"}`
    )
    .join("\n\n");

  const rfqTemplate = `
================================================================================
             UNDANGAN TENDER & PERMINTAAN PENAWARAN HARGA (RFQ)
                       SISTEM INFORMASI PENGADAAN (SIAP)
================================================================================

NOMOR TENDER / RFQ : ${rfq.rfqNumber}
JUDUL PENGADAAN    : ${rfq.title}
KATEGORI PENGADAAN : ${rfq.category}
TIPE TENDER        : ${rfq.tenderType}
TANGGAL PEMBUKAAN  : ${formatDate(rfq.publishedDate)}
BATAS AKHIR BID    : ${formatDate(rfq.submissionDeadline)}
STATUS TENDER      : ${rfq.status}

Kepada Yth.
Pimpinan Rekanan Terdaftar
Di Tempat

Dengan hormat,
PT Nusantara Digital Corp Tbk mengundang perusahaan Saudara untuk berpartisipasi
dan mengajukan penawaran harga serta dokumen teknis untuk paket pengadaan berikut:

--------------------------------------------------------------------------------
1. RINCIAN SPESIFIKASI DAN PAGU ANGGARAN (HPS):
--------------------------------------------------------------------------------
${specsText}

TOTAL PAGU HPS (HARGA PERKIRAAN SENDIRI): ${formatRupiah(rfq.hpsBudget)}

--------------------------------------------------------------------------------
2. PERSYARATAN DOKUMEN PENAWARAN:
--------------------------------------------------------------------------------
${(rfq.requirements || [
  "Surat Penawaran Harga resmi bertandatangan direktur & bermeterai.",
  "Rincian brosur teknis spesifikasi barang.",
  "Garansi resmi minimal 1 (satu) tahun.",
  "Surat komitmen SLA pengiriman.",
]).map((r, i) => `   ${i + 1}. ${r}`).join("\n")}

Penawaran harga disampaikan melalui Portal Pengadaan SIAP sebelum batas waktu:
${formatDate(rfq.submissionDeadline)}.

Hormat kami,
Panitia Pengadaan PT Nusantara Digital Corp Tbk
`;

  return createGoogleDocFromText(`RFQ Tender ${rfq.rfqNumber} - ${rfq.title}`, rfqTemplate);
};
