import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { ok, created, badRequest, serverError } from "@/lib/api-helpers";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where:  { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (existing) return badRequest("Bu e-posta adresi zaten kullanılıyor");

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email:    email.toLowerCase().trim(),
        password: hashed,
        role:     "USER",
        settings: {
          create: {
            currency:           "TRY",
            locale:             "tr-TR",
            emailNotifications: true,
            reminderDaysBefore: 3,
          },
        },
      },
      select: { id: true, name: true, email: true },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email!, user.name ?? "Kullanıcı").catch(console.error);

    return created({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return serverError(err);
  }
}
