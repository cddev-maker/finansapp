import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { ok, badRequest, serverError } from "@/lib/api-helpers";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçerli e-posta adresi girin");

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where:  { email: email.toLowerCase().trim() },
      select: { id: true, email: true },
    });

    // Always return success (don't leak email existence)
    if (!user) return ok({ message: "E-posta gönderildi (eğer hesap mevcutsa)" });

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { email: user.email! },
      data:  { used: true },
    });

    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3_600_000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email: user.email!, token, expires },
    });

    await sendPasswordResetEmail(user.email!, token);

    return ok({ message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi" });
  } catch (err) {
    return serverError(err);
  }
}
