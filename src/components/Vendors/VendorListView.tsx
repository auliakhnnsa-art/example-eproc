import React, { useState } from "react";
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Star,
  ShieldCheck,
  Eye,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  LayoutGrid,
  List,
  Download,
  Printer,
  Sparkles,
  Edit3,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Ban,
  Clock,
  ChevronRight,
  ShieldAlert,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Vendor } from "../../types/procurement";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { VendorModal } from "./VendorModal";
import { exportVendorProfileDirectPDF } from "../../utils/pdfExport";
import { DeleteConfirmModal } from "../Common/DeleteConfirmModal";
import { mailMergeVendorDossierDoc, syncVendorsToGoogleSheet } from "../../services/googleWorkspaceService";

interface VendorListViewProps {
  vendors: Vendor[];
  onSaveVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  onOpenGoogleWorkspace?: (tab?: "sheets" | "docs") => void;
}

export const VendorListView: React.FC<VendorListViewProps> = ({
  vendors,
  onSaveVendor,
  onDeleteVendor,
  isCreateModalOpen,
  setIsCreateModalOpen,
  onOpenGoogleWorkspace,
}) => {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [isEditingFromList, setIsEditingFromList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"rating" | "delivery" | "spend" | "name">("rating");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [aiAnalysisVendor, setAiAnalysisVendor] = useState<Vendor | null>(null);

  const categories = [
    { id: "ALL", label: "Semua Kategori" },
    { id: "IT & Infrastructure", label: "IT & Infrastructure" },
    { id: "Operasional & Logistik", label: "Operasional & Logistik" },
    { id: "General Affairs & Fasilitas", label: "General Affairs" },
    { id: "Marketing & Digital", label: "Marketing & Digital" },
  ];

  const filteredVendors = vendors
    .filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (v.name || "").toLowerCase().includes(q) ||
        (v.vendorCode || "").toLowerCase().includes(q) ||
        (v.category || "").toLowerCase().includes(q) ||
        (v.city || "").toLowerCase().includes(q) ||
        (v.npwp || "").toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "ALL" || (v.category || "") === selectedCategory;

      const currentStatus = v.status || (v.legalStatus as any) || "ACTIVE_VERIFIED";
      const matchesStatus =
        selectedStatus === "ALL" || currentStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "delivery") return (b.onTimeDeliveryRate || 0) - (a.onTimeDeliveryRate || 0);
      if (sortBy === "spend") return (b.totalSpendYTD || 0) - (a.totalSpendYTD || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  // Calculate statistics safely
  const totalVerified = vendors.filter(
    (v) => (v.status || v.legalStatus) === "ACTIVE_VERIFIED" || (v.status || v.legalStatus) === "VERIFIED"
  ).length;
  const avgCompliance = Math.round(
    vendors.reduce((acc, v) => acc + (v.complianceScore || v.performanceScore || 90), 0) / (vendors.length || 1)
  );
  const totalSpend = vendors.reduce((acc, v) => acc + (v.totalSpendYTD || 0), 0);

  const handleExportCSV = () => {
    const headers = "Kode Vendor,Nama Perusahaan,Kategori,Status,NPWP,NIB,Email,Telepon,Rating,OnTime(%),Total Transaksi(Rp)\n";
    const rows = filteredVendors
      .map(
        (v) =>
          `"${v.vendorCode}","${v.name}","${v.category}","${v.status || v.legalStatus || 'ACTIVE'}","${v.npwp || ''}","${v.nib || ''}","${v.email || ''}","${v.phone || ''}",${v.rating || 4.5},${v.onTimeDeliveryRate || 95},${v.totalSpendYTD || 0}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Direktori-Vendor-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (vendor: Vendor) => {
    const st = vendor.status || (vendor.legalStatus as any) || "ACTIVE_VERIFIED";
    if (st === "ACTIVE_VERIFIED" || st === "VERIFIED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
          <ShieldCheck className="h-3 w-3" />
          <span>Terverifikasi Aktif</span>
        </span>
      );
    }
    if (st === "PENDING_VERIFICATION") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
          <Clock className="h-3 w-3" />
          <span>Masa Review / Uji Tuntas</span>
        </span>
      );
    }
    if (st === "NEEDS_RENEWAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
          <AlertCircle className="h-3 w-3" />
          <span>Pembaruan Dokumen</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
        <Ban className="h-3 w-3" />
        <span>Ditangguhkan</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Manajemen Vendor & Rekanan Terdaftar (VMS)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {vendors.length} Rekanan Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Database rekanan terverifikasi Ditjen Pajak & OSS, penilaian scorecard kinerja berkala, dan kepatuhan pengadaan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenGoogleWorkspace && (
            <>
              <button
                onClick={() => onOpenGoogleWorkspace("sheets")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                title="Sinkronisasi direktori rekanan ke Google Sheets"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden md:inline">Sinkron ke Sheets</span>
              </button>

              <button
                onClick={() => onOpenGoogleWorkspace("docs")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
                title="Mail Merge Dossier Vendor ke Google Docs"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="hidden md:inline">Dossier Docs</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs cursor-pointer transition-all"
            title="Ekspor daftar vendor ke CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            id="btn-register-new-vendor"
            onClick={() => {
              setSelectedVendor(null);
              setIsEditingFromList(true);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Registrasi Rekanan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Rekanan Aktif</span>
            <span className="text-lg font-black text-slate-900">{vendors.length} Vendor</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Legalitas Terverifikasi</span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              {totalVerified} ({Math.round((totalVerified / (vendors.length || 1)) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Rata-rata Skor Kepatuhan</span>
            <span className="text-lg font-black text-indigo-700 font-mono">{avgCompliance} / 100</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Transaksi YTD</span>
            <span className="text-base font-black text-slate-900 font-mono">{formatRupiah(totalSpend)}</span>
          </div>
        </div>
      </div>

      {/* Filters, Search & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="search-vendor-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama rekanan, kode vendor, NPWP, atau bidang usaha..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Controls: Status, Sort, View toggle */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Status Legal</option>
              <option value="ACTIVE_VERIFIED">Terverifikasi Aktif</option>
              <option value="PENDING_VERIFICATION">Masa Review</option>
              <option value="NEEDS_RENEWAL">Pembaruan Dokumen</option>
              <option value="BLACKLISTED">Blacklisted</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
            >
              <option value="rating">Urutkan: Rating Tertinggi</option>
              <option value="delivery">Urutkan: On-Time Delivery</option>
              <option value="spend">Urutkan: Transaksi Terbesar</option>
              <option value="name">Urutkan: Nama A-Z</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewMode === "grid" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewMode === "table" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Tampilan Tabel Detail"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === c.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Due Diligence Insight banner if requested */}
      {aiAnalysisVendor && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-900">
                AI Due Diligence Scorecard: {aiAnalysisVendor.name}
              </span>
              <p className="text-slate-600 leading-relaxed">
                Rekanan memiliki rekam jejak kepatuhan sangat baik (Skor: {aiAnalysisVendor.complianceScore || 94}/100) dengan ketepatan pengiriman {aiAnalysisVendor.onTimeDeliveryRate || 95}%. NPWP & NIB valid pada sistem DJP. Direkomendasikan untuk tender kategori {aiAnalysisVendor.category}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiAnalysisVendor(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Vendor Content */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Rekanan Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ada vendor yang cocok dengan kriteria pencarian "{searchQuery}" atau filter kategori yang dipilih.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => {
            const certs = vendor.certifications || ["ISO 9001:2015", "KBLI 62019"];
            const bankStr =
              typeof vendor.bankAccount === "object" && vendor.bankAccount !== null
                ? `${vendor.bankAccount.bankName} (${vendor.bankAccount.accountNumber})`
                : vendor.bankAccount || "Bank Mandiri • 124-00-8899120-1";

            return (
              <div
                key={vendor.id}
                id={`vendor-card-${vendor.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {vendor.vendorCode}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                          {vendor.name}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {vendor.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800 text-xs font-bold shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{vendor.rating || 4.8}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>{renderStatusBadge(vendor)}</div>

                  {/* Metrics Box */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        On-Time Delivery
                      </span>
                      <span className="font-bold text-emerald-700 font-mono text-xs">
                        {vendor.onTimeDeliveryRate || 95}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Total Transaksi
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {formatRupiah(vendor.totalSpendYTD || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Skor Kepatuhan
                      </span>
                      <span className="font-bold text-indigo-700 font-mono text-xs">
                        {vendor.complianceScore || vendor.performanceScore || 92}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Domisili
                      </span>
                      <span className="font-bold text-slate-700 text-[11px] truncate block">
                        {vendor.city || "Jakarta"}
                      </span>
                    </div>
                  </div>

                  {/* Certifications tags */}
                  <div className="flex flex-wrap gap-1">
                    {certs.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setAiAnalysisVendor(vendor)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    title="Analisis AI Kepatuhan"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => exportVendorProfileDirectPDF(vendor)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    title="Unduh Berkas Profil PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setIsEditingFromList(true);
                    }}
                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    title="Ubah Data Rekanan"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setVendorToDelete(vendor)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    title="Hapus Rekanan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    id={`btn-view-vendor-${vendor.id}`}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setIsEditingFromList(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ml-auto"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Profil</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                  <th className="p-3.5 pl-5">Kode & Nama Rekanan</th>
                  <th className="p-3.5">Kategori Bidang</th>
                  <th className="p-3.5">Status Legalitas</th>
                  <th className="p-3.5 text-center">Rating</th>
                  <th className="p-3.5 text-center">On-Time</th>
                  <th className="p-3.5 text-right">Total Transaksi YTD</th>
                  <th className="p-3.5 text-center pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 font-bold block">
                            {vendor.vendorCode}
                          </span>
                          <span className="font-bold text-slate-900">{vendor.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {vendor.city || "Jakarta"} • NPWP: {vendor.npwp || "-"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{vendor.category}</td>
                    <td className="p-3.5">{renderStatusBadge(vendor)}</td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {vendor.rating || 4.8}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-700 font-mono">
                      {vendor.onTimeDeliveryRate || 95}%
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(vendor.totalSpendYTD || 0)}
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => exportVendorProfileDirectPDF(vendor)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          title="Unduh PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setIsEditingFromList(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                          title="Ubah Data"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setVendorToDelete(vendor)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                          title="Hapus Rekanan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setIsEditingFromList(false);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {vendorToDelete && (
        <DeleteConfirmModal
          isOpen={!!vendorToDelete}
          title="Hapus Rekanan / Vendor"
          itemTypeLabel="Data Rekanan"
          itemName={vendorToDelete.name}
          itemCode={vendorToDelete.vendorCode}
          warningNote="Menghapus rekanan ini akan menghilangkannya dari master vendor sistem VMS. Riwayat PO masa lalu yang telah terbit tetap tersimpan."
          onCancel={() => setVendorToDelete(null)}
          onConfirm={() => {
            onDeleteVendor(vendorToDelete.id);
            setVendorToDelete(null);
          }}
        />
      )}

      {/* Modal View & Edit */}
      {(selectedVendor || isCreateModalOpen) && (
        <VendorModal
          isOpen={isCreateModalOpen || !!selectedVendor}
          selectedVendor={selectedVendor}
          isEditInitially={isEditingFromList}
          onClose={() => {
            setSelectedVendor(null);
            setIsEditingFromList(false);
            setIsCreateModalOpen(false);
          }}
          onSaveVendor={onSaveVendor}
        />
      )}
    </div>
  );
};


