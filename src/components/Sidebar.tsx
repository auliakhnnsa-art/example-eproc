import React from "react";
import {
  LayoutDashboard,
  FileText,
  Gavel,
  ShoppingBag,
  PackageCheck,
  Receipt,
  Building,
  Layers,
  BarChart3,
  Bot,
  FileSpreadsheet,
  Database,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "pr"
  | "rfq"
  | "po"
  | "grn"
  | "matching"
  | "vendors"
  | "catalog"
  | "analytics"
  | "ai-studio"
  | "workspace";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  counts: {
    pr: number;
    rfq: number;
    po: number;
    grn: number;
    matching: number;
    vendors?: number;
  };
  onResetData?: () => void;
  onClearData?: () => void;
  onLoadSampleData?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  counts,
  onResetData,
  onClearData,
  onLoadSampleData,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "pr",
      label: "Requisition (PR)",
      icon: FileText,
      count: counts.pr,
      badgeColor: "bg-amber-500/20 text-amber-300",
    },
    {
      id: "rfq",
      label: "E-Tender / RFQ",
      icon: Gavel,
      count: counts.rfq,
      badgeColor: "bg-blue-500/20 text-blue-300",
    },
    {
      id: "po",
      label: "Purchase Orders",
      icon: ShoppingBag,
      count: counts.po,
      badgeColor: "bg-indigo-500/20 text-indigo-300",
    },
    {
      id: "grn",
      label: "Penerimaan (GRN/BAST)",
      icon: PackageCheck,
      count: counts.grn,
      badgeColor: "bg-emerald-500/20 text-emerald-300",
    },
    {
      id: "matching",
      label: "3-Way Matching",
      icon: Receipt,
      count: counts.matching,
      badgeColor: "bg-rose-500/20 text-rose-300",
    },
    {
      id: "vendors",
      label: "Vendor Management",
      icon: Building,
      count: counts.vendors,
      badgeColor: "bg-sky-500/20 text-sky-300",
    },
    {
      id: "workspace",
      label: "Google Sheets & Docs",
      icon: FileSpreadsheet,
      badgeColor: "bg-emerald-500/20 text-emerald-300",
    },
    {
      id: "catalog",
      label: "E-Katalog & HPS",
      icon: Layers,
    },
    {
      id: "analytics",
      label: "Laporan Analitik",
      icon: BarChart3,
    },
    {
      id: "ai-studio",
      label: "AI Procurement Hub",
      icon: Bot,
    },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white shadow-sm">
          P
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Procure<span className="text-blue-400">Edge</span>
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 font-medium border border-blue-500/20"
                  : "hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-blue-400" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isActive
                      ? "bg-blue-500/30 text-blue-300"
                      : item.badgeColor || "bg-slate-700 text-slate-300"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Storage & Auto-save Indicator */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="bg-slate-800/90 rounded-xl p-3 text-xs text-slate-300 border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Auto-Save Aktif</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Lokal</span>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Data input & perubahan tab disimpan otomatis di browser. Saat refresh, data terbaru tetap terjaga.
          </p>

          <div className="pt-1 space-y-1.5">
            {onClearData && (
              <button
                onClick={onClearData}
                className="w-full py-1.5 px-2 bg-red-950/40 hover:bg-red-900/60 hover:text-red-200 text-red-300/80 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-red-900/50"
                title="Hapus seluruh data untuk mulai dari awal/nol"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Kosongkan Semua Data</span>
              </button>
            )}

            {onLoadSampleData && (
              <button
                onClick={onLoadSampleData}
                className="w-full py-1.5 px-2 bg-slate-700/60 hover:bg-slate-700 hover:text-white text-slate-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-600/40"
                title="Muat contoh template data lengkap"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Muat Contoh Data</span>
              </button>
            )}

            {!onLoadSampleData && onResetData && (
              <button
                onClick={onResetData}
                className="w-full py-1.5 px-2 bg-slate-700/60 hover:bg-slate-700 hover:text-white text-slate-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-600/40"
                title="Kembalikan semua data ke template awal"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset ke Data Default</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
