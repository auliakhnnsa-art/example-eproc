export type UserRole =
  | "procurement_officer"
  | "department_requester"
  | "approver_head"
  | "finance_auditor"
  | "vendor";

export type Department =
  | "IT & Infrastructure"
  | "Operasional & Logistik"
  | "General Affairs & Fasilitas"
  | "Marketing & Digital"
  | "Human Capital"
  | "Finance & Komersial";

export type PRStatus =
  | "DRAFT"
  | "PENDING_DEPT_HEAD"
  | "PENDING_PROCUREMENT"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_RFQ";

export interface PRItem {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  title: string;
  department: Department;
  requesterName: string;
  requesterEmail: string;
  category: string;
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  justification: string;
  estimatedBudget: number;
  items: PRItem[];
  status: PRStatus;
  submissionDate: string;
  targetDeliveryDate: string;
  approvalHistory: {
    stage: string;
    approver: string;
    status: "APPROVED" | "REJECTED" | "PENDING";
    timestamp?: string;
    note?: string;
  }[];
  generatedRFQId?: string;
}

export type TenderType = "OPEN_TENDER" | "LIMITED_TENDER" | "DIRECT_SOURCING";
export type RFQStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "EVALUATION"
  | "AWARDED"
  | "CANCELLED";

export interface VendorBid {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  totalOfferPrice: number;
  leadTimeDays: number;
  warrantyMonths: number;
  technicalScore: number;
  priceScore: number;
  overallScore: number;
  complianceStatus: "VERIFIED" | "CONDITIONAL" | "DISQUALIFIED";
  submittedAt: string;
  notes: string;
  bidItems?: {
    itemId: string;
    itemName: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  prId?: string;
  prNumber?: string;
  category: string;
  tenderType: TenderType;
  hpsBudget: number;
  status: RFQStatus;
  publishedDate: string;
  submissionDeadline: string;
  technicalSpecs: {
    item: string;
    specification: string;
    unit: string;
    qty: number;
    hpsUnit: number;
  }[];
  requirements: string[];
  evaluationWeights: {
    administrative: number;
    technical: number;
    price: number;
  };
  bids: VendorBid[];
  awardedVendorId?: string;
  awardedVendorName?: string;
  aiEvaluationResult?: {
    summary: string;
    recommendedVendor: string;
    anomalies: string[];
    justification: string;
  };
}

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  category: string;
  status?: "ACTIVE_VERIFIED" | "PENDING_VERIFICATION" | "NEEDS_RENEWAL" | "BLACKLISTED";
  legalStatus?: "VERIFIED" | "PENDING_VERIFICATION" | "NEEDS_RENEWAL" | "BLACKLISTED";
  npwp: string;
  nib: string;
  email: string;
  phone: string;
  city?: string;
  address: string;
  bankAccount:
    | string
    | {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
      };
  rating: number; // 0-5
  performanceScore?: number; // 0-100
  onTimeDeliveryRate: number; // %
  qualityPassRate?: number; // %
  complianceScore?: number; // 0-100
  certifications?: string[];
  totalSpendYTD?: number;
  activeContractsCount?: number;
  completedOrdersCount?: number;
  completedContractsCount?: number;
  establishedYear?: number;
  joinedDate?: string;
}

export type POStatus =
  | "ISSUED"
  | "ACCEPTED_BY_VENDOR"
  | "IN_PRODUCTION_DELIVERY"
  | "PARTIALLY_DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface POItem {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  rfqId?: string;
  rfqNumber?: string;
  prNumber?: string;
  title: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorAddress: string;
  department: Department;
  issueDate: string;
  deliveryDeadline: string;
  paymentTerms: string; // e.g. "Net 30 Days after BAST"
  items: POItem[];
  subtotal: number;
  ppnAmount: number; // 11%
  totalAmount: number;
  status: POStatus;
  signedBy: string;
  signedDate: string;
  notes: string;
}

export interface GRNItem {
  id: string;
  poItemId: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  conditionNote: string;
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  vendorName: string;
  receiptDate: string;
  receivedBy: string;
  warehouseLocation: string;
  deliveryNoteNumber: string; // Surat Jalan vendor
  inspectionStatus: "PASSED" | "PASSED_WITH_EXCEPTION" | "REJECTED";
  items: GRNItem[];
  inspectorNotes: string;
  bastSigned: boolean;
}

export interface ThreeWayMatchResult {
  poNumber: string;
  poAmount: number;
  grnNumber: string;
  grnAmount: number;
  invoiceNumber: string;
  invoiceAmount: number;
  status: "MATCHED" | "MISMATCH" | "PENDING";
  priceVariance: number;
  qtyVariance: number;
  aiAuditSummary?: string;
  aiRiskScore?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  grnNumber: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  taxInvoiceNumber?: string;
  status: "PENDING_AUDIT" | "MATCHED_OK" | "VARIANCE_HOLD" | "PAID";
  threeWayMatch: ThreeWayMatchResult;
}

export type MatchingStatus = "MATCHED" | "DISCREPANCY" | "NEEDS_REVIEW" | "PAID";

export interface ThreeWayMatchRecord {
  id: string;
  matchCode: string;
  poId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poTotal: number;
  grnCalculatedTotal: number;
  invoiceTotal: number;
  varianceAmount: number;
  matchingStatus: MatchingStatus;
  taxPpnVerified: boolean;
  notes: string;
  aiAuditNotes?: string;
  paymentReleaseApproved: boolean;
  paymentDate?: string;
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  referenceHPS: number;
  leadTimeDays: number;
  preferredVendor: string;
  stockStatus: "AVAILABLE" | "ORDER_ON_DEMAND" | "RESTRICTED";
}

export interface SpendAnalyticsSummary {
  totalSpendYTD: number;
  totalBudgetAllocated: number;
  costSavingsYTD: number;
  savingsRatePercentage: number;
  activePRCount: number;
  activeRFQCount: number;
  activePOCount: number;
  completed3WayMatchCount: number;
  vendorCount: number;
}
