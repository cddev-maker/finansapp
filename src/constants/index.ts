import type { Category } from "@/types";

export const CURRENCY_SYMBOL = "₺";
export const LOCALE          = "tr-TR";

export const CATEGORY_LABELS: Record<Category, string> = {
  VEHICLE_MAINTENANCE: "Araç Bakım Gideri",
  BUILDING_DUES:       "Bina Aidatı",
  DEBT:                "Borç",
  EDUCATION:           "Eğitim",
  ENTERTAINMENT:       "Eğlence",
  UTILITIES:           "Faturalar",
  HEALTHCARE:          "Sağlık",
  FUEL:                "Yakıt",
  GROCERIES:           "Market",
  SALARY:              "Maaş",
  EXPENSE_PAYMENT:     "Masraf Ödemesi",
  RENT:                "Kira",
  CREDIT_CARD:         "Kredi Kartı",
  LOAN_PAYMENT:        "Kredi Ödemesi",
  TRANSFER:            "Transfer",
  INVESTMENT:          "Yatırım",
  OTHER:               "Diğer",
};

export const CATEGORIES: Category[] = [
  "SALARY", "RENT", "GROCERIES", "UTILITIES", "FUEL",
  "CREDIT_CARD", "EDUCATION", "HEALTHCARE", "ENTERTAINMENT",
  "INVESTMENT", "TRANSFER", "OTHER",
];

export const PAYMENT_STATUS_LABELS = {
  PENDING:   "Beklemede",
  PAID:      "Ödendi",
  OVERDUE:   "Gecikmiş",
  CANCELLED: "İptal Edildi",
} as const;

export const CARD_NETWORK_LABELS = {
  VISA:       "Visa",
  MASTERCARD: "Mastercard",
  AMEX:       "American Express",
  TROY:       "Troy",
  OTHER:      "Diğer",
} as const;

export const MONTH_NAMES = [
  "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık",
];

export const MONTH_SHORT = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

export const CHART_COLORS = [
  "#6366f1","#f59e0b","#10b981","#3b82f6","#ef4444",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16",
  "#06b6d4","#a855f7",
];

export const CARD_COLORS = [
  "#6366f1","#10b981","#ef4444","#f59e0b","#3b82f6",
  "#8b5cf6","#ec4899","#14b8a6",
];

export const DEFAULT_PAGE_SIZE = 25;
export const REMINDER_THRESHOLDS = [7, 3, 0];
