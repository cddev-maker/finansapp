import { NextRequest } from "next/server";
import { withAuth, ok, badRequest, serverError } from "@/lib/api-helpers";
import { fetchPriceHistory, type TimeRange } from "@/lib/market-data";

const VALID_RANGES: TimeRange[] = ["1day", "1week", "1month", "1year"];

export const GET = withAuth(async (_userId, req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type   = searchParams.get("type");
    const symbol = searchParams.get("symbol");
    const range  = (searchParams.get("range") ?? "1month") as TimeRange;

    if (!type || !symbol) return badRequest("type ve symbol parametreleri gerekli");
    if (!VALID_RANGES.includes(range)) return badRequest("Geçersiz zaman aralığı");

    const history = await fetchPriceHistory(type, symbol, range);
    return ok(history);
  } catch (err) {
    return serverError(err);
  }
});
