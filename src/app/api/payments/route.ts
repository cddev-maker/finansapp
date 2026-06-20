import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema } from "@/lib/validations";
import { withAuth, ok, created, badRequest, serverError, serializeDate, serializeDateTime, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(p: { id: string; userId: string; name: string; description: string | null; amount: Decimal; dueDate: Date; startDate: Date; endDate: Date | null; category: string; status: string; completed: boolean; completedAt: Date | null; reminderSentAt: Date | null; notes: string | null; bankName: string | null; createdAt: Date; updatedAt: Date }) {
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
    const { recurMonths, ...rawData } = body;
    const parsed = createPaymentSchema.safeParse(rawData);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { dueDate, startDate, endDate, status, bankName, ...rest } = parsed.data;
    const isPaid = status === "PAID";

    if (!recurMonths || recurMonths < 2) {
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            userId,
            dueDate:   new Date(dueDate),
            startDate: new Date(startDate),
            endDate:   endDate ? new Date(endDate) : null,
            status:    status ?? "PENDING",
            completed: isPaid,
            completedAt: isPaid ? new Date() : null,
            bankName:  bankName ?? null,
            ...rest,
          },
        });

        if (isPaid) {
          await tx.transaction.create({
            data: {
              userId, date: new Date(dueDate), description: rest.name,
              category: rest.category, amount: rest.amount, type: "EXPENSE",
              notes: "Ödemeler sekmesinden otomatik oluşturuldu",
              linkedPaymentId: payment.id,
              bankName: bankName ?? null,
            },
          });
        }
        return payment;
      });

      logAudit(userId, "CREATE_PAYMENT", "Payment", result.id);
      return created(serialize(result));
    }

    const seriesId = `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const baseDate = new Date(dueDate);
    const createdPayments = [];

    for (let i = 0; i < recurMonths; i++) {
      const occurrenceDate = new Date(baseDate);
      occurrenceDate.setMonth(baseDate.getMonth() + i);

      const payment = await prisma.payment.create({
        data: {
          userId,
          dueDate:    occurrenceDate,
          startDate:  occurrenceDate,
          endDate:    endDate ? new Date(endDate) : null,
          status:     i === 0 ? (status ?? "PENDING") : "PENDING",
          completed:  i === 0 ? isPaid : false,
          completedAt: i === 0 && isPaid ? new Date() : null,
          seriesId,
          bankName:   bankName ?? null,
          ...rest,
        },
      });
      createdPayments.push(payment);

      if (i === 0 && isPaid) {
        await prisma.transaction.create({
          data: {
            userId, date: occurrenceDate, description: rest.name,
            category: rest.category, amount: rest.amount, type: "EXPENSE",
            notes: "Ödemeler sekmesinden otomatik oluşturuldu",
            linkedPaymentId: payment.id,
            bankName: bankName ?? null,
          },
        });
      }
    }

    logAudit(userId, "CREATE_PAYMENT_SERIES", "Payment", seriesId, { count: recurMonths });
    return created(createdPayments.map(serialize));
  } catch (err) {
    return serverError(err);
  }
});
