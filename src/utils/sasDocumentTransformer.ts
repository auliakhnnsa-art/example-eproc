import {
  RFQ,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  Vendor,
} from "../types/procurement";
import { SASOfficialDocumentData, SASDocItem } from "../components/Common/SASOfficialDocumentView";
import { formatDate } from "./formatters";

/**
 * Transforms an RFQ object into the official SAS Aero Sishan Document format
 */
export function transformRFQToSASDoc(
  rfq: RFQ,
  selectedVendor?: Vendor | null
): SASOfficialDocumentData {
  const items: SASDocItem[] = (rfq.technicalSpecs || []).map((it, idx) => ({
    itemNo: idx + 1,
    materialService: it.item || `MAT-${idx + 101}`,
    description: it.specification || it.item || "Spesifikasi standar operasional",
    qty: it.qty || 1,
    unit: it.unit || "Unit",
    targetDeliveryDate: formatDate(rfq.submissionDeadline),
  }));

  if (items.length === 0) {
    items.push({
      itemNo: 1,
      materialService: "PRC-SRV-001",
      description: rfq.title || "Paket Pengadaan Barang / Jasa",
      qty: 1,
      unit: "Paket",
      targetDeliveryDate: formatDate(rfq.submissionDeadline),
    });
  }

  const termsText = (rfq.requirements || []).length > 0
    ? `Persyaratan Peserta: ${rfq.requirements.join("; ")}`
    : "Sesuai Syarat & Ketentuan Standar RFQ PT SAS Aero Sishan.";

  return {
    docType: "RFQ",
    docNumber: rfq.rfqNumber,
    docDate: formatDate(rfq.publishedDate || rfq.submissionDeadline),
    refPrNumber: rfq.prNumber || "-",
    projectName: rfq.title,
    descNetwork: rfq.category || "General Procurement Network",
    toName: selectedVendor?.name || "PT Rekanan Pengadaan / Penyedia Terdaftar",
    toAddress: selectedVendor?.address || "Alamat Rekanan Terdaftar",
    toPhone: selectedVendor?.phone || "(021) 5299-1000",
    toFax: selectedVendor?.email ? `Email: ${selectedVendor.email}` : "-",
    beforeDate: formatDate(rfq.submissionDeadline),
    items,
    remarks: termsText,
    signerOrg: "PT SAS Aero Sishan (SAS)",
    signerDept: "DIVISI PENGADAAN",
    signerName: "Hendrawan, S.T.",
    signerTitle: "Procurement Manager",
  };
}

/**
 * Transforms a Purchase Requisition (PR) into official SAS Aero Sishan Document format
 */
export function transformPRToSASDoc(pr: PurchaseRequisition): SASOfficialDocumentData {
  const items: SASDocItem[] = (pr.items || []).map((it, idx) => ({
    itemNo: idx + 1,
    materialService: `MAT-${pr.department.slice(0, 3).toUpperCase()}-${idx + 1}`,
    description: `${it.name}${it.specification ? ` - ${it.specification}` : ""}`,
    qty: it.quantity || 1,
    unit: it.unit || "Unit",
    targetDeliveryDate: formatDate(pr.targetDeliveryDate),
    unitPrice: it.estimatedPrice || 0,
    totalPrice: it.totalPrice || (it.estimatedPrice || 0) * (it.quantity || 1),
  }));

  const subtotal = items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
  const taxAmount = Math.round(subtotal * 0.11);
  const grandTotal = subtotal + taxAmount;

  return {
    docType: "PR",
    docNumber: pr.prNumber,
    docDate: formatDate(pr.submissionDate),
    divisionName: pr.department,
    projectName: pr.title,
    descNetwork: `${pr.category} (Urgensi: ${pr.urgency})`,
    toName: "Divisi Pengadaan Barang & Jasa (Procurement Directorate)",
    beforeDate: formatDate(pr.targetDeliveryDate),
    items,
    remarks: pr.justification || "Pengadaan untuk kebutuhan operasional rutin dan ekspansi fasilitas.",
    signerOrg: "PT SAS Aero Sishan (SAS)",
    signerDept: pr.department.toUpperCase(),
    signerName: pr.requesterName || "Bambang Sudarsono",
    signerTitle: "Unit Head / Requestor",
    subtotal,
    taxAmount,
    grandTotal,
  };
}

/**
 * Transforms a Purchase Order (PO) into official SAS Aero Sishan Document format
 */
