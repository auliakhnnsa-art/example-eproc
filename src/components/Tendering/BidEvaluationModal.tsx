import React, { useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Building2,
  FileCheck,
  Percent,
} from "lucide-react";
import { RFQ, VendorBid } from "../../types/procurement";
import { formatRupiah, formatShortRupiah, formatDate } from "../../utils/formatters";

interface BidEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQ;
  onAwardVendor: (rfqId: string, vendorId: string, vendorName: string) => void;
}

export const BidEvaluationModal: React.FC<BidEvaluationModalProps> = ({
  isOpen,
  onClose,
  rfq,
  onAwardVendor,
}) => {
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(
    rfq.aiEvaluationResult || null
  );
  const [selectedWinnerVendorId, setSelectedWinnerVendorId] = useState<string>(
    rfq.awardedVendorId || (rfq.bids.length > 0 ? rfq.bids[0].vendorId : "")
  );

  if (!isOpen) return null;

  const handleRunAIEvaluation = async () => {
    setIsAnalyzingAI(true);
    try {
      const res = await fetch("/api/ai/evaluate-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqTitle: rfq.title,
          hpsTotal: rfq.hpsBudget,
          bids: rfq.bids.map((b) => ({
            vendorId: b.vendorId,
            vendorName: b.vendorName,
            totalOfferPrice: b.totalOfferPrice,
            leadTimeDays: b.leadTimeDays,
            warrantyMonths: b.warrantyMonths,
            technicalScore: b.technicalScore,
            complianceStatus: b.complianceStatus,
            notes: b.notes,
          })),
        }),
      });

      if (!res.ok) throw new Error("Gagal mengevaluasi penawaran dengan AI");
      const data = await res.json();
      setAiEvaluation(data);

      // Auto pick recommended winner if provided
      if (data.recommendedWinner) {
        const matched = rfq.bids.find((b) =>
          b.vendorName.toLowerCase().includes(data.recommendedWinner.toLowerCase())
        );
        if (matched) setSelectedWinnerVendorId(matched.vendorId);
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan analisis AI: " + err.message);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleConfirmAward = () => {
    const winner = rfq.bids.find((b) => b.vendorId === selectedWinnerVendorId);
    if (!winner) {
      alert("Pilih vendor pemenang terlebih dahulu");
      return;
    }
    onAwardVendor(rfq.id, winner.vendorId, winner.vendorName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                Komite Evaluasi & Penetapan Pemenang Lelang
              </h3>
              <p className="text-xs text-slate-300">
                Paket: {rfq.rfqNumber} • HPS: {formatRupiah(rfq.hpsBudget)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* AI Evaluator Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                <span>ProcuraAI Smart Bid Evaluator & Anomaly Detector</span>
              </div>
              <p className="text-xs text-indigo-700/80 leading-relaxed max-w-2xl">
                Evaluasi komparatif multi-kriteria (Harga vs HPS, Spesifikasi Teknis, Reputasi Rekanan, SLA, Garansi, dan Deteksi Risiko Penawaran Dumping).
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAIEvaluation}
              disabled={isAnalyzingAI}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isAnalyzingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menganalisis Penawaran...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Jalankan Evaluasi AI</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result Card */}
          {aiEvaluation && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-lg border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Hasil Analisis Komite AI
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Rekomendasi Pemenang: {aiEvaluation.recommendedWinner || aiEvaluation.recommendedVendor || "Peringkat 1 Terverifikasi"}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {aiEvaluation.executiveSummary || aiEvaluation.summary || "Evaluasi komparatif teknis dan komersial telah berhasil diproses."}
              </p>

              {/* Anomaly Alerts */}
              {((Array.isArray(aiEvaluation.anomalyAlerts) && aiEvaluation.anomalyAlerts.length > 0) || (Array.isArray(aiEvaluation.anomalies) && aiEvaluation.anomalies.length > 0)) && (
                <div className="space-y-1.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Peringatan Anomali & Risiko Kepatuhan:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200">
                    {(Array.isArray(aiEvaluation.anomalyAlerts) ? aiEvaluation.anomalyAlerts : aiEvaluation.anomalies || []).map((anom: string, i: number) => (
                      <li key={i}>{anom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(aiEvaluation.negotiationNotes || aiEvaluation.justification) && (
                <div className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded-xl">
                  <span className="font-semibold text-slate-300">Catatan Negosiasi & Justifikasi: </span>
                  {aiEvaluation.negotiationNotes || aiEvaluation.justification}
                </div>
              )}
            </div>
          )}

          {/* Comparative Matrix Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Matriks Komparasi Penawaran Masuk ({rfq.bids.length} Rekanan)
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Pilih Pemenang</th>
                    <th className="p-3.5">Nama Vendor / Rekanan</th>
                    <th className="p-3.5">Nilai Penawaran</th>
                    <th className="p-3.5">Selisih Thd HPS</th>
                    <th className="p-3.5">Lead Time</th>
                    <th className="p-3.5">Garansi</th>
                    <th className="p-3.5">Skor Teknis</th>
                    <th className="p-3.5">Skor Akhir</th>
                    <th className="p-3.5">Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rfq.bids.map((bid) => {
                    const variance = bid.totalOfferPrice - rfq.hpsBudget;
                    const variancePct = ((variance / rfq.hpsBudget) * 100).toFixed(1);
                    const isSelected = selectedWinnerVendorId === bid.vendorId;

                    return (
                      <tr
                        key={bid.id}
                        onClick={() => setSelectedWinnerVendorId(bid.vendorId)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/80 font-semibold"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="radio"
                            name="winner-vendor"
                            checked={isSelected}
                            onChange={() => setSelectedWinnerVendorId(bid.vendorId)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {bid.vendorName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Rating Rekanan: ⭐ {bid.vendorRating} / 5.0
                          </div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {formatRupiah(bid.totalOfferPrice)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              variance <= 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {variance <= 0 ? `${variancePct}% (Hemat)` : `+${variancePct}% (Over)`}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {bid.leadTimeDays} Hari Kerja
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {bid.warrantyMonths} Bulan
                        </td>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">
                          {bid.technicalScore} / 100
                        </td>
                        <td className="p-3.5 font-mono font-extrabold text-emerald-700">
                          {bid.overallScore.toFixed(1)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              bid.complianceStatus === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {bid.complianceStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Winner Summary */}
          {selectedWinnerVendorId && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Vendor Pemenang Terpilih
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {rfq.bids.find((b) => b.vendorId === selectedWinnerVendorId)?.vendorName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Penawaran:{" "}
                    <span className="font-bold text-slate-800">
                      {formatRupiah(
                        rfq.bids.find((b) => b.vendorId === selectedWinnerVendorId)
                          ?.totalOfferPrice || 0
                      )}
                    </span>{" "}
                    (Penghematan Rp{" "}
                    {(
                      rfq.hpsBudget -
                      (rfq.bids.find((b) => b.vendorId === selectedWinnerVendorId)
                        ?.totalOfferPrice || 0)
                    ).toLocaleString("id-ID")}{" "}
                    dari HPS)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAward}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
              >
                <Award className="h-4 w-4" />
                <span>Tetapkan Pemenang (Award)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Penetapan pemenang akan otomatis membuka pembuatan Purchase Order (PO).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
