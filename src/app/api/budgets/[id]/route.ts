import { prisma } from "@/lib/prisma";
import { updateBudgetSchema } from "@/lib/validations";
import { withAuth, ok, badRequest, notFound, serverError, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(b: { id: string; userId: string; name: string; category: string; amount: Decimal; period: string; year: number; month: number | null; alertAt: number; color: string; createdAt: Date; updatedAt: Date }) {
  return { ...b, amount: Number(b.amount), createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString() };
}

export const PATCH = withAuth(async (userId, req, params) => {
  try {
    const id = params?.id; if (!id) return badRequest("ID gerekli");
    const body = await req.json();
    const parsed = updateBudgetSchema.safeParse({ ...body, id });
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());
    const { id: _id, ...rest } = parsed.data;
    const count = await prisma.budget.updateMany({ where: { id, userId }, data: rest });
    if (count.count === 0) return notFound("Bütçe");
    const updated = await prisma.budget.findUniqueOrThrow({ where: { id } });
    logAudit(userId, "UPDATE_BUDGET", "Budget", id);
    return ok(serialize(updated));
  } catch (err) { return serverError(err); }
});

export const DELETE = withAuth(async (userId, req, params) => {
  const id = params?.id; if (!id) return badRequest("ID gerekli");
  const deleted = await prisma.budget.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return notFound("Bütçe");
  logAudit(userId, "DELETE_BUDGET", "Budget", id);
  return ok({ message: "Silindi" });
});
