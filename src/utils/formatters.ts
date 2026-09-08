export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(0)} Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case "APPROVED":
    case "VERIFIED":
    case "PASSED":
    case "COMPLETED":
    case "PAID":
    case "AWARDED":
    case "AVAILABLE":
      return { label: status, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    
    case "PENDING_DEPT_HEAD":
    case "PENDING_PROCUREMENT":
    case "PENDING_VERIFICATION":
    case "EVALUATION":
    case "IN_PRODUCTION_DELIVERY":
    case "AUDITING":
    case "NEEDS_REVIEW":
    case "ORDER_ON_DEMAND":
      return { label: status, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };

    case "PUBLISHED":
    case "ISSUED":
    case "ACCEPTED_BY_VENDOR":
    case "MATCHED":
      return { label: status, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };

    case "DRAFT":
      return { label: status, bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };

    case "REJECTED":
    case "CANCELLED":
    case "BLACKLISTED":
    case "DISCREPANCY":
    case "RESTRICTED":
      return { label: status, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };

    default:
      return { label: status, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  }
}
