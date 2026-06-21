import { prisma } from "@/lib/prisma";
import { withAuth, ok, serverError } from "@/lib/api-helpers";
import { fetchCurrentPrice } from "@/lib/market-data";

export const POST = withAuth(async (userId) => {
  try {
    const investments = await prisma.investment.findMany({
      where:  { userId },
      select: { id: true, type: true, symbol: true },
    });

    let updated = 0;
    let failed  = 0;

    // Aynı sembolü tekrar tekrar çekmemek için önbellek
    const priceCache = new Map<string, number | null>();

    for (const inv of investments) {
      const cacheKey = `${inv.type}:${inv.symbol}`;
      let price: number | null;

      if (priceCache.has(cacheKey)) {
        price = priceCache.get(cacheKey)!;
      } else {
        price = await fetchCurrentPrice(inv.type, inv.symbol);
        priceCache.set(cacheKey, price);
      }

      if (price !== null) {
        await prisma.investment.update({
          where: { id: inv.id },
          data:  { currentPrice: price, priceUpdatedAt: new Date() },
        });
        updated++;
      } else {
        failed++;
      }
    }

    return ok({ updated, failed, total: investments.length });
  } catch (err) {
    return serverError(err);
  }
});
