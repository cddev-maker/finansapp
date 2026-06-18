import { prisma } from "@/lib/prisma";
import { createCreditCardSchema } from "@/lib/validations";
import { withAuth, ok, created, badRequest, serverError, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(c: { id: string; userId: string; name: string; lastFourDigits: string; network: string; creditLimit: Decimal; currentBalance: Decimal; statementDate: number; dueDate: number; color: string; isActive: boolean; createdAt: Date; updatedAt: Date }) {
  const creditLimit    = Number(c.creditLimit);
  const currentBalance = Number(c.currentBalance);
  return {
    ...c,
    creditLimit,
    currentBalance,
    availableLimit:  creditLimit - currentBalance,
    utilizationPct:  creditLimit > 0 ? Math.round((currentBalance / creditLimit) * 100) : 0,
    createdAt:       c.createdAt.toISOString(),
    updatedAt:       c.updatedAt.toISOString(),
  };
}

export const GET = withAuth(async (userId) => {
  const cards = await prisma.creditCard.findMany({
    where:   { userId, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      statements: { orderBy: { periodStart: "desc" }, take: 3 },
    },
  });
  return ok(cards.map(serialize));
});

export const POST = withAuth(async (userId, req) => {
  try {
    const body   = await req.json();
    const parsed = createCreditCardSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const card = await prisma.creditCard.create({ data: { userId, ...parsed.data } });
    logAudit(userId, "CREATE_CREDIT_CARD", "CreditCard", card.id);
    return created(serialize(card));
  } catch (err) {
    return serverError(err);
  }
});