export function transformPOToSASDoc(po: PurchaseOrder): SASOfficialDocumentData {
  const items: SASDocItem[] = (po.items || []).map((it, idx) => ({
    itemNo: idx + 1,
    materialService: `MAT-${idx + 201}`,
    description: `${it.name}${it.specification ? ` (${it.specification})` : ""}`,
    qty: it.quantity || 1,
    unit: it.unit || "Unit",
    unitPrice: it.unitPrice || 0,
    totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
  }));

  const subtotal = po.subtotal || Math.round(po.totalAmount / 1.11);
  const taxAmount = po.ppnAmount || (po.totalAmount - subtotal);

  return {
    docType: "PO",
    docNumber: po.poNumber,
    docDate: formatDate(po.issueDate),
    refPrNumber: po.prNumber,
    refRfqNumber: po.rfqNumber,
    projectName: po.title,
    descNetwork: "Contract & Fulfillment Network",
    toName: po.vendorName,
    toAddress: po.vendorAddress || "Kantor Rekanan Terverifikasi",
    toPhone: "(021) 789-4560",
    toFax: po.vendorEmail ? `Email: ${po.vendorEmail}` : "-",
    beforeDate: formatDate(po.deliveryDeadline),
    items,
    remarks: po.notes || po.paymentTerms || "Pembayaran Net 30 hari via Transfer Bank setelah BAST ditandatangani lengkap.",
    signerOrg: "PT SAS Aero Sishan (SAS)",
    signerDept: "DIVISI PENGADAAN",
    signerName: po.signedBy || "Hendrawan, S.T.",
    signerTitle: "Procurement Manager",
    counterpartOrg: po.vendorName,
    counterpartName: "Direktur Rekanan",
    counterpartTitle: "Kuasa Direksi Rekanan",
    subtotal,
    taxAmount,
    grandTotal: po.totalAmount,
  };
}

/**
 * Transforms a Goods Receipt Note / BAST into official SAS Aero Sishan Document format
 */
export function transformBASTToSASDoc(
  grn: GoodsReceipt,
  po?: PurchaseOrder | null
): SASOfficialDocumentData {
  const items: SASDocItem[] = (grn.items || []).map((it, idx) => ({
    itemNo: idx + 1,
    materialService: `MAT-QC-${idx + 101}`,
    description: it.name,
    qty: it.orderedQty,
    unit: it.unit,
    orderedQty: it.orderedQty,
    receivedQty: it.acceptedQty,
    condition: it.conditionNote || "Lolos Uji Mutu (Kondisi 100% Baik)",
  }));

  return {
    docType: "BAST",
    docNumber: grn.grnNumber,
    docDate: formatDate(grn.receiptDate),
    refPoNumber: grn.poNumber,
    deliveryNoteNumber: grn.deliveryNoteNumber,
    projectName: po?.title || "Serah Terima Barang & Jasa Operasional",
    descNetwork: `Gudang: ${grn.warehouseLocation}`,
    toName: po?.vendorName || "PT Vendor Penyedia",
    toAddress: "Lokasi Pengiriman Rekanan",
    beforeDate: formatDate(grn.receiptDate),
    items,
    remarks: grn.inspectorNotes || "Seluruh item diperiksa fisik, kuantitas lengkap, segel utuh, dan berfungsi baik.",
    signerOrg: "PT SAS Aero Sishan (SAS)",
    signerDept: "UNIT PENGENDALIAN MUTU & LOGISTIK",
    signerName: grn.receivedBy || "Ahmad Fauzi",
    signerTitle: "Warehouse & QC Inspector",
    counterpartOrg: po?.vendorName || "PIHAK PENYEDIA / KURIR",
    counterpartName: "Petugas Ekspedisi / Vendor",
    counterpartTitle: "Perwakilan Penyedia",
  };
}

/**
 * Transforms an Invoice into official SAS Aero Sishan Document format
 */
export function transformInvoiceToSASDoc(
  invoice: Invoice,
  po?: PurchaseOrder | null
): SASOfficialDocumentData {
  const calculatedSubtotal = Math.round(invoice.amount / 1.11);
  const calculatedTax = invoice.amount - calculatedSubtotal;

  const items: SASDocItem[] = (po?.items || [
    {
      id: "inv-1",
      name: `Pengadaan Barang / Jasa Tagihan Invoice ${invoice.invoiceNumber}`,
      specification: "Sesuai rincian Purchase Order yang telah diserahterimakan",
      quantity: 1,
      unit: "Paket",
      unitPrice: calculatedSubtotal,
      totalPrice: calculatedSubtotal,
    },
  ]).map((it, idx) => ({
    itemNo: idx + 1,
    materialService: `INV-ITEM-${idx + 1}`,
    description: it.name,
    qty: it.quantity || 1,
    unit: it.unit || "Unit",
    unitPrice: it.unitPrice || 0,
    totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
  }));

  return {
    docType: "INVOICE",
    docNumber: invoice.invoiceNumber,
    docDate: formatDate(invoice.invoiceDate),
    refPoNumber: invoice.poNumber,
    refBastNumber: invoice.grnNumber,
    projectName: po?.title || "Penagihan Pengadaan Barang & Jasa",
    descNetwork: `Status 3-Way Match: ${invoice.threeWayMatch.status}`,
    toName: invoice.vendorName,
    toAddress: "NPWP: 01.345.678.9-012.000",
    toPhone: "(021) 789-4560",
    beforeDate: formatDate(invoice.dueDate),
    items,
    remarks: `Ketentuan Pembayaran: Transfer Bank ke Rekening Resmi ${invoice.vendorName}. Rekonsiliasi 3-Way Match terverifikasi sistem.`,
    signerOrg: "PT SAS Aero Sishan (SAS)",
    signerDept: "DIVISI KEUANGAN & AKUNTANSI",
    signerName: "Dewi Lestari, S.E., Ak.",
    signerTitle: "Finance & Accounting Manager",
    counterpartOrg: invoice.vendorName,
    counterpartName: "Finance & Tax Officer",
    counterpartTitle: "Perwakilan Rekanan",
    subtotal: calculatedSubtotal,
    taxAmount: calculatedTax,
    grandTotal: invoice.amount,
  };
}
