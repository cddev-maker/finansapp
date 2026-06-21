/**
 * src/lib/market-data.ts
 * Twelve Data API üzerinden hisse, döviz ve altın fiyatlarını çeker.
 * TEFAS'tan Türk yatırım fonu fiyatlarını çeker.
 */

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

interface TwelveDataPriceResponse {
  price?: string;
  code?: number;
  message?: string;
}

interface TwelveDataTimeSeriesResponse {
  values?: { datetime: string; close: string }[];
  status?: string;
  code?: number;
  message?: string;
}

// ─── Symbol mapping helpers ───────────────────────────────────────────────────

/**
 * Yatırım tipine göre Twelve Data'nın anladığı sembol formatına çevirir.
 */
export function toTwelveDataSymbol(type: string, symbol: string): string {
  switch (type) {
    case "STOCK_TR":
      return `${symbol}:BIST`; // örn: THYAO:BIST
    case "STOCK_US":
      return symbol; // örn: AAPL
    case "GOLD":
      return "XAU/TRY"; // gram altın / TRY karşılığı
    case "CURRENCY":
      return symbol; // örn: USD/TRY, EUR/TRY
    default:
      return symbol;
  }
}

// ─── Live price fetch (Twelve Data) ──────────────────────────────────────────

export async function fetchTwelveDataPrice(symbol: string): Promise<number | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    console.error("[market-data] TWELVE_DATA_API_KEY tanımlı değil");
    return null;
  }

  try {
    const url = `${TWELVE_DATA_BASE}/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    const json: TwelveDataPriceResponse = await res.json();

    if (json.code || !json.price) {
      console.error(`[market-data] ${symbol} fiyatı alınamadı:`, json.message ?? "bilinmeyen hata");
      return null;
    }

    return parseFloat(json.price);
  } catch (err) {
    console.error(`[market-data] ${symbol} fiyat isteği başarısız:`, err);
    return null;
  }
}

// ─── Historical price fetch (for trend charts) ───────────────────────────────

export type TimeRange = "1day" | "1week" | "1month" | "1year";

const RANGE_CONFIG: Record<TimeRange, { interval: string; outputsize: number }> = {
  "1day":   { interval: "5min", outputsize: 78 },   // ~ trading day in 5-min candles
  "1week":  { interval: "1h",   outputsize: 40 },
  "1month": { interval: "1day", outputsize: 30 },
  "1year":  { interval: "1week", outputsize: 52 },
};

export async function fetchTwelveDataHistory(
  symbol: string,
  range: TimeRange
): Promise<{ date: string; price: number }[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return [];

  const { interval, outputsize } = RANGE_CONFIG[range];

  try {
    const url = `${TWELVE_DATA_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    const json: TwelveDataTimeSeriesResponse = await res.json();

    if (json.code || !json.values) {
      console.error(`[market-data] ${symbol} geçmiş veri alınamadı:`, json.message ?? "bilinmeyen hata");
      return [];
    }

    return json.values
      .map((v) => ({ date: v.datetime, price: parseFloat(v.close) }))
      .reverse(); // eskiden yeniye sırala
  } catch (err) {
    console.error(`[market-data] ${symbol} geçmiş veri isteği başarısız:`, err);
    return [];
  }
}

// ─── TEFAS fund price fetch ───────────────────────────────────────────────────

interface TefasResponseRow {
  TARIH: string;
  FONKODU: string;
  FONUNVAN: string;
  FIYAT: number;
}

/**
 * TEFAS'ın herkese açık BindHistoryInfo endpoint'inden fon fiyatını çeker.
 * fundCode örn: "AFA", "TGE", "IPJ" gibi 2-4 harfli TEFAS fon kodları.
 */
export async function fetchTefasFundPrice(fundCode: string): Promise<number | null> {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7); // son 7 gün içindeki en güncel fiyat

    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

    const body = new URLSearchParams({
      fontip: "YAT",
      bastarih: fmt(start),
      bittarih: fmt(today),
      fonkod: fundCode,
    });

    const res = await fetch("https://www.tefas.gov.tr/api/DB/BindHistoryInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const json = await res.json();
    const rows: TefasResponseRow[] = json?.data ?? [];

    if (rows.length === 0) return null;

    // En son tarihli satırı al
    const latest = rows.sort((a, b) => new Date(b.TARIH).getTime() - new Date(a.TARIH).getTime())[0];
    return latest.FIYAT;
  } catch (err) {
    console.error(`[market-data] TEFAS fon fiyatı alınamadı (${fundCode}):`, err);
    return null;
  }
}

export async function fetchTefasFundHistory(
  fundCode: string,
  days: number
): Promise<{ date: string; price: number }[]> {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - days);

    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

    const body = new URLSearchParams({
      fontip: "YAT",
      bastarih: fmt(start),
      bittarih: fmt(today),
      fonkod: fundCode,
    });

    const res = await fetch("https://www.tefas.gov.tr/api/DB/BindHistoryInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const json = await res.json();
    const rows: TefasResponseRow[] = json?.data ?? [];

    return rows
      .sort((a, b) => new Date(a.TARIH).getTime() - new Date(b.TARIH).getTime())
      .map((r) => ({ date: r.TARIH, price: r.FIYAT }));
  } catch (err) {
    console.error(`[market-data] TEFAS geçmiş veri alınamadı (${fundCode}):`, err);
    return [];
  }
}

// ─── Unified price fetcher ────────────────────────────────────────────────────

const TROY_OUNCE_IN_GRAMS = 31.1035;

async function fetchGoldPriceTRY(): Promise<number | null> {
  const [xauUsd, usdTry] = await Promise.all([
    fetchTwelveDataPrice("XAU/USD"),
    fetchTwelveDataPrice("USD/TRY"),
  ]);

  if (xauUsd === null || usdTry === null) return null;

  // Ons fiyatını grama çevir, sonra TRY'ye çevir
  return (xauUsd / TROY_OUNCE_IN_GRAMS) * usdTry;
}

export async function fetchCurrentPrice(type: string, symbol: string): Promise<number | null> {
  if (type === "FUND") {
    return fetchTefasFundPrice(symbol);
  }
  if (type === "GOLD") {
    return fetchGoldPriceTRY();
  }
  const tdSymbol = toTwelveDataSymbol(type, symbol);
  return fetchTwelveDataPrice(tdSymbol);
}

export async function fetchPriceHistory(
  type: string,
  symbol: string,
  range: TimeRange
): Promise<{ date: string; price: number }[]> {
  if (type === "FUND") {
    const daysMap: Record<TimeRange, number> = { "1day": 3, "1week": 7, "1month": 30, "1year": 365 };
    return fetchTefasFundHistory(symbol, daysMap[range]);
  }
  const tdSymbol = toTwelveDataSymbol(type, symbol);
  return fetchTwelveDataHistory(tdSymbol, range);
}
