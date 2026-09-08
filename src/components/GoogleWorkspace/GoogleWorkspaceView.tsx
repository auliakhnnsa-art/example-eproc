import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Building,
  ShoppingBag,
  FileCheck,
  Receipt,
  LogOut,
  DownloadCloud,
  FileSignature,
  FileCode,
  ShieldCheck,
  Check,
  Send,
  Database,
  ArrowRight,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
} from "../../services/googleAuth";
import {
  syncMasterProcurementWorkbook,
  syncVendorsToGoogleSheet,
  syncPOsToGoogleSheet,
  mailMergePurchaseOrderDoc,
  mailMergeBASTDoc,
  mailMergeVendorDossierDoc,
  mailMergeRFQDoc,
  GoogleSpreadsheetResult,
  GoogleDocResult,
} from "../../services/googleWorkspaceService";
import {
  Vendor,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  RFQ,
} from "../../types/procurement";
import { formatRupiah, formatDate } from "../../utils/formatters";

interface GoogleWorkspaceViewProps {
  vendors: Vendor[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  invoices: Invoice[];
  rfqs: RFQ[];
}

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({
  vendors = [],
  requisitions = [],
  purchaseOrders = [],
  goodsReceipts = [],
  invoices = [],
  rfqs = [],
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"sheets" | "docs" | "batch">(
    "sheets"
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Results History
  const [recentSheets, setRecentSheets] = useState<GoogleSpreadsheetResult[]>([]);
  const [recentDocs, setRecentDocs] = useState<GoogleDocResult[]>([]);

  // Docs Mail Merge State
  const [docType, setDocType] = useState<"PO" | "BAST" | "VENDOR" | "RFQ">("PO");
  const [selectedPOId, setSelectedPOId] = useState<string>(
    purchaseOrders?.[0]?.id || ""
  );
  const [selectedBASTId, setSelectedBASTId] = useState<string>(
    goodsReceipts?.[0]?.id || ""
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    vendors?.[0]?.id || ""
  );
  const [selectedRFQId, setSelectedRFQId] = useState<string>(
    rfqs?.[0]?.id || ""
  );
  const [customNotes, setCustomNotes] = useState<string>("");

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        setStatusMessage({
          type: "success",
          text: `Terhubung ke Google Workspace: ${res.user.email}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal masuk ke akun Google.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setStatusMessage({
        type: "info",
        text: "Berhasil keluar dari akun Google.",
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Google Sheets Sync
  const handleSyncMaster = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Menyiapkan Master Procurement Workbook di Google Sheets..." });
    try {
      const result = await syncMasterProcurementWorkbook({
        vendors,
        requisitions,
        purchaseOrders,
        goodsReceipts,
        invoices,
      });
      setRecentSheets((prev) => [result, ...prev]);
      setStatusMessage({
        type: "success",
        text: `Master Spreadsheet berhasil dibuat! Terdiri dari 5 Tab dan ${result.rowsCount} total baris data.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal menyinkronkan data ke Google Sheets.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncVendors = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Mengekspor direktori rekanan vendor ke Google Sheets..." });
    try {
      const result = await syncVendorsToGoogleSheet(vendors);
      setRecentSheets((prev) => [result, ...prev]);
      setStatusMessage({
        type: "success",
        text: `Berhasil mengekspor ${vendors.length} data rekanan ke Google Sheets!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal mengekspor vendor.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncPOs = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Mengekspor kontrak PO ke Google Sheets..." });
    try {
      const result = await syncPOsToGoogleSheet(purchaseOrders);
      setRecentSheets((prev) => [result, ...prev]);
      setStatusMessage({
        type: "success",
        text: `Berhasil mengekspor ${purchaseOrders.length} kontrak PO ke Google Sheets!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal mengekspor PO.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Google Docs Mail Merge
  const handleGenerateDoc = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Menjalankan Mail Merge ke template Google Docs..." });
    try {
      let docResult: GoogleDocResult | null = null;

      if (docType === "PO") {
        const po = purchaseOrders.find((p) => p.id === selectedPOId) || purchaseOrders[0];
        if (!po) throw new Error("Silakan pilih Purchase Order terlebih dahulu.");
        docResult = await mailMergePurchaseOrderDoc(po, customNotes);
      } else if (docType === "BAST") {
        const bast = goodsReceipts.find((b) => b.id === selectedBASTId) || goodsReceipts[0];
        if (!bast) throw new Error("Silakan pilih dokumen BAST terlebih dahulu.");
        docResult = await mailMergeBASTDoc(bast);
      } else if (docType === "VENDOR") {
        const vendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
        if (!vendor) throw new Error("Silakan pilih Rekanan Vendor terlebih dahulu.");
        docResult = await mailMergeVendorDossierDoc(vendor);
      } else if (docType === "RFQ") {
        const rfq = rfqs.find((r) => r.id === selectedRFQId) || rfqs[0];
        if (!rfq) throw new Error("Silakan pilih Tender RFQ terlebih dahulu.");
        docResult = await mailMergeRFQDoc(rfq);
      }

      if (docResult) {
        setRecentDocs((prev) => [docResult!, ...prev]);
        setStatusMessage({
          type: "success",
          text: `Mail Merge sukses! Dokumen "${docResult.title}" siap ditinjau di Google Docs.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal membuat dokumen Google Docs.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchMergePOs = async () => {
    if (!purchaseOrders.length) return;
    setIsProcessing(true);
    setStatusMessage({
      type: "info",
      text: `Memproses batch mail merge untuk ${purchaseOrders.length} kontrak PO...`,
    });
    try {
      const results: GoogleDocResult[] = [];
      for (const po of purchaseOrders.slice(0, 5)) {
        const res = await mailMergePurchaseOrderDoc(po);
        results.push(res);
      }
      setRecentDocs((prev) => [...results, ...prev]);
      setStatusMessage({
        type: "success",
        text: `Berhasil mencetak ${results.length} kontrak PO ke Google Docs!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal menjalankan batch mail merge.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Google Workspace Integration Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Google Sheets Sync & Docs Mail Merge
            </h1>
            <p className="text-emerald-100 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Integrasi langsung dengan Google Cloud & Workspace API untuk sinkronisasi basis data pengadaan
              ke Google Sheets dan pencetakan dokumen kontrak otomatis dengan Mail Merge ke Google Docs.
            </p>
          </div>

          {/* Google Auth Status Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Status Akun Google
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentUser
                    ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40"
                    : "bg-amber-400/20 text-amber-200 border border-amber-400/40"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentUser ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {currentUser ? "Terhubung" : "Belum Login"}
              </span>
            </div>

            {currentUser ? (
              <div>
                <p className="text-xs text-white font-medium truncate mb-2.5">
                  {currentUser.email}
                </p>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Putuskan Sambungan</span>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-emerald-100 mb-2.5">
                  Masuk dengan akun Google Anda untuk mengaktifkan sinkronisasi.
                </p>
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isAuthenticating ? "Menghubungkan..." : "Masuk dengan Google"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-white/20">
          <button
            onClick={() => setActiveSubTab("sheets")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "sheets"
                ? "bg-white text-emerald-800 shadow-md"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Sinkronisasi Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveSubTab("docs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "docs"
                ? "bg-white text-blue-800 shadow-md"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Mail Merge Google Docs</span>
          </button>

          <button
            onClick={() => setActiveSubTab("batch")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "batch"
                ? "bg-white text-purple-800 shadow-md"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Batch & Riwayat File</span>
          </button>
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : statusMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
            {statusMessage.type === "error" && (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            {statusMessage.type === "info" && (
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* SUBTAB 1: GOOGLE SHEETS */}
      {activeSubTab === "sheets" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Master All-in-One Workbook */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  5 Tab Spreadsheet
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Master Database Pengadaan
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Ekspor komprehensif ke 1 berkas Google Spreadsheet dengan 5 lembar kerja terpisah:
                  Rekanan Vendor, PR, PO, BAST Logistik, dan Faktur Keuangan.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{vendors.length} Rekanan Terdaftar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{requisitions.length} Purchase Requisitions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{purchaseOrders.length} Kontrak Purchase Order</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{goodsReceipts.length} BAST Logistik</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{invoices.length} Faktur Tagihan Vendor</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSyncMaster}
                disabled={isProcessing}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <span>Buat Master Google Sheet</span>
              </button>
            </div>

            {/* Vendor Sheet */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-4">
                  <Building className="h-5 w-5" />
                </div>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  VMS Directory
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Direktori Rekanan Vendor
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Ekspor data rekanan, status verifikasi legalitas, NPWP, NIB OSS, rekening bank,
                  skor kepatuhan, rating CSAT, dan volume transaksi YTD.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p>• Data Rekanan: <strong>{vendors.length} Vendor</strong></p>
                  <p>• Termasuk Rekening Bank & Kontak Resmi</p>
                  <p>• On-Time Delivery % & Compliance Score</p>
                </div>
              </div>

              <button
                onClick={handleSyncVendors}
                disabled={isProcessing}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4" />
                )}
                <span>Ekspor Direktori Rekanan</span>
              </button>
            </div>

            {/* PO Sheet */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-4">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Purchase Orders
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Daftar Kontrak Surat Pesanan
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Ekspor nomor PO, rekanan terpilih, total nominal kontrak, deadline pengiriman,
                  syarat pembayaran tempo, dan rincian item barang/jasa.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p>• Total Kontrak: <strong>{purchaseOrders.length} PO</strong></p>
                  <p>• Status Lifecycle & Jadwal Delivery</p>
                  <p>• Rincian Item Barang & Nilai Transaksi</p>
                </div>
              </div>

              <button
                onClick={handleSyncPOs}
                disabled={isProcessing}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4" />
                )}
                <span>Ekspor Daftar PO</span>
              </button>
            </div>
          </div>

          {/* Recent Sheets List */}
          {recentSheets.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Google Spreadsheets yang Baru Dihasilkan</span>
              </h4>
              <div className="space-y-3">
                {recentSheets.map((sh, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  >
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{sh.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total {sh.rowsCount} baris data disinkronkan • ID: {sh.spreadsheetId}
                      </p>
                    </div>
                    <a
                      href={sh.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      <span>Buka Google Sheets</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: GOOGLE DOCS MAIL MERGE */}
      {activeSubTab === "docs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Top: Mail Merge Config Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Mail Merge Dokumen Pengadaan ke Google Docs
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih template surat resmi dan record data pengadaan yang ingin digabungkan secara otomatis.
              </p>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                1. Pilih Format Template Dokumen:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setDocType("PO")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    docType === "PO"
                      ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <ShoppingBag className="h-5 w-5 text-blue-600 mb-2" />
                  <p className="font-bold text-xs">Surat Pesanan PO</p>
                  <p className="text-[10px] text-slate-500">Kontrak Pengadaan</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType("BAST")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    docType === "BAST"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <FileCheck className="h-5 w-5 text-emerald-600 mb-2" />
                  <p className="font-bold text-xs">Berita Acara (BAST)</p>
                  <p className="text-[10px] text-slate-500">Serah Terima & QC</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType("VENDOR")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    docType === "VENDOR"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5 text-indigo-600 mb-2" />
                  <p className="font-bold text-xs">Berkas Uji Tuntas</p>
                  <p className="text-[10px] text-slate-500">Vendor Dossier</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType("RFQ")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    docType === "RFQ"
                      ? "border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <FileCode className="h-5 w-5 text-purple-600 mb-2" />
                  <p className="font-bold text-xs">Undangan Tender</p>
                  <p className="text-[10px] text-slate-500">RFQ & RKS Teknis</p>
                </button>
              </div>
            </div>

            {/* Target Item Selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Pilih Data Pengadaan:
              </label>

              {docType === "PO" && (
                <div>
                  <select
                    value={selectedPOId}
                    onChange={(e) => setSelectedPOId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.poNumber} — {po.vendorName} ({formatRupiah(po.totalAmount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {docType === "BAST" && (
                <div>
                  <select
                    value={selectedBASTId}
                    onChange={(e) => setSelectedBASTId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {goodsReceipts.map((grn) => (
                      <option key={grn.id} value={grn.id}>
                        {grn.grnNumber} — Ref PO: {grn.poNumber} ({grn.vendorName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {docType === "VENDOR" && (
                <div>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorCode} — {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {docType === "RFQ" && (
                <div>
                  <select
                    value={selectedRFQId}
                    onChange={(e) => setSelectedRFQId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {rfqs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rfqNumber} — {r.title} ({formatRupiah(r.budget)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Catatan Tambahan Khusus (Opsional):
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Contoh: Lampiran SLA pengiriman maksimal 3 hari kerja..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateDoc}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>Jalankan Mail Merge & Buka di Google Docs</span>
            </button>
          </div>

          {/* Right: Template Preview Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Format Struktur Dokumen Google Docs
              </h4>

              <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-2 shadow-xs leading-relaxed">
                <div className="text-center font-bold text-slate-900 border-b pb-2">
                  PT NUSANTARA DIGITAL CORP Tbk
                  <div className="text-[9px] font-normal text-slate-500">
                    Sistem Informasi Pengadaan (SIAP)
                  </div>
                </div>

                {docType === "PO" && (
                  <>
                    <p className="font-bold text-blue-700">[SURAT PESANAN / PURCHASE ORDER]</p>
                    <p>• No. Kontrak: {selectedPOId ? purchaseOrders.find((p) => p.id === selectedPOId)?.poNumber : "PO-2025-001"}</p>
                    <p>• Pihak 1: Divisi Procurement</p>
                    <p>• Pihak 2: Rekanan Penyedia</p>
                    <p>• Tabel Rincian Spesifikasi & Harga</p>
                    <p>• Syarat & Ketentuan Pembayaran</p>
                    <p>• Lembar Tanda Tangan Sah Direksi</p>
                  </>
                )}

                {docType === "BAST" && (
                  <>
                    <p className="font-bold text-emerald-700">[BERITA ACARA SERAH TERIMA / BAST]</p>
                    <p>• No. BAST: BAST-2025-001</p>
                    <p>• Pemeriksaan Fisik & Quality Control (QC)</p>
                    <p>• Catatan Pengujian Fungsional</p>
                    <p>• Rekomendasi Otorisasi Pembayaran</p>
                    <p>• Tanda Tangan Petugas QA & Vendor</p>
                  </>
                )}

                {docType === "VENDOR" && (
                  <>
                    <p className="font-bold text-indigo-700">[DOSSIER EVALUASI & UJI TUNTAS REKANAN]</p>
                    <p>• Profil & NPWP/NIB Valid DJP</p>
                    <p>• KPI Scorecard: On-Time & Rating</p>
                    <p>• Rekening Bank & Sertifikasi</p>
                    <p>• Rekomendasi Tim Kepatuhan</p>
                  </>
                )}

                {docType === "RFQ" && (
                  <>
                    <p className="font-bold text-purple-700">[UNDANGAN TENDER & RFQ]</p>
                    <p>• No. RFQ Tender Terbuka</p>
                    <p>• Kerangka Acuan Kerja (KAK) & Spesifikasi</p>
                    <p>• Batas Waktu Submit Penawaran</p>
                    <p>• Syarat Dokumen & Garansi</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Format kompatibel 100% dengan Google Docs API v1</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BATCH & HISTORY */}
      {activeSubTab === "batch" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Batch Print Semua Kontrak Purchase Order
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Cetak dokumen Google Docs secara serentak untuk seluruh {purchaseOrders.length} kontrak
                PO aktif dalam sistem dengan satu kali klik.
              </p>
            </div>

            <button
              onClick={handleBatchMergePOs}
              disabled={isProcessing || purchaseOrders.length === 0}
              className="flex items-center gap-2 py-3 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Jalankan Batch PO ({purchaseOrders.length} File)</span>
            </button>
          </div>

          {/* Unified Recent Docs and Sheets */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-4">
              Riwayat Berkas Google Drive yang Dibuat Sesi Ini
            </h4>

            {recentSheets.length === 0 && recentDocs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600">Belum ada berkas dibuat sesi ini</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan tab Google Sheets atau Docs di atas untuk memulai.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSheets.map((s, idx) => (
                  <div
                    key={`s-${idx}`}
                    className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.title}</p>
                        <p className="text-xs text-slate-500">Google Sheets • {s.rowsCount} Baris</p>
                      </div>
                    </div>
                    <a
                      href={s.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <span>Buka</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}

                {recentDocs.map((d, idx) => (
                  <div
                    key={`d-${idx}`}
                    className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{d.title}</p>
                        <p className="text-xs text-slate-500">Google Docs • Surat Resmi</p>
                      </div>
                    </div>
                    <a
                      href={d.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <span>Buka</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
