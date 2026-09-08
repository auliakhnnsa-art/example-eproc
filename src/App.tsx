import React, { useState, useEffect, useMemo } from "react";
import {
  PurchaseRequisition,
  RFQ,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  Vendor,
  VendorBid,
  UserRole,
} from "./types/procurement";
import {
  initialRequisitions,
  initialRFQs,
  initialPurchaseOrders,
  initialGoodsReceipts,
  initialVendors,
} from "./data/mockProcurementData";
import { initialInvoices } from "./data/mockInvoices";
import {
  getStoredRequisitions,
  getStoredRFQs,
  getStoredPurchaseOrders,
  getStoredGoodsReceipts,
  getStoredInvoices,
  getStoredVendors,
  getStoredActiveTab,
  getStoredCurrentRole,
  persistRequisitions,
  persistRFQs,
  persistPurchaseOrders,
  persistGoodsReceipts,
  persistInvoices,
  persistVendors,
  persistActiveTab,
  persistCurrentRole,
  resetAllProcurementData,
  clearAllProcurementData,
  loadSampleProcurementData,
} from "./services/storageService";

import { Navbar } from "./components/Navbar";
import { Sidebar, NavTab } from "./components/Sidebar";
import { DashboardOverview } from "./components/Dashboard/DashboardOverview";
import { PRListView } from "./components/Requisition/PRListView";
import { RFQListView } from "./components/Tendering/RFQListView";
import { POListView } from "./components/PurchaseOrder/POListView";
import { GRNListView } from "./components/GoodsReceipt/GRNListView";
import { GRNModal } from "./components/GoodsReceipt/GRNModal";
import { InvoiceListView } from "./components/Finance/InvoiceListView";
import { VendorListView } from "./components/Vendors/VendorListView";
import { CatalogView } from "./components/Catalog/CatalogView";
import { SpendAnalyticsView } from "./components/Analytics/SpendAnalyticsView";
import { AIProcurementHubView } from "./components/AIStudio/AIProcurementHubView";
import { AICopilotDrawer } from "./components/AICopilot/AICopilotDrawer";
import { RFQModal } from "./components/Tendering/RFQModal";
import { GoogleWorkspaceModal } from "./components/GoogleWorkspace/GoogleWorkspaceModal";
import { GoogleWorkspaceView } from "./components/GoogleWorkspace/GoogleWorkspaceView";

