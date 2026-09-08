import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  itemCode?: string;
  itemTypeLabel?: string;
  warningNote?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemCode,
  itemTypeLabel = "data",
  warningNote = "Tindakan ini tidak dapat dibatalkan. Rekaman data yang dihapus akan dihilangkan dari sistem pengadaan.",
  onConfirm,
  onCancel,
  confirmButtonText = "Ya, Hapus Sekarang",
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">{title}</h3>
              <p className="text-xs text-rose-100">Konfirmasi Penghapusan {itemTypeLabel}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 bg-white">
          <p className="text-slate-600 text-sm">
            Apakah Anda yakin ingin menghapus {itemTypeLabel} berikut?
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            {itemCode && (
              <div className="font-mono text-xs font-bold text-slate-500">
                Kode / ID: <span className="text-slate-900">{itemCode}</span>
              </div>
            )}
            {itemName && (
              <div className="text-sm font-bold text-slate-900 line-clamp-2">
                {itemName}
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">{warningNote}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? "Menghapus..." : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
