import React from "react";
import {
  Sparkles,
  Search,
  Bell,
  User,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import { UserRole } from "../types/procurement";

interface NavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onOpenAICopilot: (promptInitial?: string) => void;
  onOpenGoogleWorkspace: () => void;
  pendingCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  onOpenAICopilot,
  onOpenGoogleWorkspace,
  pendingCount,
  searchQuery,
  setSearchQuery,
}) => {
  const roleDisplayMap: Record<UserRole, { name: string; title: string; avatarText: string }> = {
    procurement_officer: {
      name: "Ahmad Santoso",
      title: "Senior Procurement",
      avatarText: "AS",
    },
    department_requester: {
      name: "Budi Pratama",
      title: "IT Department Requester",
      avatarText: "BP",
    },
    approver_head: {
      name: "Ir. Hendra Wijaya",
      title: "VP / Approver Head",
      avatarText: "HW",
    },
    finance_auditor: {
      name: "Siti Rahmawati, SE",
      title: "Finance & Compliance Auditor",
      avatarText: "SR",
    },
    vendor: {
      name: "PT Mitra Solusi Informatika",
      title: "Authorized Vendor Partner",
      avatarText: "MS",
    },
  };

  const user = roleDisplayMap[currentRole];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 z-30 sticky top-0">
      {/* Brand & Search Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-base shadow-sm">
            P
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900 hidden sm:inline">
            Procure<span className="text-blue-600">Edge</span>
          </span>
        </div>

        {/* Search input styled per design */}
        <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-full w-80 lg:w-96 border border-slate-200/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            id="global-procurement-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tender, vendor, atau dokumen..."
            className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 ml-1 font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Google Workspace Hub, AI Assistant, Notifications, Role Switcher, User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Google Workspace Hub Quick Trigger */}
        <button
          id="btn-google-workspace-trigger"
          onClick={onOpenGoogleWorkspace}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg shadow-2xs transition-all cursor-pointer"
          title="Sinkronisasi Google Sheets & Mail Merge Google Docs"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Google Workspace</span>
        </button>

        {/* AI Assistant Button */}
        <button
          id="btn-ai-copilot-trigger"
          onClick={() => onOpenAICopilot()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            id="btn-procurement-notifications"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
            title={`${pendingCount} item butuh tindakan`}
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Role Selector pill */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500 text-[11px]">Role:</span>
          <select
            id="select-user-role"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-transparent border-0 font-semibold text-slate-800 text-xs focus:ring-0 cursor-pointer pr-3"
          >
            <option value="procurement_officer">Procurement Officer</option>
            <option value="department_requester">Dept Requester</option>
            <option value="approver_head">Dept Head (Approver)</option>
            <option value="finance_auditor">Finance Auditor</option>
            <option value="vendor">Vendor Partner</option>
          </select>
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-6">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {user.title}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300/80 flex items-center justify-center font-bold text-slate-700 text-xs shadow-xs">
            {user.avatarText}
          </div>
        </div>
      </div>
    </header>
  );
};

