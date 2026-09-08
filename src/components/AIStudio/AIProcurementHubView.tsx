import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Gavel,
  ShieldCheck,
  TrendingDown,
  Loader2,
  CheckCircle2,
  Copy,
  Send,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatRupiah } from "../../utils/formatters";

export const AIProcurementHubView: React.FC = () => {
  const [activeAITool, setActiveAITool] = useState<"kak" | "rfq" | "eval" | "compliance">("kak");

  // State for KAK & Spec Generator
  const [kakTitle, setKakTitle] = useState("Pengadaan Cloud Hosting & Disaster Recovery Site");
  const [kakBudget, setKakBudget] = useState(250000000);
  const [kakCategory, setKakCategory] = useState("IT & Infrastructure");
  const [kakDescription, setKakDescription] = useState(
    "Dibutuhkan infrastruktur cloud high-availability dengan RTO < 15 menit, RPO < 5 menit, sertifikasi Tier 3 Data Center di Indonesia, dan dukungan insinyur 24/7."
  );
  const [isGeneratingKAK, setIsGeneratingKAK] = useState(false);
  const [generatedKAKResult, setGeneratedKAKResult] = useState<any>(null);

  // State for Bid Evaluation Simulator
  const [evalHPS, setEvalHPS] = useState(500000000);
  const [evalVendors, setEvalVendors] = useState([
    { name: "PT Solusi Cloud Prima", price: 460000000, techScore: 92, leadTime: 14, warranty: 36 },
    { name: "CV Infra Cyber Nusantara", price: 380000000, techScore: 84, leadTime: 21, warranty: 24 },
    { name: "PT Mega Data Internasional", price: 495000000, techScore: 96, leadTime: 7, warranty: 36 },
  ]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const handleGenerateKAK = async () => {
    setIsGeneratingKAK(true);
    setGeneratedKAKResult(null);
    try {
      const res = await fetch("/api/ai/generate-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: kakTitle,
          category: kakCategory,
          budget: kakBudget,
          description: kakDescription,
          urgency: "HIGH",
        }),
      });

      if (!res.ok) throw new Error("Gagal menghubungkan ke AI Studio Generator");
      const data = await res.json();
      setGeneratedKAKResult(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsGeneratingKAK(false);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    try {
      const res = await fetch("/api/ai/evaluate-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqTitle: "Simulasi Pengadaan Cloud Server",
          hpsTotal: evalHPS,
          bids: evalVendors.map((v, idx) => ({
            vendorId: `sim-v-${idx}`,
            vendorName: v.name,
            totalOfferPrice: v.price,
            technicalScore: v.techScore,
            leadTimeDays: v.leadTime,
            warrantyMonths: v.warranty,
            complianceStatus: "VERIFIED",
            notes: "Proposal lelang lengkap",
          })),
        }),
      });

      if (!res.ok) throw new Error("Gagal menjalankan evaluasi");
      const data = await res.json();
      setEvalResult(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              ProcuraAI Intelligence Hub
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              Enterprise AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Studio otomatisasi pengadaan: Penyusunan KAK otomatis, Audit HPS, Evaluasi Komite Tender, dan Deteksi Risiko.
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAITool("kak")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeAITool === "kak"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Generator Spesifikasi Teknis & KAK</span>
        </button>

        <button
          onClick={() => setActiveAITool("eval")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeAITool === "eval"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Gavel className="h-4 w-4" />
          <span>Simulasi Komparasi & Evaluasi Tender</span>
        </button>
      </div>

      {/* Tool 1: KAK Generator */}
      {activeAITool === "kak" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Input Kebutuhan Pengadaan</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800">Judul Pengadaan</label>
              <input
                type="text"
                value={kakTitle}
                onChange={(e) => setKakTitle(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Kategori</label>
                <select
                  value={kakCategory}
                  onChange={(e) => setKakCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="IT & Infrastructure">IT & Infrastructure</option>
                  <option value="Operasional & Logistik">Operasional & Logistik</option>
                  <option value="General Affairs & Fasilitas">General Affairs & Fasilitas</option>
                  <option value="Jasa Profesional">Jasa Profesional</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Pagu Estimasi Anggaran (IDR)</label>
                <input
                  type="number"
                  value={kakBudget}
                  onChange={(e) => setKakBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800">Deskripsi & Tujuan Pengadaan</label>
              <textarea
                rows={4}
                value={kakDescription}
                onChange={(e) => setKakDescription(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl leading-relaxed"
              />
            </div>

            <button
              onClick={handleGenerateKAK}
              disabled={isGeneratingKAK}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {isGeneratingKAK ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI Sedang Menyusun Dokumen KAK...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Dokumen KAK & Breakdown HPS</span>
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4 overflow-y-auto max-h-[600px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Hasil Dokumen KAK & Spesifikasi AI
                </span>
              </div>
              {generatedKAKResult && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(generatedKAKResult, null, 2));
                    alert("Teks berhasil disalin ke clipboard!");
                  }}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin</span>
                </button>
              )}
            </div>

            {!generatedKAKResult && !isGeneratingKAK && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center text-xs space-y-2">
                <FileText className="h-10 w-10 text-slate-700" />
                <p>Klik tombol <strong>"Generate Dokumen KAK"</strong> untuk melihat hasil rancangan rincian item, spesifikasi, dan mitigasi risiko.</p>
              </div>
            )}

            {isGeneratingKAK && (
              <div className="h-64 flex flex-col items-center justify-center text-indigo-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-xs">Menganalisis standar industri, harga acuan, dan regulasi...</span>
              </div>
            )}

            {generatedKAKResult && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-indigo-400 font-bold block mb-1">KERANGKA ACUAN KERJA (KAK):</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl">
                    {generatedKAKResult.summary || generatedKAKResult.kakDraft || "Dokumen Kerangka Acuan Kerja Terstruktur"}
                  </p>
                </div>

                <div>
                  <span className="text-indigo-400 font-bold block mb-2">RINCIAN SPESIFIKASI & HPS:</span>
                  <div className="space-y-2">
                    {(Array.isArray(generatedKAKResult.technicalSpecs) ? generatedKAKResult.technicalSpecs : []).map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>{item.item || item.name || "Item Pengadaan"}</span>
                          <span className="font-mono text-emerald-400">
                            {item.qty || item.quantity || 1} {item.unit || "Unit"} • {formatRupiah(item.hpsUnit || item.estimatedUnitPrice || 0)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{item.specification || item.specs || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(Array.isArray(generatedKAKResult.vendorRequirements) ? generatedKAKResult.vendorRequirements : Array.isArray(generatedKAKResult.riskFactors) ? generatedKAKResult.riskFactors : []) && (
                  <div>
                    <span className="text-rose-400 font-bold block mb-1">PERSYARATAN REKANAN & MITIGASI RISIKO:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {(Array.isArray(generatedKAKResult.vendorRequirements)
                        ? generatedKAKResult.vendorRequirements
                        : Array.isArray(generatedKAKResult.riskFactors)
                        ? generatedKAKResult.riskFactors
                        : [generatedKAKResult.riskMitigationNotes || "Kepatuhan tata kelola standar"]
                      ).map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 2: Bid Evaluation Simulator */}
      {activeAITool === "eval" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gavel className="h-4 w-4 text-indigo-600" />
              <span>Simulasi Data Penawaran Masuk</span>
            </h3>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Pagu HPS Acuan (IDR)</label>
              <input
                type="number"
                value={evalHPS}
                onChange={(e) => setEvalHPS(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-3">
              <label className="font-bold text-slate-800">Peserta Tender & Penawaran:</label>
              {evalVendors.map((v, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900">{v.name}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga (IDR)</span>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => {
                          const updated = [...evalVendors];
                          updated[i].price = Number(e.target.value);
                          setEvalVendors(updated);
                        }}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Skor Teknis (0-100)</span>
                      <input
                        type="number"
                        value={v.techScore}
                        onChange={(e) => {
                          const updated = [...evalVendors];
                          updated[i].techScore = Number(e.target.value);
                          setEvalVendors(updated);
                        }}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lead Time (Hari)</span>
                      <input
                        type="number"
                        value={v.leadTime}
                        onChange={(e) => {
                          const updated = [...evalVendors];
                          updated[i].leadTime = Number(e.target.value);
                          setEvalVendors(updated);
                        }}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengevaluasi Komparatif...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Jalankan Evaluasi Multi-Kriteria AI</span>
                </>
              )}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4 overflow-y-auto max-h-[600px] text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold uppercase tracking-wider text-indigo-400">
                Keputusan & Rekomendasi Komite AI
              </span>
            </div>

            {!evalResult && !isEvaluating && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center space-y-2">
                <Gavel className="h-10 w-10 text-slate-700" />
                <p>Klik tombol <strong>"Jalankan Evaluasi Multi-Kriteria"</strong> untuk memproses rekomendasi pemenang lelang.</p>
              </div>
            )}

            {isEvaluating && (
              <div className="h-64 flex flex-col items-center justify-center text-indigo-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Menganalisis matriks skor dan anomali harga...</span>
              </div>
            )}

            {evalResult && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-950/60 border border-indigo-700/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase">
                    Pemenang Yang Direkomendasikan:
                  </span>
                  <div className="text-base font-black text-white">
                    {evalResult.recommendedWinner || evalResult.recommendedVendor}
                  </div>
                </div>

                <div>
                  <span className="text-indigo-400 font-bold block mb-1">RINGKASAN EKSEKUTIF:</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl">
                    {evalResult.summary || evalResult.executiveSummary}
                  </p>
                </div>

                {evalResult.justification && (
                  <div>
                    <span className="text-emerald-400 font-bold block mb-1">JUSTIFIKASI PEMILIHAN:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {evalResult.justification}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
