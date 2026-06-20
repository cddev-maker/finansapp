export type BankName =
  | "ING" | "GARANTI" | "ZIRAAT" | "VAKIFBANK"
  | "YAPI_KREDI" | "FINANSBANK" | "AKBANK";

export const BANK_LABELS: Record<BankName, string> = {
  ING:         "ING",
  GARANTI:     "Garanti BBVA",
  ZIRAAT:      "Ziraat Bankası",
  VAKIFBANK:   "VakıfBank",
  YAPI_KREDI:  "Yapı Kredi",
  FINANSBANK:  "QNB Finansbank",
  AKBANK:      "Akbank",
};

// Bankaların resmi web sitesi alan adları — logo bu adreslerden canlı çekilir
export const BANK_DOMAINS: Record<BankName, string> = {
  ING:         "ing.com.tr",
  GARANTI:     "garantibbva.com.tr",
  ZIRAAT:      "ziraatbank.com.tr",
  VAKIFBANK:   "vakifbank.com.tr",
  YAPI_KREDI:  "yapikredi.com.tr",
  FINANSBANK:  "qnbfinansbank.com",
  AKBANK:      "akbank.com",
};

export const BANKS: BankName[] = [
  "ING", "GARANTI", "ZIRAAT", "VAKIFBANK", "YAPI_KREDI", "FINANSBANK", "AKBANK",
];

// Google'ın herkese açık favicon servisi
export function getBankLogoUrl(bank: BankName): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${BANK_DOMAINS[bank]}`;
}
export type CardBrand =
  | "ING_KART" | "BONUS" | "MILES_SMILES" | "BANKKART"
  | "VAKIF_WORLD" | "WORLD" | "WORLD_GOLD" | "CARDFINANS"
  | "AXESS" | "WINGS";

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  ING_KART:     "ING Kart",
  BONUS:        "Bonus",
  MILES_SMILES: "Miles&Smiles",
  BANKKART:     "Bankkart",
  VAKIF_WORLD:  "World (VakıfBank)",
  WORLD:        "World",
  WORLD_GOLD:   "World Gold",
  CARDFINANS:   "CardFinans",
  AXESS:        "Axess",
  WINGS:        "Wings",
};

// Her bankaya bağlı kart markaları
export const BANK_CARD_BRANDS: Record<BankName, CardBrand[]> = {
  ING:         ["ING_KART"],
  GARANTI:     ["BONUS", "MILES_SMILES"],
  ZIRAAT:      ["BANKKART"],
  VAKIFBANK:   ["VAKIF_WORLD"],
  YAPI_KREDI:  ["WORLD", "WORLD_GOLD"],
  FINANSBANK:  ["CARDFINANS"],
  AKBANK:      ["AXESS", "WINGS"],
};
