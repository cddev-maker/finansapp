import { prisma } from "@/lib/prisma";
import { updateSettingsSchema } from "@/lib/validations";
import { withAuth, ok, badRequest, serverError } from "@/lib/api-helpers";

export const GET = withAuth(async (userId) => {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return ok(settings);
});

export const PATCH = withAuth(async (userId, req) => {
  try {
    const body   = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    const { name, ...settingsData } = parsed.data;

    if (name) {
      await prisma.user.update({ where: { id: userId }, data: { name } });
    }

    const settings = await prisma.userSettings.upsert({
      where:  { userId },
      update: settingsData,
      create: { userId, ...settingsData },
    });

    return ok(settings);
  } catch (err) { return serverError(err); }
});
