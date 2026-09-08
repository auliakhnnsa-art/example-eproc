import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Lightbulb,
  FileCheck,
  ShieldCheck,
  TrendingDown,
  HelpCircle,
} from "lucide-react";
import { UserRole } from "../../types/procurement";

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "ai",
      text: "Halo! Saya **ProcuraAI Enterprise Specialist** Anda. Saya siap membantu Anda menyusun Kerangka Acuan Kerja (KAK), menganalisis kewajaran HPS, mengevaluasi proposal lelang, mengaudit 3-Way Matching, maupun menyusun strategi efisiensi anggaran belanja korporasi.",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          query,
          message: query,
          context: {
            userRole: currentRole,
            company: "PT Enterprise Korpora Indonesia",
            currentFiscalYear: "2026",
          },
        }),
      });

      if (!res.ok) throw new Error("Gagal terhubung ke AI Advisor");
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer || data.reply || data.response || "Maaf, tidak dapat menghasilkan jawaban saat ini.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "Terjadi kendala saat menghubungi AI Specialist. Silakan coba lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Bagaimana kriteria evaluasi teknis untuk tender pengadaan Cloud Server?",
    "Jelaskan prinsip 3-Way Matching dan cara mitigasi fraud faktur fiktif.",
    "Bagaimana cara menghitung Harga Perkiraan Sendiri (HPS) yang akurat?",
    "Strategi negosiasi harga terbaik dengan vendor tunggal (Sole Source).",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display flex items-center gap-2">
                <span>ProcuraAI Enterprise Specialist</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-normal">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Konsultan AI Pengadaan & Audit Kepatuhan
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

        {/* Message Thread */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-indigo-400 border border-slate-700"
                }`}
              >
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 shadow-xs space-y-1 ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none leading-relaxed"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {msg.text}
                </div>
                <span
                  className={`block text-[10px] text-right ${
                    msg.sender === "user" ? "text-indigo-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-xl bg-slate-900 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-slate-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span className="text-xs">Menganalisis regulasi & best practice...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Prompts */}
        <div className="p-3 bg-white border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>Topik Cepat:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-left transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tanyakan analisis regulasi, KAK, HPS, atau audit..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
