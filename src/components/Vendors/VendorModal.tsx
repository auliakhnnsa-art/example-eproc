import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  ShieldCheck,
  Star,
  FileText,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  Send,
  Printer,
  Download,
  Check,
  CreditCard,
  Award,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { Vendor } from "../../types/procurement";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { exportVendorProfileDirectPDF, downloadElementAsPDF, triggerCleanPrint } from "../../utils/pdfExport";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVendor?: Vendor | null;
  onSaveVendor: (v: Vendor) => void;
  isEditInitially?: boolean;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  selectedVendor,
  onSaveVendor,
  isEditInitially = false,
}) => {
  const isExisting = !!selectedVendor;
  const [isEditing, setIsEditing] = useState(!isExisting || isEditInitially);
  const [activeTab, setActiveTab] = useState<"general" | "legal" | "finance" | "kpi">("general");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("IT & Infrastructure");
  const [status, setStatus] = useState<"ACTIVE_VERIFIED" | "PENDING_VERIFICATION" | "NEEDS_RENEWAL" | "BLACKLISTED">("ACTIVE_VERIFIED");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Jakarta Selatan");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("Bank Mandiri");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Hari (Setelah BAST Diterbitkan)");
  const [certificationsText, setCertificationsText] = useState("ISO 9001:2015, KBLI 62019");
  const [rating, setRating] = useState<number>(4.8);
  const [onTimeDeliveryRate, setOnTimeDeliveryRate] = useState<number>(98);
  const [complianceScore, setComplianceScore] = useState<number>(95);
  const [qualityPassRate, setQualityPassRate] = useState<number>(99);

  // Sync state when selectedVendor changes
  useEffect(() => {
    if (selectedVendor) {
      setName(selectedVendor.name || "");
      setCategory(selectedVendor.category || "IT & Infrastructure");
      setStatus(
        selectedVendor.status ||
          (selectedVendor.legalStatus as any) ||
          "ACTIVE_VERIFIED"
      );
      setNpwp(selectedVendor.npwp || "01.345.678.9-012.000");
      setNib(selectedVendor.nib || "9120003418291");
      setAddress(selectedVendor.address || "Jl. Jendral Sudirman Kav. 52-53");
      setCity(selectedVendor.city || "Jakarta Selatan");
      setEmail(selectedVendor.email || "info@vendor.co.id");
      setPhone(selectedVendor.phone || "+62 21 5290 8800");

      if (typeof selectedVendor.bankAccount === "object" && selectedVendor.bankAccount !== null) {
        setBankName(selectedVendor.bankAccount.bankName || "Bank Mandiri");
        setAccountNumber(selectedVendor.bankAccount.accountNumber || "124-00-8899120-1");
        setAccountHolder(selectedVendor.bankAccount.accountHolder || selectedVendor.name);
      } else if (typeof selectedVendor.bankAccount === "string") {
        setBankName("Bank Mandiri");
        setAccountNumber(selectedVendor.bankAccount || "124-00-8899120-1");
        setAccountHolder(selectedVendor.name || "PT Rekanan");
      }

      const certs = selectedVendor.certifications || ["ISO 9001:2015", "KBLI 62019", "Tanda Daftar Rekanan"];
      setCertificationsText(certs.join(", "));

      setRating(selectedVendor.rating || 4.8);
      setOnTimeDeliveryRate(selectedVendor.onTimeDeliveryRate || 95);
      setComplianceScore(selectedVendor.complianceScore || selectedVendor.performanceScore || 94);
      setQualityPassRate(selectedVendor.qualityPassRate || 98);
      setIsEditing(isEditInitially);
    } else {
      // New vendor blank form
      setName("");
      setCategory("IT & Infrastructure");
      setStatus("ACTIVE_VERIFIED");
      setNpwp("01.345.678.9-012.000");
      setNib("912000" + Math.floor(1000000 + Math.random() * 9000000));
      setAddress("Jl. TB Simatupang No. 88, Cilandak");
      setCity("Jakarta Selatan");
      setEmail("commercial@rekananbaru.co.id");
      setPhone("+62 21 7890 1234");
      setBankName("Bank Mandiri");
      setAccountNumber("124-00-" + Math.floor(1000000 + Math.random() * 9000000) + "-1");
      setAccountHolder("");
      setCertificationsText("ISO 9001:2015, KBLI 62019, SIUP / NIB OSS");
      setRating(4.8);
      setOnTimeDeliveryRate(98);
      setComplianceScore(96);
      setQualityPassRate(99);
      setIsEditing(true);
    }
  }, [selectedVendor, isEditInitially]);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (selectedVendor) {
      setIsExportingPDF(true);
      try {
        const success = await downloadElementAsPDF(
          "printable-vendor-document",
          `Profil-Vendor-${selectedVendor.vendorCode}.pdf`,
          { title: `Profil Rekanan - ${selectedVendor.name}` }
        );
        if (!success) {
          exportVendorProfileDirectPDF(selectedVendor);
        }
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error(err);
        exportVendorProfileDirectPDF(selectedVendor);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } finally {
        setIsExportingPDF(false);
      }
    }
  };

  const handlePrint = () => {
    triggerCleanPrint("printable-vendor-document", `Profil Rekanan ${selectedVendor?.name || ""}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const certArray = certificationsText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const updatedVendor: Vendor = {
      id: selectedVendor?.id || `vnd-${Date.now()}`,
      vendorCode: selectedVendor?.vendorCode || `VND-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      status,
      legalStatus: status as any,
      npwp: npwp.trim(),
      nib: nib.trim(),
      address: address.trim(),
      city: city.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bankAccount: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim() || name.trim(),
      },
      certifications: certArray.length > 0 ? certArray : ["ISO 9001:2015", "KBLI 62019"],
      rating: Number(rating) || 4.8,
      onTimeDeliveryRate: Number(onTimeDeliveryRate) || 98,
      qualityPassRate: Number(qualityPassRate) || 98,
      complianceScore: Number(complianceScore) || 95,
      performanceScore: Number(complianceScore) || 95,
      totalSpendYTD: selectedVendor?.totalSpendYTD || 0,
      activeContractsCount: selectedVendor?.activeContractsCount || 0,
      completedContractsCount: selectedVendor?.completedContractsCount || 0,
      joinedDate: selectedVendor?.joinedDate || new Date().toISOString().split("T")[0],
    };

    onSaveVendor(updatedVendor);
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display">
                  {!isExisting
                    ? "Registrasi & Verifikasi Rekanan Baru"
                    : isEditing
                    ? `Ubah Data Rekanan: ${name}`
                    : `Profil Rekanan: ${name}`}
                </h3>
                {selectedVendor && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 font-mono">
                    {selectedVendor.vendorCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {!isExisting
                  ? "Pendaftaran Master Vendor ke Database Terverifikasi (VMS)"
                  : "Database Terpusat Legalitas, Scorecard Kinerja & Profil Perbankan"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedVendor && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer transition-all"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Edit Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>PDF Tersimpan!</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>{isExportingPDF ? "Menyiapkan..." : "Unduh PDF"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (Screen Only) */}
        <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-2 print:hidden overflow-x-auto">
          {[
            { id: "general", label: "Identitas & Kontak", icon: Building2 },
            { id: "legal", label: "Legalitas & Kepatuhan", icon: ShieldCheck },
            { id: "finance", label: "Rekening Bank & Pajak", icon: CreditCard },
            { id: "kpi", label: "Scorecard KPI & Kinerja", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body & Printable Layout */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
          <div id="printable-vendor-document" className="p-6 sm:p-8 space-y-6 text-xs text-slate-900 bg-white">
            {/* Letterhead (Visible when printed / PDF) */}
            <div className="hidden print:flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <div className="space-y-1">
                <span className="text-base font-black text-slate-900">
                  PT ENTERPRISE KORPORA INDONESIA
                </span>
                <p className="text-[11px] text-slate-600">
                  Vendor Management System (VMS) - Lembar Profil & Kepatuhan Rekanan
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="font-bold text-blue-700">TERDAFTAR & TERVERIFIKASI</span>
                <div>Kode: {selectedVendor?.vendorCode || "VND-NEW"}</div>
              </div>
            </div>

            {/* TAB 1: IDENTITAS & KONTAK */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-800">
                      Nama Resmi Perusahaan (PT/CV/Firma) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: PT Solusi Teknologi Nusantara"
                      className="w-full px-3.5 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Kategori Bidang Usaha / Industri</label>
                    <select
                      disabled={!isEditing}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-medium disabled:bg-slate-50"
                    >
                      <option value="IT & Infrastructure">IT & Infrastructure</option>
                      <option value="Operasional & Logistik">Operasional & Logistik</option>
                      <option value="General Affairs & Fasilitas">General Affairs & Fasilitas</option>
                      <option value="Marketing & Digital">Marketing & Digital</option>
                      <option value="Konstruksi & Sipil">Konstruksi & Sipil</option>
                      <option value="Jasa Konsultasi & Legal">Jasa Konsultasi & Legal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Status Kemitraan Rekanan</label>
                    <select
                      disabled={!isEditing}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold disabled:bg-slate-50 text-slate-800"
                    >
                      <option value="ACTIVE_VERIFIED">Aktif & Terverifikasi (Verified 100%)</option>
                      <option value="PENDING_VERIFICATION">Masa Peninjauan / Due Diligence</option>
                      <option value="NEEDS_RENEWAL">Perlu Pembaruan Dokumen Legal</option>
                      <option value="BLACKLISTED">Blacklist / Ditangguhkan (Suspended)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Email Resmi Korespondensi</label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tender@perusahaan.co.id"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Nomor Telepon / Hotline</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 21 5290 8821"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-800">Alamat Kantor & Domisili Operasional</label>
                    <textarea
                      rows={2}
                      disabled={!isEditing}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Gedung / Kawasan Industri, Jalan, Kelurahan, Kecamatan"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Kota / Wilayah Domisili</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Jakarta Selatan"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Ketentuan Pembayaran (Payment Terms)</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Net 30 Hari"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LEGALITAS & KEPATUHAN */}
            {activeTab === "legal" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">
                      Nomor Pokok Wajib Pajak (NPWP 16 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                      placeholder="01.345.678.9-012.000"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">
                      Nomor Induk Berusaha (NIB OSS RBA) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={nib}
                      onChange={(e) => setNib(e.target.value)}
                      placeholder="9120003418291"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono disabled:bg-slate-50"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-800">
                      Sertifikasi, Akreditasi & Izin Usaha (Pisahkan dengan Koma)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={certificationsText}
                      onChange={(e) => setCertificationsText(e.target.value)}
                      placeholder="ISO 9001:2015, ISO 27001, KBLI 62019, SIUP"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Status Uji Tuntas Anti-Penyuapan & Pajak (ABAC)</span>
                    <p className="text-[11px] text-emerald-800">
                      Rekanan telah diverifikasi melalui sistem Ditjen Pajak (DJP) dan Portal OSS Kementerian Investasi RI. Tidak terdapat indikasi sanksi, pailit, atau daftar hitam nasional LKPP.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: KEUANGAN & REKENING BANK */}
            {activeTab === "finance" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Nama Bank Rekening</label>
                    <select
                      disabled={!isEditing}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold disabled:bg-slate-50"
                    >
                      <option value="Bank Mandiri">Bank Mandiri (Persero) Tbk</option>
                      <option value="Bank BCA">Bank Central Asia (BCA)</option>
                      <option value="Bank BNI">Bank Negara Indonesia (BNI)</option>
                      <option value="Bank BRI">Bank Rakyat Indonesia (BRI)</option>
                      <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                      <option value="Bank Danamon">Bank Danamon Indonesia</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Nomor Rekening Otorisasi</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="124-00-8899120-1"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold disabled:bg-slate-50"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-800">Nama Pemilik Rekening (Sesuai Buku Tabungan / Giro)</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Sesuai Akta Perusahaan (contoh: PT Nusantara Cloud Solusindo)"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Verifikasi Rekening untuk Pembayaran Otomatis Finance</span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Semua pencairan pembayaran Purchase Order dan Faktur Hasil 3-Way Match hanya akan disalurkan ke rekening resmi yang telah terdaftar di atas.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: SCORECARD KPI & KINERJA */}
            {activeTab === "kpi" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Rating Kepuasan</span>
                    <span className="font-bold text-amber-600 text-base flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span>{rating} / 5.0</span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">On-Time Delivery</span>
                    <span className="font-bold text-emerald-700 text-base font-mono">
                      {onTimeDeliveryRate}%
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Quality Pass Rate</span>
                    <span className="font-bold text-blue-700 text-base font-mono">
                      {qualityPassRate}%
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Compliance Score</span>
                    <span className="font-bold text-indigo-700 text-base font-mono">
                      {complianceScore}/100
                    </span>
                  </div>
                </div>

                {isEditing && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Rating (0-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">On-Time (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={onTimeDeliveryRate}
                        onChange={(e) => setOnTimeDeliveryRate(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Quality Pass (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={qualityPassRate}
                        onChange={(e) => setQualityPassRate(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Compliance (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={complianceScore}
                        onChange={(e) => setComplianceScore(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800 block text-xs">
                    Riwayat Transaksi & Nilai Kontrak
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total Belanja Pengadaan (YTD):</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatRupiah(selectedVendor?.totalSpendYTD || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Kontrak Berjalan Aktif:</span>
                    <span className="font-bold text-blue-700 font-mono">
                      {selectedVendor?.activeContractsCount || 1} Kontrak
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Order Selesai Tuntas:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {selectedVendor?.completedContractsCount || selectedVendor?.completedOrdersCount || 12} Order
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer transition-colors"
            >
              Tutup
            </button>

            {isEditing ? (
              <div className="flex items-center gap-2">
                {selectedVendor && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>{selectedVendor ? "Simpan Perubahan Data" : "Daftarkan & Verifikasi Rekanan"}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Edit3 className="h-4 w-4" />
                <span>Ubah Data Rekanan</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

