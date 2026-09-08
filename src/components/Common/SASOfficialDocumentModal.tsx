import React from "react";
import { X } from "lucide-react";
import { SASOfficialDocumentView, SASOfficialDocumentData } from "./SASOfficialDocumentView";

interface SASOfficialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SASOfficialDocumentData | null;
}

export const SASOfficialDocumentModal: React.FC<SASOfficialDocumentModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-5xl h-full sm:h-[94vh] rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg border border-slate-600 transition-colors cursor-pointer print:hidden"
          title="Tutup Preview Dokumen"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Document Viewer Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <SASOfficialDocumentView data={data} onClose={onClose} showControlBar={true} />
        </div>
      </div>
    </div>
  );
};
