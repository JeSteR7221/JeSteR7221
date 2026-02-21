import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format date
export function formatDate(date, locale = "tr-TR") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// Format time
export function formatTime(date, locale = "tr-TR") {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Format datetime
export function formatDateTime(date, locale = "tr-TR") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Calculate elapsed time
export function getElapsedTime(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diff = Math.floor((now - start) / 1000);
  
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

// Order status translations
export const orderStatusMap = {
  pending: { tr: "Bekliyor", en: "Pending" },
  preparing: { tr: "Hazırlanıyor", en: "Preparing" },
  ready: { tr: "Hazır", en: "Ready" },
  delivered: { tr: "Teslim Edildi", en: "Delivered" },
  cancelled: { tr: "İptal", en: "Cancelled" },
};

// Order type translations
export const orderTypeMap = {
  dine_in: { tr: "Masada", en: "Dine In" },
  takeaway: { tr: "Paket", en: "Takeaway" },
  delivery: { tr: "Teslimat", en: "Delivery" },
};

// Payment method translations
export const paymentMethodMap = {
  cash: { tr: "Nakit", en: "Cash" },
  card: { tr: "Kart", en: "Card" },
  split: { tr: "Bölünmüş", en: "Split" },
};

// Role translations
export const roleMap = {
  admin: { tr: "Yönetici", en: "Admin" },
  cashier: { tr: "Kasiyer", en: "Cashier" },
  kitchen: { tr: "Mutfak", en: "Kitchen" },
};

// Generate QR code URL
export function generateQRUrl(baseUrl, branchId, tableId) {
  return `${baseUrl}/qr/${branchId}/${tableId}`;
}

// Truncate text
export function truncate(text, length = 50) {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
