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
  X,
  LogOut,
  ChevronRight,
  DownloadCloud,
  FileSignature,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
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

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  invoices: Invoice[];
  rfqs: RFQ[];
  initialTab?: "sheets" | "docs" | "batch";
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  vendors = [],
  requisitions = [],
  purchaseOrders = [],
  goodsReceipts = [],
  invoices = [],
  rfqs = [],
  initialTab = "sheets",
}) => {
  const [activeTab, setActiveTab] = useState<"sheets" | "docs" | "batch">(initialTab);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Results History
  const [recentSheets, setRecentSheets] = useState<GoogleSpreadsheetResult[]>([]);
  const [recentDocs, setRecentDocs] = useState<GoogleDocResult[]>([]);

  // Docs Mail Merge Form State
  const [docType, setDocType] = useState<"PO" | "BAST" | "VENDOR" | "RFQ">("PO");
  const [selectedPOId, setSelectedPOId] = useState<string>(purchaseOrders?.[0]?.id || "");
  const [selectedBASTId, setSelectedBASTId] = useState<string>(goodsReceipts?.[0]?.id || "");
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors?.[0]?.id || "");
  const [selectedRFQId, setSelectedRFQId] = useState<string>(rfqs?.[0]?.id || "");
  const [customNotes, setCustomNotes] = useState<string>("");

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        setStatusMessage({
          type: "success",
          text: `Berhasil terhubung ke akun Google Workspace: ${res.user.email}`,
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
        text: "Berhasil keluar dari akun Google Workspace.",
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Google Sheets Sync Handlers
  const handleSyncMaster = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Membuat Master Workbook Google Sheets..." });
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
        text: `Berhasil mengekspor 5 modul data ke Google Sheets! (${result.rowsCount} total baris)`,
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
    setStatusMessage({ type: "info", text: "Mengekspor data rekanan ke Google Sheets..." });
    try {
      const result = await syncVendorsToGoogleSheet(vendors);
      setRecentSheets((prev) => [result, ...prev]);
      setStatusMessage({
        type: "success",
        text: `Berhasil mengekspor ${vendors.length} data vendor ke Google Sheets!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal mengekspor rekanan ke Google Sheets.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncPOs = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Mengekspor data PO ke Google Sheets..." });
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
        text: err.message || "Gagal mengekspor PO ke Google Sheets.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Google Docs Mail Merge Handler
  const handleGenerateDoc = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Menjalankan Mail Merge ke Google Docs..." });
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
        if (!vendor) throw new Error("Silakan pilih Vendor terlebih dahulu.");
        docResult = await mailMergeVendorDossierDoc(vendor);
      } else if (docType === "RFQ") {
        const rfq = rfqs.find((r) => r.id === selectedRFQId) || rfqs[0];
        if (!rfq) throw new Error("Silakan pilih RFQ Tender terlebih dahulu.");
        docResult = await mailMergeRFQDoc(rfq);
      }

      if (docResult) {
        setRecentDocs((prev) => [docResult!, ...prev]);
        setStatusMessage({
          type: "success",
          text: `Mail Merge berhasil! Dokumen Google Docs "${docResult.title}" siap dibuka.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal melakukan Mail Merge ke Google Docs.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Mail Merge for all POs
  const handleBatchMergePOs = async () => {
    if (!purchaseOrders.length) return;
    setIsProcessing(true);
    setStatusMessage({
      type: "info",
      text: `Memulai batch mail merge untuk ${purchaseOrders.length} kontrak PO...`,
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
        text: `Berhasil mencetak ${results.length} kontrak PO ke Google Docs secara otomatis!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Gagal melakukan batch mail merge.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-xl border border-white/20">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="h-6 w-6 text-emerald-300" />
                <span className="text-white/60 text-lg">+</span>
                <FileText className="h-6 w-6 text-blue-300" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Google Workspace Integration Hub
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                Sinkronisasi data ke Google Sheets & Mail Merge template resmi ke Google Docs
              </p>
            </div>
          </div>

          {/* Account Status Strip */}
          <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  currentUser ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-white/90 font-medium">
                {currentUser ? (
                  <span>
                    Terhubung sebagai: <strong>{currentUser.email}</strong>
                  </span>
                ) : (
                  <span>Status: Belum login ke Google</span>
                )}
              </span>
            </div>

            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar Akun</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
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
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab("sheets")}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 cursor-pointer transition-all ${
              activeTab === "sheets"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Sinkronisasi Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 cursor-pointer transition-all ${
              activeTab === "docs"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Mail Merge ke Google Docs</span>
          </button>

          <button
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 cursor-pointer transition-all ${
              activeTab === "batch"
                ? "border-purple-600 text-purple-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Batch Automation & History</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between text-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              {statusMessage.type === "error" && (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              {statusMessage.type === "info" && (
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 max-h-[62vh] overflow-y-auto">
          {/* TAB 1: GOOGLE SHEETS SYNC */}
          {activeTab === "sheets" && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Sinkronisasi Real-Time ke Google Sheets
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Buat spreadsheet resmi Google Sheets yang otomatis terisi dengan seluruh struktur
                    data pengadaan (Rekanan, PR, PO, BAST, dan Faktur) dengan baris header yang
                    terformat dan siap dibagi ke tim auditor.
                  </p>
                </div>
              </div>

              {/* Sync Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Master Workbook Sync */}
                <div className="border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                        Master Workbook (5 Tabs)
                      </span>
                      <Layers className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Sinkronisasi Semua Modul Pengadaan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Membuat 1 file Google Spreadsheet lengkap dengan 5 sheet terpisah: Rekanan
                      Vendor, PR, PO, BAST Logistik, dan Faktur 3-Way Match.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncMaster}
                    disabled={isProcessing}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <DownloadCloud className="h-3.5 w-3.5" />
                    )}
                    <span>Sinkronkan Master Workbook</span>
                  </button>
                </div>

                {/* Vendors Sheet Sync */}
                <div className="border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        Vendor Management
                      </span>
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Ekspor Direktori Rekanan ({vendors.length} Vendor)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Ekspor daftar rekanan, NPWP, NIB, status legalitas DJP/OSS, rekening bank,
                      rating performa, dan total transaksi tahunan ke Google Sheets.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncVendors}
                    disabled={isProcessing}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <DownloadCloud className="h-3.5 w-3.5" />
                    )}
                    <span>Ekspor Direktori Rekanan</span>
                  </button>
                </div>

                {/* POs Sheet Sync */}
                <div className="border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                        Purchase Orders
                      </span>
                      <ShoppingBag className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Ekspor Daftar Kontrak PO ({purchaseOrders.length} PO)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Ekspor nomor PO, rekanan terpilih, total nominal kontrak, jadwal pengiriman,
                      syarat pembayaran, dan rincian item pesanan.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncPOs}
                    disabled={isProcessing}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <DownloadCloud className="h-3.5 w-3.5" />
                    )}
                    <span>Ekspor Daftar PO</span>
                  </button>
                </div>
              </div>

              {/* Recent Spreadsheets Output */}
              {recentSheets.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Spreadsheet yang Baru Dibuat
                  </h4>
                  <div className="space-y-2">
                    {recentSheets.map((sh, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{sh.title}</p>
                            <p className="text-xs text-slate-500">
                              {sh.rowsCount} Baris diekspor • ID: {sh.spreadsheetId.slice(0, 16)}...
                            </p>
                          </div>
                        </div>
                        <a
                          href={sh.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <span>Buka di Google Sheets</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DOCS MAIL MERGE */}
          {activeTab === "docs" && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <FileSignature className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-950">
                    Mail Merge Dokumen Resmi ke Google Docs
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                    Gabungkan data pengadaan ke dalam template resmi terformat lengkap dengan kop surat,
                    tabel spesifikasi, syarat kontrak, dan lembar pengesahan tanda tangan.
                  </p>
                </div>
              </div>

              {/* Template Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Format Template Dokumen:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDocType("PO")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      docType === "PO"
                        ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4 text-blue-600 mb-1.5" />
                    <p className="font-bold text-xs">Surat Pesanan (PO)</p>
                    <p className="text-[10px] text-slate-500">Kontrak Pengadaan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocType("BAST")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      docType === "BAST"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <FileCheck className="h-4 w-4 text-emerald-600 mb-1.5" />
                    <p className="font-bold text-xs">Berita Acara (BAST)</p>
                    <p className="text-[10px] text-slate-500">Serah Terima & QC</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocType("VENDOR")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      docType === "VENDOR"
                        ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-indigo-600 mb-1.5" />
                    <p className="font-bold text-xs">Berkas Uji Tuntas</p>
                    <p className="text-[10px] text-slate-500">Vendor Scorecard</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocType("RFQ")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      docType === "RFQ"
                        ? "border-purple-600 bg-purple-50/80 text-purple-900 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <FileCode className="h-4 w-4 text-purple-600 mb-1.5" />
                    <p className="font-bold text-xs">Undangan RFQ</p>
                    <p className="text-[10px] text-slate-500">Lelang / Tender</p>
                  </button>
                </div>
              </div>

              {/* Record Selector Based on Template */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                {docType === "PO" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pilih Kontrak Purchase Order:
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pilih Dokumen BAST Serah Terima:
                    </label>
                    <select
                      value={selectedBASTId}
                      onChange={(e) => setSelectedBASTId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {goodsReceipts.map((grn) => (
                        <option key={grn.id} value={grn.id}>
                          {grn.grnNumber} — PO: {grn.poNumber} ({grn.vendorName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {docType === "VENDOR" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pilih Rekanan Rekanan Vendor:
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pilih Paket Tender RFQ:
                    </label>
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
                    placeholder="Contoh: Lampiran spesifikasi garansi resmi pabrikan 2 tahun..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
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
                <span>Jalankan Mail Merge & Buat Dokumen Google Docs</span>
              </button>

              {/* Recent Docs Output */}
              {recentDocs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Dokumen Google Docs yang Dibuat
                  </h4>
                  <div className="space-y-2">
                    {recentDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{doc.title}</p>
                            <p className="text-xs text-slate-500">
                              ID Dokumen: {doc.documentId.slice(0, 16)}...
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <span>Buka di Google Docs</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BATCH AUTOMATION */}
          {activeTab === "batch" && (
            <div className="space-y-6">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-purple-950">
                    Otomasi Batch & Riwayat Sinkronisasi
                  </h4>
                  <p className="text-xs text-purple-800 mt-0.5 leading-relaxed">
                    Jalankan pencetakan dokumen kontrak massal untuk seluruh rekanan dan arsipkan
                    tautan Google Drive yang telah dibuat.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Batch Print PO: Cetak Kontrak Semua Purchase Order Aktif
                  </h4>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                    {purchaseOrders.length} Kontrak PO
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Sistem akan membuat file Google Docs terpisah untuk setiap Purchase Order dalam sistem
                  dengan format legal lengkap dan nomor kontrak masing-masing.
                </p>

                <button
                  onClick={handleBatchMergePOs}
                  disabled={isProcessing || purchaseOrders.length === 0}
                  className="flex items-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Jalankan Batch Mail Merge ({purchaseOrders.length} Dokumen PO)</span>
                </button>
              </div>

              {/* Combined History */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Riwayat Berkas Google Workspace Sesi Ini
                </h4>

                {recentSheets.length === 0 && recentDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-xl">
                    Belum ada berkas yang dibuat pada sesi ini. Pilih tab Google Sheets atau Google Docs
                    untuk mulai sinkronisasi.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentSheets.map((s, idx) => (
                      <div
                        key={`sh-${idx}`}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-slate-800">{s.title}</span>
                          <span className="text-slate-400">(Sheets)</span>
                        </div>
                        <a
                          href={s.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                        >
                          Buka <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}

                    {recentDocs.map((d, idx) => (
                      <div
                        key={`doc-${idx}`}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-slate-800">{d.title}</span>
                          <span className="text-slate-400">(Docs)</span>
                        </div>
                        <a
                          href={d.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                        >
                          Buka <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Koneksi aman melalui Google Workspace API Resmi (OAuth 2.0)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
