import { prisma } from "@/lib/prisma";
import { updateInvestmentSchema } from "@/lib/validations";
import { withAuth, ok, badRequest, notFound, serverError } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(inv: {
  id: string; userId: string; type: string; symbol: string; name: string;
  quantity: Decimal; buyPrice: Decimal; buyDate: Date;
  currentPrice: Decimal | null; priceUpdatedAt: Date | null;
  notes: string | null; createdAt: Date; updatedAt: Date;
}) {
  const quantity      = Number(inv.quantity);
  const buyPrice      = Number(inv.buyPrice);
  const currentPrice  = inv.currentPrice ? Number(inv.currentPrice) : null;
  const totalCost     = quantity * buyPrice;
  const currentValue  = currentPrice !== null ? quantity * currentPrice : null;
  const profitLoss    = currentValue !== null ? currentValue - totalCost : null;
  const profitLossPct = currentValue !== null && totalCost > 0 ? (profitLoss! / totalCost) * 100 : null;

  return {
    ...inv,
    quantity, buyPrice, currentPrice, totalCost, currentValue, profitLoss, profitLossPct,
    buyDate:        inv.buyDate.toISOString().split("T")[0],
    priceUpdatedAt: inv.priceUpdatedAt?.toISOString() ?? null,
    createdAt:      inv.createdAt.toISOString(),
    updatedAt:      inv.updatedAt.toISOString(),
  };
}

export const PATCH = withAuth(async (userId, req, params) => {
  try {
    const id = params?.id; if (!id) return badRequest("ID gerekli");
    const body = await req.json();
    const parsed = updateInvestmentSchema.safeParse({ ...body, id });
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { id: _id, buyDate, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (buyDate) updateData.buyDate = new Date(buyDate);

    const count = await prisma.investment.updateMany({ where: { id, userId }, data: updateData });
    if (count.count === 0) return notFound("Yatırım");

    const updated = await prisma.investment.findUniqueOrThrow({ where: { id } });
    return ok(serialize(updated));
  } catch (err) {
    return serverError(err);
  }
});

export const DELETE = withAuth(async (userId, req, params) => {
  const id = params?.id; if (!id) return badRequest("ID gerekli");
  const deleted = await prisma.investment.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return notFound("Yatırım");
  return ok({ message: "Silindi" });
});
