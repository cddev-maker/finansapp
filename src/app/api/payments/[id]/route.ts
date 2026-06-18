import { prisma } from "@/lib/prisma";
import { updatePaymentSchema } from "@/lib/validations";
import { withAuth, ok, badRequest, notFound, serverError, serializeDate, serializeDateTime, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(p: { id: string; userId: string; name: string; description: string | null; amount: Decimal; dueDate: Date; startDate: Date; endDate: Date | null; category: string; status: string; completed: boolean; completedAt: Date | null; reminderSentAt: Date | null; notes: string | null; createdAt: Date; updatedAt: Date }) {
  return { ...p, amount: Number(p.amount), dueDate: serializeDate(p.dueDate)!, startDate: serializeDate(p.startDate)!, endDate: serializeDate(p.endDate), completedAt: serializeDateTime(p.completedAt), reminderSentAt: serializeDateTime(p.reminderSentAt), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

export const PATCH = withAuth(async (userId, req, params) => {
  try {
    const id = params?.id; if (!id) return badRequest("ID gerekli");
    const body = await req.json();
    const parsed = updatePaymentSchema.safeParse({ ...body, id });
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { id: _id, dueDate, startDate, endDate, completedAt, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (dueDate)  updateData.dueDate    = new Date(dueDate);
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

    const count = await prisma.payment.updateMany({ where: { id, userId }, data: updateData });
    if (count.count === 0) return notFound("Ödeme");

    const updated = await prisma.payment.findUniqueOrThrow({ where: { id } });
    logAudit(userId, "UPDATE_PAYMENT", "Payment", id);
    return ok(serialize(updated));
  } catch (err) {
    return serverError(err);
  }
});

export const DELETE = withAuth(async (userId, req, params) => {
  const id = params?.id; if (!id) return badRequest("ID gerekli");
  const deleted = await prisma.payment.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return notFound("Ödeme");
  logAudit(userId, "DELETE_PAYMENT", "Payment", id);
  return ok({ message: "Silindi" });
});
