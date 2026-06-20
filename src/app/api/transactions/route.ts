import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransactionSchema } from "@/lib/validations";
import { withAuth, ok, created, badRequest, serverError, serializeDate, serializeDateTime, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";

function serialize(t: {
  id: string; userId: string; date: Date; description: string; category: string;
  amount: Decimal; type: string; notes: string | null; creditCardId: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...t,
    date:     serializeDate(t.date)!,
    amount:   Number(t.amount),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export const GET = withAuth(async (userId, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const year        = searchParams.get("year")     ? Number(searchParams.get("year"))     : undefined;
    const month       = searchParams.get("month")    ? Number(searchParams.get("month"))    : undefined;
    const type        = searchParams.get("type")     || undefined;
    const category    = searchParams.get("category") || undefined;
    const search      = searchParams.get("search")   || undefined;
    const creditCardId = searchParams.get("creditCardId") || undefined;
    const page        = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize    = Math.min(100, Number(searchParams.get("pageSize") || 25));

    const where: Record<string, unknown> = { userId };
    if (year !== undefined && month !== undefined) {
      where.date = { gte: new Date(year, month, 1), lte: new Date(year, month + 1, 0) };
    } else if (year !== undefined) {
      where.date = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) };
    }
    if (type)         where.type         = type;
    if (category)     where.category     = category;
    if (creditCardId) where.creditCardId = creditCardId;
    if (search)       where.description  = { contains: search, mode: "insensitive" };

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy:  { date: "desc" },
        skip:     (page - 1) * pageSize,
        take:     pageSize,
        include:  { creditCard: { select: { id: true, name: true, lastFourDigits: true, color: true } } },
      }),
    ]);

    return ok({ data: rows.map(serialize), total, page, pageSize });
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(async (userId, req) => {
  try {
    const body   = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { date, ...rest } = parsed.data;

    // İşlem ile Ödeme/Takvim entegrasyonu:
    // Her yeni işlem için otomatik olarak "ödenmiş" bir Ödeme kaydı oluşturulur,
    // böylece Takvim ve Ödemeler sayfasında da görünür.
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: { userId, date: new Date(date), ...rest },
      });

      // Sadece gider işlemleri için otomatik ödeme kaydı oluştur
      // (gelir işlemleri "ödeme" mantığına girmez)
      if (rest.type === "EXPENSE") {
        const payment = await tx.payment.create({
          data: {
            userId,
            name:        rest.description,
            description: `İşlemler sekmesinden otomatik oluşturuldu`,
            amount:      rest.amount,
            dueDate:     new Date(date),
            startDate:   new Date(date),
            category:    rest.category,
            status:      "PAID",
            completed:   true,
            completedAt: new Date(),
          },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data:  { linkedPaymentId: payment.id },
        });

        return { ...transaction, linkedPaymentId: payment.id };
      }

      return transaction;
    });

    logAudit(userId, "CREATE_TRANSACTION", "Transaction", result.id, { amount: rest.amount, type: rest.type }, req);
    return created(serialize(result));
  } catch (err) {
    return serverError(err);
  }
});
