import { prisma } from "@/lib/prisma";
import { createInvestmentSchema } from "@/lib/validations";
import { withAuth, ok, created, badRequest, serverError } from "@/lib/api-helpers";
import { fetchCurrentPrice } from "@/lib/market-data";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(inv: {
  id: string; userId: string; type: string; symbol: string; name: string;
  quantity: Decimal; buyPrice: Decimal; buyDate: Date;
  currentPrice: Decimal | null; priceUpdatedAt: Date | null;
  notes: string | null; createdAt: Date; updatedAt: Date;
}) {
  const quantity     = Number(inv.quantity);
  const buyPrice     = Number(inv.buyPrice);
  const currentPrice = inv.currentPrice ? Number(inv.currentPrice) : null;
  const totalCost    = quantity * buyPrice;
  const currentValue = currentPrice !== null ? quantity * currentPrice : null;
  const profitLoss   = currentValue !== null ? currentValue - totalCost : null;
  const profitLossPct = currentValue !== null && totalCost > 0 ? (profitLoss! / totalCost) * 100 : null;

  return {
    ...inv,
    quantity,
    buyPrice,
    currentPrice,
    totalCost,
    currentValue,
    profitLoss,
    profitLossPct,
    buyDate:        inv.buyDate.toISOString().split("T")[0],
    priceUpdatedAt: inv.priceUpdatedAt?.toISOString() ?? null,
    createdAt:      inv.createdAt.toISOString(),
    updatedAt:      inv.updatedAt.toISOString(),
  };
}

export const GET = withAuth(async (userId) => {
  try {
    const investments = await prisma.investment.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(investments.map(serialize));
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(async (userId, req) => {
  try {
    const body   = await req.json();
    const parsed = createInvestmentSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { buyDate, ...rest } = parsed.data;

    // Oluşturma anında bir defa fiyat çekmeyi dene (başarısız olursa null kalır, sorun değil)
    const livePrice = await fetchCurrentPrice(rest.type, rest.symbol).catch(() => null);

    const investment = await prisma.investment.create({
      data: {
        userId,
        buyDate: new Date(buyDate),
        currentPrice: livePrice,
        priceUpdatedAt: livePrice !== null ? new Date() : null,
        ...rest,
      },
    });

    return created(serialize(investment));
  } catch (err) {
    return serverError(err);
  }
});
