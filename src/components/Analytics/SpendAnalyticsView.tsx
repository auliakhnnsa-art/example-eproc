import React from "react";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  DollarSign,
  Award,
  ShieldAlert,
  Download,
  Filter,
  Layers,
  Inbox,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { formatRupiah, formatShortRupiah } from "../../utils/formatters";

interface SpendAnalyticsViewProps {
  analyticsData: {
    totalSpendYTD: number;
    savingsRealized: number;
    totalActiveContracts: number;
    spendByCategory: { name: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; spend: number; budget: number; savings: number }[];
    topVendors: { name: string; spend: number; sharePercentage: number }[];
  };
}

const CATEGORY_COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

export const SpendAnalyticsView: React.FC<SpendAnalyticsViewProps> = ({
  analyticsData,
}) => {
  const savingsBase = analyticsData.totalSpendYTD + analyticsData.savingsRealized;
  const savingsPct =
    savingsBase > 0
      ? ((analyticsData.savingsRealized / savingsBase) * 100).toFixed(1)
      : "0.0";

  const hasData =
    analyticsData.totalSpendYTD > 0 ||
    analyticsData.totalActiveContracts > 0 ||
    analyticsData.spendByCategory.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Spend Analytics & Cost Savings Intelligence
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              Real-time Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis penyerapan anggaran, realisasi efisiensi harga vs HPS, dan konsentrasi rekanan dari data yang diinput.
          </p>
        </div>

        {hasData && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Laporan Finansial</span>
          </button>
        )}
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Realisasi Belanja (YTD)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatRupiah(analyticsData.totalSpendYTD)}
          </div>
          <p className="text-[11px] text-slate-500">
            {analyticsData.totalSpendYTD > 0
              ? `Realisasi dari ${analyticsData.totalActiveContracts} Purchase Order aktif`
              : "Belum ada realisasi Purchase Order terinput"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Realisasi Penghematan (Cost Savings)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {formatRupiah(analyticsData.savingsRealized)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            {analyticsData.savingsRealized > 0
              ? `Efisiensi ${savingsPct}% di bawah pagu HPS awal lewat e-Bidding kompetitif`
              : "Belum ada selisih penghematan tercatat"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kontrak Aktif Berjalan
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {analyticsData.totalActiveContracts} Paket
          </div>
          <p className="text-[11px] text-slate-500">
            {analyticsData.totalActiveContracts > 0
              ? "Total kontrak PO pengadaan barang/jasa"
              : "Belum ada kontrak pengadaan terinput"}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tren Penyerapan Anggaran Bulanan vs Pagu Anggaran
              </h3>
              <p className="text-xs text-slate-400">
                Data historis realisasi belanja per bulan berdasarkan transaksi terinput
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {analyticsData.monthlyTrend.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Belum Ada Data Historis Realisasi Belanja
                </p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Grafik tren penyerapan anggaran akan terisi otomatis setelah Anda menerbitkan RFQ atau Purchase Order.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(val) => formatShortRupiah(val)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatRupiah(val), ""]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    name="Pagu Anggaran"
                    dataKey="budget"
                    stroke="#94A3B8"
                    strokeDasharray="4 4"
                    fill="url(#colorBudget)"
                  />
                  <Area
                    type="monotone"
                    name="Realisasi Belanja"
                    dataKey="spend"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="url(#colorSpend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Spend by Category Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribusi Kategori Belanja
            </h3>
            <p className="text-xs text-slate-400">
              Proporsi alokasi pengadaan per bidang
            </p>

            <div className="h-56 w-full mt-2">
              {analyticsData.spendByCategory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <PieIcon className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Belum Ada Kategori Belanja
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Diagram akan terbentuk setelah Purchase Order terbit.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.spendByCategory}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {analyticsData.spendByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatRupiah(val)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {analyticsData.spendByCategory.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium truncate max-w-[140px]">
                    {cat.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Vendors Concentration Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Konsentrasi Belanja Rekanan Terbesar (Top Vendor Concentration)
        </h3>

        {analyticsData.topVendors.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-slate-700">
              Belum Ada Data Rekanan Bertransaksi
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar rekanan dengan konsentrasi belanja terbesar akan dihitung otomatis dari Purchase Order yang diterbitkan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analyticsData.topVendors.map((vendor, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {vendor.sharePercentage}% Pangsa
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                  {vendor.name}
                </h4>

                <div className="text-sm font-mono font-black text-slate-900">
                  {formatRupiah(vendor.spend)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
