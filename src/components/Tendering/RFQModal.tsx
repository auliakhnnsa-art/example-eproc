import React, { useState } from "react";
import {
  X,
  Gavel,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Sparkles,
  FileCheck,
  Send,
} from "lucide-react";
import { RFQ, TenderType } from "../../types/procurement";
import { formatRupiah } from "../../utils/formatters";

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRFQ: (rfq: RFQ) => void;
  initialPRData?: {
    id: string;
    prNumber: string;
    title: string;
    category: string;
    budget: number;
    items: {
      name: string;
      specification: string;
      unit: string;
      quantity: number;
      estimatedPrice: number;
    }[];
  } | null;
}

export const RFQModal: React.FC<RFQModalProps> = ({
  isOpen,
  onClose,
  onSaveRFQ,
  initialPRData,
}) => {
  const [title, setTitle] = useState(initialPRData?.title || "");
  const [category, setCategory] = useState(
    initialPRData?.category || "IT & Infrastructure"
  );
  const [tenderType, setTenderType] = useState<TenderType>("OPEN_TENDER");
  const [hpsBudget, setHpsBudget] = useState<number>(
    initialPRData?.budget || 100000000
  );
  const [submissionDeadline, setSubmissionDeadline] = useState<string>("2026-09-15");
  const [requirements, setRequirements] = useState<string[]>([
    "Memiliki NIB dan Izin Usaha sesuai klasifikasi KBLI pengadaan",
    "Surat Keterangan Fiskal (SKF) / Kepatuhan Pajak Tahunan",
    "Berpengalaman mengerjakan pekerjaan sejenis dalam 3 tahun terakhir",
    "Garansi Resmi & Komitmen After-Sales Support",
  ]);
  const [technicalSpecs, setTechnicalSpecs] = useState<
    { item: string; specification: string; unit: string; qty: number; hpsUnit: number }[]
  >(
    initialPRData?.items?.map((it) => ({
      item: it.name,
      specification: it.specification,
      unit: it.unit,
      qty: it.quantity,
      hpsUnit: it.estimatedPrice,
    })) || [
      {
        item: "Item Paket Pengadaan",
        specification: "Spesifikasi teknis sesuai standar pabrikan",
        unit: "Unit",
        qty: 1,
        hpsUnit: 100000000,
      },
    ]
  );

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("Harap isi judul tender");
      return;
    }

    const newRFQ: RFQ = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ/TND/2026/${new Date().getMonth() + 1}-${Math.floor(100 + Math.random() * 900)}`,
      title,
      prId: initialPRData?.id,
      prNumber: initialPRData?.prNumber,
      category,
      tenderType,
      hpsBudget: Number(hpsBudget),
      status: "PUBLISHED",
      publishedDate: new Date().toISOString().split("T")[0],
      submissionDeadline,
      technicalSpecs,
      requirements: requirements.filter((r) => r.trim() !== ""),
      evaluationWeights: {
        administrative: 10,
        technical: 50,
        price: 40,
      },
      bids: [],
    };

    onSaveRFQ(newRFQ);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                Terbitkan Paket Tender & RFQ Baru
              </h3>
              <p className="text-xs text-slate-300">
                {initialPRData ? `Dikonversi dari ${initialPRData.prNumber}` : "Pengadaan Terbuka / Sourcing Terpilih"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Judul Paket Tender / Pengadaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Metode Pengadaan</label>
              <select
                value={tenderType}
                onChange={(e) => setTenderType(e.target.value as TenderType)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              >
                <option value="OPEN_TENDER">Tender Terbuka (Public)</option>
                <option value="LIMITED_TENDER">Tender Terbatas (Selektif)</option>
                <option value="DIRECT_SOURCING">Pengadaan Langsung (Direct)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Pagu HPS Resmi (IDR)</label>
              <input
                type="number"
                required
                value={hpsBudget}
                onChange={(e) => setHpsBudget(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Batas Akhir Penawaran</label>
              <input
                type="date"
                required
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Syarat Kualifikasi Administrasi & Legalitas Rekanan
              </label>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Syarat</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => {
                      const updated = [...requirements];
                      updated[idx] = e.target.value;
                      setRequirements(updated);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specs List */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800">
              Spesifikasi Teknis Barang / Jasa ({technicalSpecs.length} Item)
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5">Spesifikasi</th>
                    <th className="p-2.5 w-20">Volume</th>
                    <th className="p-2.5 w-28 text-right">HPS Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicalSpecs.map((s, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-bold text-slate-800">{s.item}</td>
                      <td className="p-2.5 text-slate-600">{s.specification}</td>
                      <td className="p-2.5">
                        {s.qty} {s.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(s.hpsUnit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Publikasikan Tender (RFQ)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
