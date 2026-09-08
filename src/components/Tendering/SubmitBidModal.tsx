import React, { useState } from "react";
import {
  X,
  Send,
  Building2,
  DollarSign,
  Calendar,
  ShieldCheck,
  FileUp,
} from "lucide-react";
import { RFQ, VendorBid, Vendor } from "../../types/procurement";
import { formatRupiah } from "../../utils/formatters";

interface SubmitBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQ;
  vendors: Vendor[];
  onSubmitBid: (rfqId: string, bid: VendorBid) => void;
}

export const SubmitBidModal: React.FC<SubmitBidModalProps> = ({
  isOpen,
  onClose,
  rfq,
  vendors = [],
  onSubmitBid,
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    vendors?.[0]?.id || ""
  );
  const [totalOfferPrice, setTotalOfferPrice] = useState<number>(
    Math.round(rfq.hpsBudget * 0.95)
  );
  const [leadTimeDays, setLeadTimeDays] = useState<number>(21);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(24);
  const [technicalScore, setTechnicalScore] = useState<number>(90);
  const [notes, setNotes] = useState<string>(
    "Menyanggupi seluruh Kerangka Acuan Kerja (KAK) & spesifikasi teknis dengan garansi resmi dan dukungan teknis 24/7."
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === selectedVendorId) || vendors?.[0];
    if (!vendor) return;

    const priceScore = Math.max(
      60,
      Math.min(100, Math.round(100 - ((totalOfferPrice - rfq.hpsBudget * 0.9) / rfq.hpsBudget) * 50))
    );
    const overallScore = Math.round(technicalScore * 0.6 + priceScore * 0.4 * 10) / 10;

    const newBid: VendorBid = {
      id: `bid-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorRating: vendor.rating,
      totalOfferPrice: Number(totalOfferPrice),
      leadTimeDays: Number(leadTimeDays),
      warrantyMonths: Number(warrantyMonths),
      technicalScore: Number(technicalScore),
      priceScore,
      overallScore,
      complianceStatus: "VERIFIED",
      submittedAt: new Date().toLocaleString("id-ID"),
      notes,
      bidItems: rfq.technicalSpecs.map((s, idx) => ({
        itemId: `spec-${idx}`,
        itemName: s.item,
        qty: s.qty,
        unitPrice: Math.round(Number(totalOfferPrice) / (rfq.technicalSpecs.length || 1)),
        subtotal: Math.round(Number(totalOfferPrice) / (rfq.technicalSpecs.length || 1)),
      })),
    };

    onSubmitBid(rfq.id, newBid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                Submit Penawaran Vendor (e-Bidding)
              </h3>
              <p className="text-xs text-slate-300">
                Paket: {rfq.title} (HPS: {formatRupiah(rfq.hpsBudget)})
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Pilih Rekanan / Vendor Peserta Lelang
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category} • Rating: ⭐ {v.rating})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">
                Nilai Total Penawaran (IDR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={totalOfferPrice}
                onChange={(e) => setTotalOfferPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-500">
                Format: {formatRupiah(totalOfferPrice)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Lead Time Pengiriman (Hari)</label>
              <input
                type="number"
                min={1}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Masa Garansi Resmi (Bulan)</label>
              <input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Penilaian Teknis Awal (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={technicalScore}
                onChange={(e) => setTechnicalScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Catatan & Komitmen Penawaran</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Dokumen penawaran akan dienkripsi dan diverifikasi otomatis dalam matriks evaluasi panitia.</span>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Submit Penawaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
