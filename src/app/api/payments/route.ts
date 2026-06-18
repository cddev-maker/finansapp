import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema } from "@/lib/validations";
import { withAuth, ok, created, badRequest, serverError, serializeDate, serializeDateTime, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(p: { id: string; userId: string; name: string; description: string | null; amount: Decimal; dueDate: Date; startDate: Date; endDate: Date | null; category: string; status: string; completed: boolean; completedAt: Date | null; reminderSentAt: Date | null; notes: string | null; createdAt: Date; updatedAt: Date }) {
  return {
    ...p,
    amount:       Number(p.amount),
    dueDate:      serializeDate(p.dueDate)!,
    startDate:    serializeDate(p.startDate)!,
    endDate:      serializeDate(p.endDate),
    completedAt:  serializeDateTime(p.completedAt),
    reminderSentAt: serializeDateTime(p.reminderSentAt),
    createdAt:    p.createdAt.toISOString(),
    updatedAt:    p.updatedAt.toISOString(),
  };
}

export const GET = withAuth(async (userId, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const search = searchParams.get("search") || undefined;
    const now    = new Date();

    const where: Record<string, unknown> = { userId };
    if (search) where.name = { contains: search, mode: "insensitive" };

    if (filter === "upcoming") {
      const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
      where.completed = false;
      where.dueDate   = { gte: now, lte: in7 };
    } else if (filter === "overdue") {
      where.completed = false;
      where.dueDate   = { lt: now };
    } else if (filter === "this_month") {
      where.dueDate = { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    } else if (filter === "completed") {
      where.completed = true;
    }

    const payments = await prisma.payment.findMany({ where, orderBy: { dueDate: "asc" } });
    return ok(payments.map(serialize));
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(async (userId, req) => {
  try {
    const body   = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { dueDate, startDate, endDate, ...rest } = parsed.data;
    const p = await prisma.payment.create({
      data: { userId, dueDate: new Date(dueDate), startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, ...rest },
    });
    logAudit(userId, "CREATE_PAYMENT", "Payment", p.id);
    return created(serialize(p));
  } catch (err) {
    return serverError(err);
  }
});
