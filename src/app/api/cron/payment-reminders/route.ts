import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReminderEmail, sendOverdueAlert } from "@/lib/email";

/**
 * Cron endpoint — called by Vercel Cron or external scheduler daily.
 * Secured by a shared secret in the Authorization header.
 *
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/payment-reminders", "schedule": "0 9 * * *" }]
 * }
 */
export async function GET(req: NextRequest) {
  // ── Security ───────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now     = new Date();
  now.setHours(0, 0, 0, 0);

  const results = { processed: 0, reminders: 0, overdue: 0, errors: 0 };

  try {
    // ── Get all users with email notifications enabled ─────────────────────
    const users = await prisma.user.findMany({
      where: {
        settings: { emailNotifications: true },
        email:    { not: null },
      },
      select: {
        id:    true,
        email: true,
        name:  true,
        settings: { select: { reminderDaysBefore: true } },
      },
    });

    for (const user of users) {
      if (!user.email) continue;
      const threshold = user.settings?.reminderDaysBefore ?? 3;
      const thresholdDate = new Date(now);
      thresholdDate.setDate(now.getDate() + threshold);

      try {
        // Upcoming payments within threshold
        const upcoming = await prisma.payment.findMany({
          where: {
            userId:    user.id,
            completed: false,
            dueDate:   { gte: now, lte: thresholdDate },
            status:    { not: "CANCELLED" },
            OR: [
              { reminderSentAt: null },
              { reminderSentAt: { lt: new Date(now.getTime() - 86_400_000 * 2) } }, // not sent in last 2 days
            ],
          },
        });

        if (upcoming.length > 0) {
          const paymentList = upcoming.map((p) => ({
            name:     p.name,
            amount:   Number(p.amount),
            dueDate:  p.dueDate.toISOString().split("T")[0],
            daysLeft: Math.round((p.dueDate.getTime() - now.getTime()) / 86_400_000),
          }));

          await sendPaymentReminderEmail(user.email, user.name ?? "Kullanıcı", paymentList);

          // Mark reminders sent
          await prisma.payment.updateMany({
            where: { id: { in: upcoming.map((p) => p.id) } },
            data:  { reminderSentAt: new Date() },
          });

          results.reminders += upcoming.length;
        }

        // Overdue payments — alert once per day
        const overdue = await prisma.payment.findMany({
          where: {
            userId:    user.id,
            completed: false,
            dueDate:   { lt: now },
            status:    { not: "CANCELLED" },
            OR: [
              { reminderSentAt: null },
              { reminderSentAt: { lt: new Date(now.getTime() - 86_400_000) } },
            ],
          },
        });

        if (overdue.length > 0) {
          const overdueList = overdue.map((p) => ({
            name:    p.name,
            amount:  Number(p.amount),
            dueDate: p.dueDate.toISOString().split("T")[0],
          }));

          await sendOverdueAlert(user.email, user.name ?? "Kullanıcı", overdueList);

          await prisma.payment.updateMany({
            where: { id: { in: overdue.map((p) => p.id) } },
            data:  { status: "OVERDUE", reminderSentAt: new Date() },
          });

          results.overdue += overdue.length;
        }

        results.processed++;
      } catch (userErr) {
        console.error(`[Cron] Failed for user ${user.id}:`, userErr);
        results.errors++;
      }
    }

    console.log(`[Cron] Payment reminders complete:`, results);
    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    console.error("[Cron] Fatal error:", err);
    return NextResponse.json({ error: "Cron failed", ...results }, { status: 500 });
  }
}
