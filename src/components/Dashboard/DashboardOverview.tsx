import React, { useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  FileCheck2,
  Gavel,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Sparkles,
  PlusCircle,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  Inbox,
  BarChart3,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  PurchaseRequisition,
  RFQ,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  Vendor,
} from "../../types/procurement";
import { formatRupiah, formatShortRupiah, formatDate } from "../../utils/formatters";
import { NavTab } from "../Sidebar";

interface DashboardOverviewProps {
  requisitions: PurchaseRequisition[];
  rfqs: RFQ[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts?: GoodsReceipt[];
  invoices: Invoice[];
  vendors: Vendor[];
  onNavigateTab: (tab: NavTab) => void;
  onCreatePR: () => void;
  onOpenAICopilot: (prompt?: string) => void;
  onLoadSampleData?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  requisitions,
  rfqs,
  purchaseOrders,
  goodsReceipts = [],
  invoices,
  vendors,
  onNavigateTab,
  onCreatePR,
  onOpenAICopilot,
  onLoadSampleData,
}) => {
  // Check if any data exists in the entire system
  const totalDataCount =
    requisitions.length +
    rfqs.length +
    purchaseOrders.length +
    goodsReceipts.length +
    invoices.length +
    vendors.length;
  const hasAnyData = totalDataCount > 0;

  // Active tenders currently running
  const activeTenders = rfqs.filter(
    (r) => r.status === "PUBLISHED" || r.status === "EVALUATION"
  );

  // Pending PRs & Approvals
  const pendingPRs = requisitions.filter(
    (pr) => pr.status === "PENDING_DEPT_HEAD" || pr.status === "PENDING_PROCUREMENT"
  );
  const pendingTenders = rfqs.filter((r) => r.status === "EVALUATION");
  const pendingApprovalsCount = pendingPRs.length + pendingTenders.length;

  // Cost calculations strictly based on real Purchase Orders and RFQ budgets
  const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  // Calculate savings by comparing awarded POs with their corresponding RFQ HPS budgets
  const totalHpsOfAwarded = purchaseOrders.reduce((sum, po) => {
    const matchedRfq = rfqs.find(
      (r) => r.id === po.rfqId || r.rfqNumber === po.rfqNumber
    );
    return sum + (matchedRfq ? matchedRfq.hpsBudget : po.totalAmount);
  }, 0);

  const costSavings = Math.max(0, totalHpsOfAwarded - totalSpend);
  const costSavingsPct =
    totalHpsOfAwarded > 0
      ? ((costSavings / totalHpsOfAwarded) * 100).toFixed(1)
      : "0";

  // Verified vendors
  const verifiedVendors = vendors.filter((v) => v.legalStatus === "VERIFIED");

  // Dynamic monthly chart calculated strictly from user's POs and RFQs
  const monthlyChartData = useMemo(() => {
    if (purchaseOrders.length === 0 && rfqs.length === 0) {
      return [];
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    const map: Record<string, { month: string; sortKey: string; actualSpend: number; budget: number }> = {};

    // Aggregate RFQ budgets
    rfqs.forEach((r) => {
      const dateStr = r.submissionDeadline || r.createdAt || "";
      if (!dateStr) return;
      const parts = dateStr.split("-");
      if (parts.length >= 2) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const monthLabel = monthNames[monthNum - 1] || "Bulan";
        const key = `${year}-${String(monthNum).padStart(2, "0")}`;

        if (!map[key]) {
          map[key] = {
            month: `${monthLabel} ${year.slice(2)}`,
            sortKey: key,
            actualSpend: 0,
            budget: 0,
          };
        }
        // In millions (Juta Rp) for chart clarity
        map[key].budget += Math.round(r.hpsBudget / 1000000);
      }
    });

    // Aggregate Purchase Orders spend
    purchaseOrders.forEach((po) => {
      const dateStr = po.issueDate || "";
      if (!dateStr) return;
      const parts = dateStr.split("-");
      if (parts.length >= 2) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const monthLabel = monthNames[monthNum - 1] || "Bulan";
        const key = `${year}-${String(monthNum).padStart(2, "0")}`;

        if (!map[key]) {
          map[key] = {
            month: `${monthLabel} ${year.slice(2)}`,
            sortKey: key,
            actualSpend: 0,
            budget: 0,
          };
        }
        // In millions (Juta Rp)
        map[key].actualSpend += Math.round(po.totalAmount / 1000000);
      }
    });

    return Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [purchaseOrders, rfqs]);

  // Dynamic Recent Activities derived strictly from inputted documents
  const dynamicActivities = useMemo(() => {
    const items: {
      id: string;
      title: string;
      detail: string;
      date: string;
      color: string;
    }[] = [];

    // Requisitions
    requisitions.forEach((pr) => {
      items.push({
        id: `pr-${pr.id}`,
        title: `PR #${pr.prNumber} diajukan`,
        detail: `${pr.title} (${pr.department})`,
        date: pr.requestDate || "",
        color: "bg-blue-500",
      });
    });

    // RFQs
    rfqs.forEach((rfq) => {
      items.push({
        id: `rfq-${rfq.id}`,
        title: `Tender #${rfq.rfqNumber} (${rfq.status})`,
        detail: `${rfq.title} - HPS ${formatShortRupiah(rfq.hpsBudget)}`,
        date: rfq.submissionDeadline || rfq.createdAt || "",
        color: "bg-amber-500",
      });
    });

    // Purchase Orders
    purchaseOrders.forEach((po) => {
      items.push({
        id: `po-${po.id}`,
        title: `PO #${po.poNumber} diterbitkan`,
        detail: `Vendor: ${po.vendorName} (${formatShortRupiah(po.totalAmount)})`,
        date: po.issueDate || "",
        color: "bg-indigo-500",
      });
    });

    // Goods Receipts (BAST)
    goodsReceipts.forEach((grn) => {
      items.push({
        id: `grn-${grn.id}`,
        title: `BAST #${grn.grnNumber} diterima`,
        detail: `${grn.vendorName} (${grn.items.length} item)`,
        date: grn.receiptDate || "",
        color: "bg-emerald-500",
      });
    });

    // Invoices
    invoices.forEach((inv) => {
      items.push({
        id: `inv-${inv.id}`,
        title: `Faktur #${inv.invoiceNumber} (${inv.status})`,
        detail: `${inv.vendorName} (${formatShortRupiah(inv.totalAmount)})`,
        date: inv.issueDate || "",
        color: "bg-purple-500",
      });
    });

    // Sort newest first
    items.sort((a, b) => b.date.localeCompare(a.date));
    return items.slice(0, 4);
  }, [requisitions, rfqs, purchaseOrders, goodsReceipts, invoices]);

  // Dynamic Callout Task derived strictly from actual pending records
  const dynamicTask = useMemo(() => {
    if (pendingPRs.length > 0) {
      return {
        title: "Persetujuan Purchase Requisition",
        detail: `Terdapat ${pendingPRs.length} PR yang menunggu persetujuan anggaran/pengadaan.`,
        targetTab: "pr" as NavTab,
      };
    }
    const evalRfq = rfqs.find((r) => r.status === "EVALUATION");
    if (evalRfq) {
      return {
        title: "Evaluasi Penawaran Tender",
        detail: `Tender ${evalRfq.rfqNumber} (${evalRfq.title}) siap dievaluasi untuk penetapan pemenang.`,
        targetTab: "rfq" as NavTab,
      };
    }
    const pendingAuditInv = invoices.find((i) => i.status === "PENDING_AUDIT");
    if (pendingAuditInv) {
      return {
        title: "Audit 3-Way Match",
        detail: `Faktur ${pendingAuditInv.invoiceNumber} menunggu rekonsiliasi PO dan BAST.`,
        targetTab: "matching" as NavTab,
      };
    }
    const issuedPO = purchaseOrders.find((p) => p.status === "ISSUED");
    if (issuedPO) {
      return {
        title: "Monitoring Pengiriman PO",
        detail: `PO ${issuedPO.poNumber} telah diterbitkan dan menunggu proses pengiriman rekanan.`,
        targetTab: "po" as NavTab,
      };
    }
    return null;
  }, [pendingPRs, rfqs, invoices, purchaseOrders]);

  // When NO data has been inputted at all in the system, do not display any charts, tables, or dummy metrics
  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Ringkasan Procurement
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Sistem Pengadaan PT SAS Aero Sishan • Belum ada data transaksi yang diinput
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-dash-create-pr-empty"
              onClick={onCreatePR}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Buat PR Baru</span>
            </button>
            {onLoadSampleData && (
              <button
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Muat Contoh Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Zero-Data Empty State View */}
        <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 font-display">
            Belum Ada Data Pengadaan Terinput
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mt-2 mb-8 leading-relaxed">
            Tampilan dashboard dirancang otomatis mengikuti transaksi yang Anda input. Karena belum ada Purchase Requisition (PR), RFQ / Tender, Kontrak PO, BAST, Faktur, atau Vendor yang diinput, dashboard tidak menampilkan metrik atau grafik apapun.
          </p>

          {/* Quick Input Shortcut Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
            <div
              onClick={onCreatePR}
              className="p-5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                1. Input Purchase Requisition (PR)
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Catat permohonan kebutuhan barang/jasa dari unit operasional SAS.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab("rfq")}
              className="p-5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 cursor-pointer transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Gavel className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                2. Buat Paket Tender / RFQ
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Buka paket pengadaan dan undang penawaran harga rekanan.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab("vendors")}
              className="p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                3. Daftarkan Rekanan Vendor
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Kelola daftar mitra dan rekanan penyedia terverifikasi.
              </p>
            </div>
          </div>

          {onLoadSampleData && (
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <span>Ingin melihat visualisasi lengkap dengan data simulasi?</span>
              <button
                onClick={onLoadSampleData}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Muat Contoh Data Pengadaan &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ringkasan Procurement
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {hasAnyData
              ? `Update terakhir: ${new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
              : "Belum ada transaksi terinput"}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="btn-dash-create-pr"
            onClick={onCreatePR}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat PR Baru</span>
          </button>
          <button
            id="btn-dash-ai-audit"
            onClick={() =>
              onOpenAICopilot(
                hasAnyData
                  ? "Analisis efisiensi pengadaan, potensi cost savings, dan mitigasi risiko lelang berdasarkan data pengadaan saat ini."
                  : "Berikan panduan dan rekomendasi persiapan pengadaan barang/jasa perusahaan."
              )
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Analisis AI</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid - 100% Derived from Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Tender Aktif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="text-xs text-slate-500 font-bold uppercase mb-2">
            Tender Aktif
          </div>
          <div className="text-3xl font-bold mb-1 text-slate-900">
            {activeTenders.length}
          </div>
          <div className="text-xs font-semibold">
            {activeTenders.length > 0 ? (
              <span className="text-green-600">{activeTenders.length} Paket dalam proses</span>
            ) : (
              <span className="text-slate-400">Tidak ada tender aktif</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Penghematan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="text-xs text-slate-500 font-bold uppercase mb-2">
            Total Penghematan
          </div>
          <div className="text-3xl font-bold mb-1 text-blue-600">
            {totalSpend > 0 || costSavings > 0 ? formatShortRupiah(costSavings) : "Rp 0"}
          </div>
          <div className="text-xs font-semibold">
            {totalSpend > 0 ? (
              <span className="text-green-600">{costSavingsPct}% Efisiensi Belanja</span>
            ) : (
              <span className="text-slate-400">Belum ada realisasi belanja</span>
            )}
          </div>
        </div>

        {/* Card 3: Vendor Terverifikasi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="text-xs text-slate-500 font-bold uppercase mb-2">
            Vendor Terverifikasi
          </div>
          <div className="text-3xl font-bold mb-1 text-slate-900">
            {verifiedVendors.length}
          </div>
          <div className="text-xs font-semibold">
            {vendors.length > 0 ? (
              <span className="text-slate-500">{vendors.length} Total Rekanan Terdaftar</span>
            ) : (
              <span className="text-slate-400">Belum ada rekanan terinput</span>
            )}
          </div>
        </div>

        {/* Card 4: Persetujuan Tertunda */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="text-xs text-slate-500 font-bold uppercase mb-2">
            Persetujuan Tertunda
          </div>
          <div className={`text-3xl font-bold mb-1 ${pendingApprovalsCount > 0 ? "text-orange-500" : "text-slate-900"}`}>
            {pendingApprovalsCount}
          </div>
          <div className="text-xs font-semibold">
            {pendingApprovalsCount > 0 ? (
              <span
                onClick={() => onNavigateTab("pr")}
                className="text-orange-600 underline cursor-pointer hover:text-orange-700"
              >
                Lihat Antrean ({pendingApprovalsCount})
              </span>
            ) : (
              <span className="text-slate-400">Tidak ada antrean tertunda</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Table (2 cols) & Right Activity (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Daftar Tender Berjalan Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Daftar Tender Berjalan
              </h2>
              <p className="text-[11px] text-slate-400">
                {rfqs.length > 0
                  ? `${rfqs.length} Dokumen RFQ / Pengadaan Terdaftar`
                  : "Belum ada tender yang terinput"}
              </p>
            </div>
            {rfqs.length > 0 && (
              <button
                onClick={() => onNavigateTab("rfq")}
                className="text-blue-600 text-xs font-bold hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            )}
          </div>

          {rfqs.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center flex-1">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-700">
                Belum Ada Data Tender / RFQ
              </h3>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1 mb-4">
                Data tender pengadaan yang Anda terbitkan akan ditampilkan dalam daftar ini secara otomatis.
              </p>
              <button
                onClick={onCreatePR}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Mulai Buat PR & Tender</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Nama Tender</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">HPS (Anggaran)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Batas Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {rfqs.map((rfq) => {
                    let statusBadge = (
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold block text-center">
                        Terbit
                      </span>
                    );
                    if (rfq.status === "EVALUATION") {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold block text-center">
                          Evaluasi
                        </span>
                      );
                    } else if (rfq.status === "AWARDED" || rfq.status === "PO_CREATED") {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold block text-center">
                          Selesai
                        </span>
                      );
                    } else if (rfq.status === "DRAFT") {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold block text-center">
                          Draft
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={rfq.id}
                        onClick={() => onNavigateTab("rfq")}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{rfq.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {rfq.rfqNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {rfq.category}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatRupiah(rfq.hpsBudget)}
                        </td>
                        <td className="py-3 px-4">{statusBadge}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-500">
                          {formatDate(rfq.submissionDeadline)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Aktivitas Terbaru & Tugas Hari Ini */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col p-4">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="font-bold text-sm text-slate-900">
              Aktivitas Terbaru
            </h2>
            <p className="text-[11px] text-slate-400">
              {dynamicActivities.length > 0
                ? "Riwayat log transaksi pengadaan"
                : "Belum ada aktivitas terinput"}
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {dynamicActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Belum Ada Aktivitas Terinput
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aktivitas pengadaan akan otomatis dicatat setiap kali Anda menginput PR, RFQ, PO, atau Faktur.
                </p>
              </div>
            ) : (
              dynamicActivities.map((act) => (
                <div key={act.id} className="flex gap-3 relative">
                  <div className="absolute left-1 top-4 h-full w-px bg-slate-100" />
                  <div className={`w-2 h-2 rounded-full ${act.color} mt-1.5 z-10 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {act.detail}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(act.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Callout box: Tugas Hari Ini */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-xs font-bold text-blue-800 mb-1">
              Tugas Hari Ini
            </h3>
            {dynamicTask ? (
              <div>
                <p className="text-[11px] text-blue-700 leading-tight mb-2">
                  <strong>{dynamicTask.title}:</strong> {dynamicTask.detail}
                </p>
                <button
                  onClick={() => onNavigateTab(dynamicTask.targetTab)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Proses Sekarang &rarr;
                </button>
              </div>
            ) : hasAnyData ? (
              <p className="text-[11px] text-blue-600 leading-tight">
                Semua proses transaksi pengadaan telah mutakhir. Tidak ada tugas yang tertunda.
              </p>
            ) : (
              <p className="text-[11px] text-blue-600 leading-tight">
                Belum ada tugas mendesak karena belum ada transaksi pengadaan yang diinput.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Spend Analytics & Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Monthly Spend Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tren Alokasi Anggaran vs Realisasi Belanja (Juta Rp)
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan bulanan Pagu Anggaran dan Realisasi Purchase Order
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Detail Laporan</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {monthlyChartData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Belum Ada Data Realisasi Belanja
              </p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Grafik perbandingan pagu anggaran dan realisasi PO akan terbentuk otomatis mengikuti transaksi yang Anda input.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`Rp ${val} Juta`, ""]}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px", border: "none" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="budget" name="Pagu Anggaran" stroke="#94a3b8" fillOpacity={1} fill="url(#budgetGradient)" />
                  <Area type="monotone" dataKey="actualSpend" name="Realisasi PO" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#spendGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* P2P Lifecycle Steps */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">
                P2P Lifecycle Navigasi
              </h2>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                Terintegrasi
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Akses cepat ke tahapan operasional pengadaan
            </p>

            <div className="space-y-2">
              {[
                { label: "1. Purchase Requisitions", tab: "pr", count: `${requisitions.length} Dokumen` },
                { label: "2. E-Tendering / RFQ", tab: "rfq", count: `${rfqs.length} Paket` },
                { label: "3. Purchase Orders (PO)", tab: "po", count: `${purchaseOrders.length} Kontrak` },
                { label: "4. Penerimaan & BAST", tab: "grn", count: `${goodsReceipts.length} BAST` },
                { label: "5. 3-Way Match & Faktur", tab: "matching", count: `${invoices.length} Faktur` },
                { label: "6. Vendor Management", tab: "vendors", count: `${vendors.length} Rekanan Aktif` },
              ].map((step, idx) => (
                <div
                  key={idx}
                  id={`p2p-nav-${step.tab}`}
                  onClick={() => onNavigateTab(step.tab as NavTab)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                >
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                    {step.label}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-blue-600">
                    <span className="font-mono text-[11px]">{step.count}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">ISO 9001:2015 & LKPP:</span> Setiap transaksi tersimpan dalam riwayat audit permanen.
          </div>
        </div>
      </div>
    </div>
  );
};
