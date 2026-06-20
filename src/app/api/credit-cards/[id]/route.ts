import { prisma } from "@/lib/prisma";
import { updateCreditCardSchema } from "@/lib/validations";
import { withAuth, ok, badRequest, notFound, serverError, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(c: { id: string; userId: string; name: string; lastFourDigits: string; network: string; creditLimit: Decimal; currentBalance: Decimal; statementDate: number; dueDate: number; bankName: string | null; cardBrand: string | null; color: string; isActive: boolean; createdAt: Date; updatedAt: Date }) {
  const creditLimit = Number(c.creditLimit); const currentBalance = Number(c.currentBalance);
  return { ...c, creditLimit, currentBalance, availableLimit: creditLimit - currentBalance, utilizationPct: creditLimit > 0 ? Math.round((currentBalance / creditLimit) * 100) : 0, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}

export const PATCH = withAuth(async (userId, req, params) => {
  try {
    const id = params?.id; if (!id) return badRequest("ID gerekli");
    const body = await req.json();
    const parsed = updateCreditCardSchema.safeParse({ ...body, id });
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());
    const { id: _id, ...rest } = parsed.data;
    const count = await prisma.creditCard.updateMany({ where: { id, userId }, data: rest });
    if (count.count === 0) return notFound("Kredi kartı");
    const updated = await prisma.creditCard.findUniqueOrThrow({ where: { id } });
    logAudit(userId, "UPDATE_CREDIT_CARD", "CreditCard", id);
    return ok(serialize(updated));
  } catch (err) { return serverError(err); }
});

export const DELETE = withAuth(async (userId, req, params) => {
  const id = params?.id; if (!id) return badRequest("ID gerekli");
  const count = await prisma.creditCard.updateMany({ where: { id, userId }, data: { isActive: false } });
  if (count.count === 0) return notFound("Kredi kartı");
  logAudit(userId, "DELETE_CREDIT_CARD", "CreditCard", id);
  return ok({ message: "Kart devre dışı bırakıldı" });
});
