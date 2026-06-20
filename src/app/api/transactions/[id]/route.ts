import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTransactionSchema } from "@/lib/validations";
import { withAuth, ok, badRequest, notFound, serverError, serializeDate, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(t: { id: string; userId: string; date: Date; description: string; category: string; amount: Decimal; type: string; notes: string | null; creditCardId: string | null; createdAt: Date; updatedAt: Date }) {
  return { ...t, date: serializeDate(t.date)!, amount: Number(t.amount), createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

export const GET = withAuth(async (userId, _req, params) => {
  const id = params?.id;
  if (!id) return badRequest("ID gerekli");
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) return notFound("İşlem");
  return ok(serialize(tx));
});

export const PATCH = withAuth(async (userId, req, params) => {
  try {
    const id = params?.id;
    if (!id) return badRequest("ID gerekli");

    const body   = await req.json();
    const parsed = updateTransactionSchema.safeParse({ ...body, id });
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { id: _id, date, ...rest } = parsed.data;

    const count = await prisma.transaction.updateMany({
      where: { id, userId },
      data:  { ...(date && { date: new Date(date) }), ...rest },
    });
    if (count.count === 0) return notFound("İşlem");

    const updated = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    logAudit(userId, "UPDATE_TRANSACTION", "Transaction", id);
    return ok(serialize(updated));
  } catch (err) {
    return serverError(err);
  }
});

export const DELETE = withAuth(async (userId, req, params) => {
  const id = params?.id;
  if (!id) return badRequest("ID gerekli");

  // Bağlı bir Ödeme varsa, onu da sil
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (tx?.linkedPaymentId) {
    await prisma.payment.deleteMany({ where: { id: tx.linkedPaymentId, userId } });
  }

  const deleted = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return notFound("İşlem");

  logAudit(userId, "DELETE_TRANSACTION", "Transaction", id);
  return ok({ message: "Silindi" });
});
