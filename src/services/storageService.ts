/**
 * Storage Service for SIAP / ProcureEdge System
 * Provides resilient, local persistence across page refreshes for all procurement domain data,
 * navigation state, and user roles.
 */

import {
  PurchaseRequisition,
  RFQ,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  Vendor,
  UserRole,
} from "../types/procurement";
import {
  initialRequisitions,
  initialRFQs,
  initialPurchaseOrders,
  initialGoodsReceipts,
  initialVendors,
} from "../data/mockProcurementData";
import { initialInvoices } from "../data/mockInvoices";
import { NavTab } from "../components/Sidebar";

const STORAGE_KEYS = {
  REQUISITIONS: "SAS_PROC_REQUISITIONS_V3",
  RFQS: "SAS_PROC_RFQS_V3",
  PURCHASE_ORDERS: "SAS_PROC_PURCHASE_ORDERS_V3",
  GOODS_RECEIPTS: "SAS_PROC_GOODS_RECEIPTS_V3",
  INVOICES: "SAS_PROC_INVOICES_V3",
  VENDORS: "SAS_PROC_VENDORS_V3",
  ACTIVE_TAB: "SAS_PROC_ACTIVE_TAB_V3",
  CURRENT_ROLE: "SAS_PROC_CURRENT_ROLE_V3",
  LAST_SAVED_AT: "SAS_PROC_LAST_SAVED_AT_V3",
};

/**
 * Safely reads a value from localStorage with fallback to default
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) {
      return defaultValue;
    }
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? (parsed as T) : defaultValue;
  } catch (error) {
    console.warn(`[StorageService] Failed to load key "${key}", using default:`, error);
    return defaultValue;
  }
}

/**
 * Safely writes a value to localStorage
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem(STORAGE_KEYS.LAST_SAVED_AT, new Date().toISOString());
  } catch (error) {
    console.warn(`[StorageService] Failed to save key "${key}":`, error);
  }
}

/**
 * Initializers for each procurement module with persistence.
 * Starts with empty arrays by default so dashboard strictly reflects inputted data.
 */
export const getStoredRequisitions = (): PurchaseRequisition[] =>
  loadFromStorage(STORAGE_KEYS.REQUISITIONS, []);

export const getStoredRFQs = (): RFQ[] =>
  loadFromStorage(STORAGE_KEYS.RFQS, []);

export const getStoredPurchaseOrders = (): PurchaseOrder[] =>
  loadFromStorage(STORAGE_KEYS.PURCHASE_ORDERS, []);

export const getStoredGoodsReceipts = (): GoodsReceipt[] =>
  loadFromStorage(STORAGE_KEYS.GOODS_RECEIPTS, []);

export const getStoredInvoices = (): Invoice[] =>
  loadFromStorage(STORAGE_KEYS.INVOICES, []);

export const getStoredVendors = (): Vendor[] =>
  loadFromStorage(STORAGE_KEYS.VENDORS, []);

export const getStoredActiveTab = (): NavTab =>
  loadFromStorage<NavTab>(STORAGE_KEYS.ACTIVE_TAB, "dashboard");

export const getStoredCurrentRole = (): UserRole =>
  loadFromStorage<UserRole>(STORAGE_KEYS.CURRENT_ROLE, "procurement_officer");

/**
 * Savers for each state
 */
export const persistRequisitions = (data: PurchaseRequisition[]) =>
  saveToStorage(STORAGE_KEYS.REQUISITIONS, data);

export const persistRFQs = (data: RFQ[]) =>
  saveToStorage(STORAGE_KEYS.RFQS, data);

export const persistPurchaseOrders = (data: PurchaseOrder[]) =>
  saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, data);

export const persistGoodsReceipts = (data: GoodsReceipt[]) =>
  saveToStorage(STORAGE_KEYS.GOODS_RECEIPTS, data);

export const persistInvoices = (data: Invoice[]) =>
  saveToStorage(STORAGE_KEYS.INVOICES, data);

export const persistVendors = (data: Vendor[]) =>
  saveToStorage(STORAGE_KEYS.VENDORS, data);

export const persistActiveTab = (tab: NavTab) =>
  saveToStorage(STORAGE_KEYS.ACTIVE_TAB, tab);

export const persistCurrentRole = (role: UserRole) =>
  saveToStorage(STORAGE_KEYS.CURRENT_ROLE, role);

/**
 * Clear all procurement domain data to empty arrays (start from zero)
 */
export function clearAllProcurementData(): void {
  saveToStorage(STORAGE_KEYS.REQUISITIONS, []);
  saveToStorage(STORAGE_KEYS.RFQS, []);
  saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, []);
  saveToStorage(STORAGE_KEYS.GOODS_RECEIPTS, []);
  saveToStorage(STORAGE_KEYS.INVOICES, []);
  saveToStorage(STORAGE_KEYS.VENDORS, []);
}

/**
 * Load sample template procurement data
 */
export function loadSampleProcurementData(): void {
  saveToStorage(STORAGE_KEYS.REQUISITIONS, initialRequisitions);
  saveToStorage(STORAGE_KEYS.RFQS, initialRFQs);
  saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, initialPurchaseOrders);
  saveToStorage(STORAGE_KEYS.GOODS_RECEIPTS, initialGoodsReceipts);
  saveToStorage(STORAGE_KEYS.INVOICES, initialInvoices);
  saveToStorage(STORAGE_KEYS.VENDORS, initialVendors);
}

/**
 * Reset all stored data back to default template
 */
export function resetAllProcurementData(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (err) {
    console.error("[StorageService] Error resetting storage:", err);
  }
}

/**
 * Returns whether custom data has been stored in localStorage
 */
export function hasCustomStoredData(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(STORAGE_KEYS.REQUISITIONS));
}
