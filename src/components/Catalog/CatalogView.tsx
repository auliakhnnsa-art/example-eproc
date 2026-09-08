import React, { useState } from "react";
import {
  Layers,
  Search,
  Filter,
  Sparkles,
  DollarSign,
  Building2,
  CheckCircle2,
  FileText,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { formatRupiah, formatShortRupiah } from "../../utils/formatters";

interface CatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  standardPriceHPS: number;
  marketPriceRange: string;
  recommendedVendor: string;
  tkdnPercentage?: number; // Tingkat Komponen Dalam Negeri
  greenProcurement?: boolean;
}

const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: "cat-1",
    code: "CAT-IT-001",
    name: "Laptop Business Enterprise 14-inch Core i7 32GB RAM",
    category: "IT & Infrastructure",
    specification: "Intel Core i7-1370P vPro, 32GB DDR5, 1TB NVMe Gen4, W11 Pro, Garansi 3 Tahun Onsite NBD",
    unit: "Unit",
    standardPriceHPS: 24500000,
    marketPriceRange: "Rp 23.500.000 - Rp 25.800.000",
    recommendedVendor: "PT Mitra Solusi Informatika",
    tkdnPercentage: 42.5,
    greenProcurement: true,
  },
  {
    id: "cat-2",
    code: "CAT-IT-002",
    name: "Server Rack 2U Dual Xeon Silver 64-Core",
    category: "IT & Infrastructure",
    specification: "Dual Intel Xeon Silver 4410Y, 128GB ECC DDR5, 4x 1.92TB Enterprise NVMe SSD, Redundant 800W PSU",
    unit: "Unit",
    standardPriceHPS: 98000000,
    marketPriceRange: "Rp 94.000.000 - Rp 105.000.000",
    recommendedVendor: "PT Mitra Solusi Informatika",
    tkdnPercentage: 35.0,
    greenProcurement: true,
  },
  {
    id: "cat-3",
    code: "CAT-LOG-001",
    name: "Forklift Elektrik Lithium 2.5 Ton",
    category: "Operasional & Logistik",
    specification: "Kapasitas angkat 2.500 kg, Mast Triplex 4.8 meter, Baterai Li-Ion 48V 400Ah Fast Charging",
    unit: "Unit",
    standardPriceHPS: 185000000,
    marketPriceRange: "Rp 175.000.000 - Rp 195.000.000",
    recommendedVendor: "PT Prima Sarana Logistik",
    tkdnPercentage: 38.0,
    greenProcurement: true,
  },
  {
    id: "cat-4",
    code: "CAT-SEC-001",
    name: "Jasa Pengamanan Satpam & Patroli Terpadu (Security Guard)",
    category: "Jasa Profesional",
    specification: "Personil tersertifikasi Gada Pratama/Madya, Seragam PDH/PDL lengkap, Asuransi BPJS TK & Kesehatan, Pengawasan 24/7",
    unit: "Orang/Bulan",
    standardPriceHPS: 6200000,
    marketPriceRange: "Rp 5.800.000 - Rp 6.500.000",
    recommendedVendor: "PT Multi Karya Facility Services",
    tkdnPercentage: 90.0,
    greenProcurement: false,
  },
  {
    id: "cat-5",
    code: "CAT-GA-001",
    name: "Kursi Kerja Ergonomis Mesh Jaring BIFMA",
    category: "General Affairs & Fasilitas",
    specification: "Lumbar Support Adjustable, 3D Armrest, Gaslift Class 4, Castor PU Anti Gores Lantai, Sertifikasi BIFMA",
    unit: "Unit",
    standardPriceHPS: 1850000,
    marketPriceRange: "Rp 1.650.000 - Rp 2.100.000",
    recommendedVendor: "CV Sukses Mandiri Office",
    tkdnPercentage: 55.0,
    greenProcurement: true,
  },
];

interface CatalogViewProps {
  onSelectForPR?: (item: CatalogItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onSelectForPR }) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredItems = catalog.filter((item) => {
    const matchesCat = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              E-Katalog & Standar Biaya Masukan (HPS)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              {catalog.length} Master Item
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standar acuan harga perkiraan sendiri (HPS), sertifikasi TKDN, dan benchmark pasar terverifikasi.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, kode katalog, atau spesifikasi..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent border-0 font-medium text-slate-800 focus:ring-0 cursor-pointer pr-4"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="IT & Infrastructure">IT & Infrastructure</option>
            <option value="Operasional & Logistik">Operasional & Logistik</option>
            <option value="General Affairs & Fasilitas">General Affairs & Fasilitas</option>
            <option value="Jasa Profesional">Jasa Profesional</option>
          </select>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {item.code}
                </span>
                {item.tkdnPercentage && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    TKDN: {item.tkdnPercentage}%
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {item.name}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {item.specification}
              </p>

              {/* Price & Vendor Box */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Standar Pagu HPS:
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(item.standardPriceHPS)} / {item.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Benchmark Pasar:</span>
                  <span className="text-slate-700 font-medium">{item.marketPriceRange}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
                Rekanan: {item.recommendedVendor.split(" ")[1]}
              </span>

              {onSelectForPR && (
                <button
                  onClick={() => onSelectForPR(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Pakai di PR</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
