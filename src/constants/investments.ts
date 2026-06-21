import type { InvestmentType } from "@/types";

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  STOCK_TR: "Hisse Senedi (BIST)",
  STOCK_US: "Hisse Senedi (ABD)",
  GOLD:     "Altın",
  CURRENCY: "Döviz",
  FUND:     "Yatırım Fonu (TEFAS)",
};

export const INVESTMENT_TYPE_ICONS: Record<InvestmentType, string> = {
  STOCK_TR: "📈",
  STOCK_US: "🇺🇸",
  GOLD:     "🥇",
  CURRENCY: "💱",
  FUND:     "🏦",
};

export const INVESTMENT_TYPES: InvestmentType[] = ["STOCK_TR", "STOCK_US", "GOLD", "CURRENCY", "FUND"];

// Altın türleri (gram bazlı) — kullanıcı seçer, sembol her zaman XAU/TRY olarak Twelve Data'ya gider
export const GOLD_UNITS = [
  { value: "GRAM",   label: "Gram Altın",     gramEquivalent: 1 },
  { value: "CEYREK",  label: "Çeyrek Altın",   gramEquivalent: 1.75 },
  { value: "YARIM",   label: "Yarım Altın",    gramEquivalent: 3.5 },
  { value: "TAM",     label: "Tam Altın",      gramEquivalent: 7.0 },
  { value: "CUMHURIYET", label: "Cumhuriyet Altını", gramEquivalent: 7.2 },
];

// Sık kullanılan döviz çiftleri
export const CURRENCY_PAIRS = [
  { value: "USD/TRY", label: "Amerikan Doları (USD)" },
  { value: "EUR/TRY", label: "Euro (EUR)" },
  { value: "GBP/TRY", label: "İngiliz Sterlini (GBP)" },
  { value: "CHF/TRY", label: "İsviçre Frangı (CHF)" },
  { value: "JPY/TRY", label: "Japon Yeni (JPY)" },
];

// Popüler BIST hisseleri (örnek liste — kullanıcı serbest de yazabilir)
export const POPULAR_BIST_STOCKS = [
  { value: "THYAO", label: "Türk Hava Yolları" },
  { value: "GARAN", label: "Garanti BBVA" },
  { value: "ASELS", label: "Aselsan" },
  { value: "AKBNK", label: "Akbank" },
  { value: "EREGL", label: "Ereğli Demir Çelik" },
  { value: "SISE",  label: "Şişecam" },
  { value: "KCHOL", label: "Koç Holding" },
  { value: "BIMAS", label: "BİM" },
  { value: "TUPRS", label: "Tüpraş" },
  { value: "SAHOL", label: "Sabancı Holding" },
];

// Popüler ABD hisseleri
export const POPULAR_US_STOCKS = [
  { value: "AAPL", label: "Apple" },
  { value: "MSFT", label: "Microsoft" },
  { value: "GOOGL", label: "Alphabet (Google)" },
  { value: "AMZN", label: "Amazon" },
  { value: "TSLA", label: "Tesla" },
  { value: "NVDA", label: "NVIDIA" },
  { value: "META", label: "Meta" },
];

export const TIME_RANGE_LABELS = {
  "1day":   "1 Gün",
  "1week":  "1 Hafta",
  "1month": "1 Ay",
  "1year":  "1 Yıl",
} as const;