export default function App() {
  // Navigation & Role State with persistence across page refresh
  const [activeTab, setActiveTab] = useState<NavTab>(getStoredActiveTab);
  const [currentRole, setCurrentRole] = useState<UserRole>(getStoredCurrentRole);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  // Google Workspace Integration State
  const [isGoogleWorkspaceModalOpen, setIsGoogleWorkspaceModalOpen] = useState(false);
  const [googleWorkspaceInitialTab, setGoogleWorkspaceInitialTab] = useState<"sheets" | "docs" | "batch">("sheets");

  // Core P2P Domain State with persistence across page refresh
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>(getStoredRequisitions);
  const [rfqs, setRfqs] = useState<RFQ[]>(getStoredRFQs);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(getStoredPurchaseOrders);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(getStoredGoodsReceipts);
  const [invoices, setInvoices] = useState<Invoice[]>(getStoredInvoices);
  const [vendors, setVendors] = useState<Vendor[]>(getStoredVendors);

  // Automatic Persistence to LocalStorage on state updates
  useEffect(() => {
    persistRequisitions(requisitions);
  }, [requisitions]);

  useEffect(() => {
    persistRFQs(rfqs);
  }, [rfqs]);

  useEffect(() => {
    persistPurchaseOrders(purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    persistGoodsReceipts(goodsReceipts);
  }, [goodsReceipts]);

  useEffect(() => {
    persistInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    persistVendors(vendors);
  }, [vendors]);

  useEffect(() => {
    persistActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    persistCurrentRole(currentRole);
  }, [currentRole]);

  // Modals & Action States
  const [isCreatePRModalOpen, setIsCreatePRModalOpen] = useState(false);
  const [isCreateRFQModalOpen, setIsCreateRFQModalOpen] = useState(false);
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);
  const [targetPOForGRN, setTargetPOForGRN] = useState<PurchaseOrder | null>(null);
  const [rfqInitialPRData, setRfqInitialPRData] = useState<any>(null);

  const handleOpenGoogleWorkspace = (tab: "sheets" | "docs" | "batch" = "sheets") => {
    setGoogleWorkspaceInitialTab(tab);
    setIsGoogleWorkspaceModalOpen(true);
  };

  // Reset to default seed data
  const handleResetData = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengatur ulang data ke template awal? Semua data yang telah Anda input akan dikembalikan ke data default."
      )
    ) {
      resetAllProcurementData();
      setRequisitions(initialRequisitions);
      setRfqs(initialRFQs);
      setPurchaseOrders(initialPurchaseOrders);
      setGoodsReceipts(initialGoodsReceipts);
      setInvoices(initialInvoices);
      setVendors(initialVendors);
      setActiveTab("dashboard");
      setCurrentRole("procurement_officer");
    }
  };

  // Clear all procurement data to start from zero
  const handleClearAllData = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengosongkan semua data pengadaan? Semua data transaksi (PR, RFQ, PO, BAST, Faktur, Vendor) akan dikosongkan sehingga Anda dapat mulai menginput dari awal."
      )
    ) {
      clearAllProcurementData();
      setRequisitions([]);
      setRfqs([]);
      setPurchaseOrders([]);
      setGoodsReceipts([]);
      setInvoices([]);
      setVendors([]);
      setActiveTab("dashboard");
    }
  };

  // Load sample template data
  const handleLoadSampleData = () => {
    if (
      window.confirm(
        "Muat contoh data pengadaan untuk melihat simulasi alur transaksi lengkap?"
      )
    ) {
      loadSampleProcurementData();
      setRequisitions(initialRequisitions);
      setRfqs(initialRFQs);
      setPurchaseOrders(initialPurchaseOrders);
      setGoodsReceipts(initialGoodsReceipts);
      setInvoices(initialInvoices);
      setVendors(initialVendors);
    }
  };

  // Pending Count Calculation
  const pendingCount =
    requisitions.filter((r) => r.status === "PENDING_DEPT_HEAD" || r.status === "PENDING_PROCUREMENT").length +
    rfqs.filter((q) => q.status === "EVALUATION").length +
    invoices.filter((i) => i.status === "PENDING_AUDIT").length;

  // PR Actions
  const handleSavePR = (pr: PurchaseRequisition) => {
    setRequisitions((prev) => {
      const exists = prev.some((p) => p.id === pr.id);
      if (exists) {
        return prev.map((p) => (p.id === pr.id ? pr : p));
      }
      return [pr, ...prev];
    });
  };

  const handleApprovePR = (prId: string, note: string) => {
    setRequisitions((prev) =>
      prev.map((pr) => {
        if (pr.id === prId) {
          const nextStatus = currentRole === "approver_head" ? "APPROVED" : "APPROVED";
          return {
            ...pr,
            status: nextStatus,
            approvalHistory: [
              ...pr.approvalHistory,
              {
                stage: currentRole === "approver_head" ? "Dept Head Approval" : "Panitia Pengadaan Approval",
                approver: currentRole === "approver_head" ? "Ir. Hendra Wijaya (VP)" : "Panitia Pengadaan",
                status: "APPROVED",
                timestamp: new Date().toLocaleString("id-ID"),
                note: note || "Disetujui untuk pemrosesan tender RFQ.",
              },
            ],
          };
        }
        return pr;
      })
    );
  };

  const handleRejectPR = (prId: string, note: string) => {
    setRequisitions((prev) =>
      prev.map((pr) => {
        if (pr.id === prId) {
          return {
            ...pr,
            status: "REJECTED",
            approvalHistory: [
              ...pr.approvalHistory,
              {
                stage: "Review & Verification",
                approver: "Authorized Reviewer",
                status: "REJECTED",
                timestamp: new Date().toLocaleString("id-ID"),
                note: note || "Pengajuan ditolak / perlu revisi justifikasi.",
              },
            ],
          };
        }
        return pr;
      })
    );
  };

  const handleConvertToRFQ = (pr: PurchaseRequisition) => {
    setRfqInitialPRData({
      id: pr.id,
      prNumber: pr.prNumber,
      title: pr.title,
      category: pr.category,
      budget: pr.estimatedBudget,
      items: pr.items,
    });
    // Mark PR as CONVERTED
    setRequisitions((prev) =>
      prev.map((p) => (p.id === pr.id ? { ...p, status: "CONVERTED_TO_RFQ" } : p))
    );
    setIsCreateRFQModalOpen(true);
  };

  // RFQ Actions
  const handleSaveRFQ = (rfq: RFQ) => {
    setRfqs((prev) => {
      const exists = prev.some((q) => q.id === rfq.id);
      if (exists) {
        return prev.map((q) => (q.id === rfq.id ? rfq : q));
      }
      return [rfq, ...prev];
    });
    setActiveTab("rfq");
  };

  const handleSubmitBid = (rfqId: string, bid: VendorBid) => {
    setRfqs((prev) =>
      prev.map((rfq) => {
        if (rfq.id === rfqId) {
          return {
            ...rfq,
            status: "EVALUATION",
            bids: [...rfq.bids, bid],
          };
        }
        return rfq;
      })
    );
  };

  const handleAwardVendor = (rfqId: string, vendorId: string, vendorName: string) => {
    setRfqs((prev) =>
      prev.map((rfq) => {
        if (rfq.id === rfqId) {
          return {
            ...rfq,
            status: "AWARDED",
            awardedVendorId: vendorId,
            awardedVendorName: vendorName,
          };
        }
        return rfq;
      })
    );
  };

  // PO Creation from Awarded RFQ
  const handleCreatePOFromAwardedRFQ = (rfq: RFQ) => {
    const winnerBid = rfq.bids.find((b) => b.vendorId === rfq.awardedVendorId) || rfq.bids[0];
    const subtotal = winnerBid ? winnerBid.totalOfferPrice : rfq.hpsBudget;
    const ppnAmount = Math.round(subtotal * 0.11);
    const totalAmount = subtotal + ppnAmount;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO/PROC/2026/${new Date().getMonth() + 1}/${Math.floor(1000 + Math.random() * 9000)}`,
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      prNumber: rfq.prNumber,
      title: rfq.title,
      vendorId: rfq.awardedVendorId || "vnd-001",
      vendorName: rfq.awardedVendorName || "PT Rekanan Pemenang Tender",
      vendorEmail: "commercial@vendor.co.id",
      vendorAddress: "Kawasan Industri & Bisnis Terpadu, Jakarta",
      department: "IT & Infrastructure",
      issueDate: new Date().toISOString().split("T")[0],
      deliveryDeadline: "2026-10-15",
      paymentTerms: "Net 30 Days after BAST & Verified 3-Way Match",
      items: rfq.technicalSpecs.map((s, idx) => ({
        id: `poi-${idx}-${Date.now()}`,
        name: s.item,
        specification: s.specification,
        quantity: s.qty,
        unit: s.unit,
        unitPrice: s.hpsUnit,
        totalPrice: s.qty * s.hpsUnit,
      })),
      subtotal,
      ppnAmount,
      totalAmount,
      status: "ISSUED",
      signedBy: "Ir. Irwan Kurniawan (Procurement Director)",
      signedDate: new Date().toISOString().split("T")[0],
      notes: "Surat Pesanan Resmi mengikat kedua belah pihak.",
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    setActiveTab("po");
  };

  // GRN / BAST Actions
  const handleProceedToBAST = (po: PurchaseOrder) => {
    setTargetPOForGRN(po);
  };

  const handleSaveGRN = (grn: GoodsReceipt) => {
    setGoodsReceipts((prev) => {
      const exists = prev.some((g) => g.id === grn.id);
      if (exists) {
        return prev.map((g) => (g.id === grn.id ? grn : g));
      }
      return [grn, ...prev];
    });

    // Update PO status to COMPLETED
    if (targetPOForGRN) {
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === targetPOForGRN.id ? { ...po, status: "COMPLETED" } : po
        )
      );

      // Also generate draft Invoice for 3-Way Matching
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV/VND/2026/${Math.floor(1000 + Math.random() * 9000)}`,
        poNumber: targetPOForGRN.poNumber,
        grnNumber: grn.grnNumber,
        vendorName: targetPOForGRN.vendorName,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        amount: targetPOForGRN.totalAmount,
        taxInvoiceNumber: `010.000-26.${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: "MATCHED_OK",
        threeWayMatch: {
          poNumber: targetPOForGRN.poNumber,
          poAmount: targetPOForGRN.totalAmount,
          grnNumber: grn.grnNumber,
          grnAmount: targetPOForGRN.totalAmount,
          invoiceNumber: `INV/VND/2026/${Math.floor(1000 + Math.random() * 9000)}`,
          invoiceAmount: targetPOForGRN.totalAmount,
          status: "MATCHED",
          priceVariance: 0,
          qtyVariance: 0,
          aiAuditSummary: "PO = BAST (Lolos QC) = Faktur Pajak. Nilai rekonsiliasi 100% Cocok & Akurat.",
          aiRiskScore: 0,
        },
      };

      setInvoices((prev) => [newInvoice, ...prev]);
    }

    setTargetPOForGRN(null);
    setActiveTab("grn");
  };

  // Invoice & Payment Approval
  const handleApprovePayment = (invoiceId: string, note: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "PAID" } : inv))
    );
  };

  // Vendor Actions
  const handleSaveVendor = (v: Vendor) => {
    setVendors((prev) => {
      const exists = prev.some((item) => item.id === v.id);
      if (exists) {
        return prev.map((item) => (item.id === v.id ? v : item));
      }
      return [v, ...prev];
    });
  };

  // Delete Handlers for All Procurement Data Modules
  const handleDeletePR = (prId: string) => {
    setRequisitions((prev) => prev.filter((item) => item.id !== prId));
  };

  const handleDeleteRFQ = (rfqId: string) => {
    setRfqs((prev) => prev.filter((item) => item.id !== rfqId));
  };

  const handleDeletePO = (poId: string) => {
    setPurchaseOrders((prev) => prev.filter((item) => item.id !== poId));
  };

  const handleDeleteGRN = (grnId: string) => {
    setGoodsReceipts((prev) => prev.filter((item) => item.id !== grnId));
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((item) => item.id !== invoiceId));
  };

  const handleDeleteVendor = (vendorId: string) => {
    setVendors((prev) => prev.filter((item) => item.id !== vendorId));
  };

  // Dynamic Analytics Data derived strictly from current live state
  const analyticsData = useMemo(() => {
    const totalSpendYTD = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const totalHpsBudget = rfqs.reduce((sum, r) => sum + r.hpsBudget, 0);
    const savingsRealized = Math.max(0, totalHpsBudget > totalSpendYTD ? totalHpsBudget - totalSpendYTD : 0);

    // Dynamic category grouping
    const catMap: Record<string, number> = {};
    purchaseOrders.forEach((po) => {
      const cat = po.department || "Pengadaan Umum";
      catMap[cat] = (catMap[cat] || 0) + po.totalAmount;
    });

    const spendByCategory = Object.entries(catMap).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalSpendYTD > 0 ? Number(((amount / totalSpendYTD) * 100).toFixed(1)) : 0,
    }));

    // Vendor spend map
    const vendorMap: Record<string, number> = {};
    purchaseOrders.forEach((po) => {
      vendorMap[po.vendorName] = (vendorMap[po.vendorName] || 0) + po.totalAmount;
    });

    const topVendors = Object.entries(vendorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, spend]) => ({
        name,
        spend,
        sharePercentage: totalSpendYTD > 0 ? Number(((spend / totalSpendYTD) * 100).toFixed(1)) : 0,
      }));

    // Monthly trend calculated strictly from POs and RFQs
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthTrendMap: Record<string, { month: string; sortKey: string; budget: number; spend: number; savings: number }> = {};

    rfqs.forEach((r) => {
      const d = r.submissionDeadline || r.createdAt || "";
      if (!d) return;
      const [year, monthNum] = d.split("-");
      const idx = parseInt(monthNum, 10) - 1;
      const mName = monthNames[idx] || "Bln";
      const key = `${year}-${monthNum}`;
      if (!monthTrendMap[key]) {
        monthTrendMap[key] = { month: `${mName} ${year?.slice(2) || ""}`.trim(), sortKey: key, budget: 0, spend: 0, savings: 0 };
      }
      monthTrendMap[key].budget += r.hpsBudget;
    });

    purchaseOrders.forEach((po) => {
      const d = po.issueDate || "";
      if (!d) return;
      const [year, monthNum] = d.split("-");
      const idx = parseInt(monthNum, 10) - 1;
      const mName = monthNames[idx] || "Bln";
      const key = `${year}-${monthNum}`;
      if (!monthTrendMap[key]) {
        monthTrendMap[key] = { month: `${mName} ${year?.slice(2) || ""}`.trim(), sortKey: key, budget: 0, spend: 0, savings: 0 };
      }
      monthTrendMap[key].spend += po.totalAmount;
    });

    const monthlyTrend = Object.values(monthTrendMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((item) => ({
        month: item.month,
        budget: item.budget,
        spend: item.spend,
        savings: Math.max(0, item.budget - item.spend),
      }));

    return {
      totalSpendYTD,
      savingsRealized,
      totalActiveContracts: purchaseOrders.length,
      spendByCategory,
      monthlyTrend,
      topVendors,
    };
  }, [purchaseOrders, rfqs]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        onOpenGoogleWorkspace={() => handleOpenGoogleWorkspace("sheets")}
        pendingCount={pendingCount}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onResetData={handleResetData}
          onClearData={handleClearAllData}
          onLoadSampleData={handleLoadSampleData}
          counts={{
            pr: requisitions.filter((r) => r.status.startsWith("PENDING")).length,
            rfq: rfqs.filter((q) => q.status === "EVALUATION").length,
            po: purchaseOrders.filter((p) => p.status === "IN_PRODUCTION_DELIVERY" || p.status === "ISSUED").length,
            grn: goodsReceipts.length,
            matching: invoices.filter((i) => i.status === "PENDING_AUDIT" || i.status === "MATCHED_OK").length,
            vendors: vendors.length,
          }}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* View Switcher */}
            {activeTab === "dashboard" && (
              <DashboardOverview
                requisitions={requisitions}
                rfqs={rfqs}
                purchaseOrders={purchaseOrders}
                goodsReceipts={goodsReceipts}
                invoices={invoices}
                vendors={vendors}
                onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
                onCreatePR={() => {
                  setActiveTab("pr");
                  setIsCreatePRModalOpen(true);
                }}
                onOpenAICopilot={() => setIsAICopilotOpen(true)}
                onLoadSampleData={handleLoadSampleData}
              />
            )}

            {activeTab === "pr" && (
              <PRListView
                requisitions={requisitions}
                currentRole={currentRole}
                onSavePR={handleSavePR}
                onApprovePR={handleApprovePR}
                onRejectPR={handleRejectPR}
                onConvertToRFQ={handleConvertToRFQ}
                onDeletePR={handleDeletePR}
                isCreateModalOpen={isCreatePRModalOpen}
                setIsCreateModalOpen={setIsCreatePRModalOpen}
              />
            )}

            {activeTab === "rfq" && (
              <RFQListView
                rfqs={rfqs}
                vendors={vendors}
                currentRole={currentRole}
                onSaveRFQ={handleSaveRFQ}
                onSubmitBid={handleSubmitBid}
                onAwardVendor={handleAwardVendor}
                onCreatePOFromAwardedRFQ={handleCreatePOFromAwardedRFQ}
                onDeleteRFQ={handleDeleteRFQ}
                isCreateModalOpen={isCreateRFQModalOpen}
                setIsCreateModalOpen={setIsCreateRFQModalOpen}
              />
            )}

            {activeTab === "po" && (
              <POListView
                purchaseOrders={purchaseOrders}
                currentRole={currentRole}
                onProceedToBAST={handleProceedToBAST}
                onDeletePO={handleDeletePO}
                onOpenGoogleWorkspace={(tab) => handleOpenGoogleWorkspace(tab || "docs")}
              />
            )}

            {activeTab === "grn" && (
              <GRNListView
                goodsReceipts={goodsReceipts}
                onDeleteGRN={handleDeleteGRN}
              />
            )}

            {activeTab === "matching" && (
              <InvoiceListView
                invoices={invoices}
                currentRole={currentRole}
                onApprovePayment={handleApprovePayment}
                onDeleteInvoice={handleDeleteInvoice}
              />
            )}

            {activeTab === "vendors" && (
              <VendorListView
                vendors={vendors}
                onSaveVendor={handleSaveVendor}
                onDeleteVendor={handleDeleteVendor}
                isCreateModalOpen={isCreateVendorModalOpen}
                setIsCreateModalOpen={setIsCreateVendorModalOpen}
                onOpenGoogleWorkspace={(tab) => handleOpenGoogleWorkspace(tab || "sheets")}
              />
            )}

            {activeTab === "catalog" && (
              <CatalogView
                onSelectForPR={(item) => {
                  setActiveTab("pr");
                  setIsCreatePRModalOpen(true);
                }}
              />
            )}

            {activeTab === "analytics" && (
              <SpendAnalyticsView analyticsData={analyticsData} />
            )}

            {activeTab === "ai-studio" && <AIProcurementHubView />}

            {activeTab === "workspace" && (
              <GoogleWorkspaceView
                purchaseOrders={purchaseOrders}
                vendors={vendors}
                requisitions={requisitions}
                goodsReceipts={goodsReceipts}
                rfqs={rfqs}
                invoices={invoices}
              />
            )}
          </div>
        </main>
      </div>

      {/* Google Workspace Quick Action Modal */}
      <GoogleWorkspaceModal
        isOpen={isGoogleWorkspaceModalOpen}
        onClose={() => setIsGoogleWorkspaceModalOpen(false)}
        purchaseOrders={purchaseOrders}
        vendors={vendors}
        requisitions={requisitions}
        goodsReceipts={goodsReceipts}
        rfqs={rfqs}
        invoices={invoices}
        initialTab={googleWorkspaceInitialTab}
      />

      {/* GRN Modal triggered from PO list */}
      {targetPOForGRN && (
        <GRNModal
          isOpen={!!targetPOForGRN}
          targetPO={targetPOForGRN}
          onClose={() => setTargetPOForGRN(null)}
          onSaveGRN={handleSaveGRN}
        />
      )}

      {/* Converted RFQ Modal */}
      {isCreateRFQModalOpen && (
        <RFQModal
          isOpen={isCreateRFQModalOpen}
          initialPRData={rfqInitialPRData}
          onClose={() => {
            setIsCreateRFQModalOpen(false);
            setRfqInitialPRData(null);
          }}
          onSaveRFQ={handleSaveRFQ}
        />
      )}

      {/* ProcuraAI Enterprise Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        currentRole={currentRole}
      />
    </div>
  );
}
