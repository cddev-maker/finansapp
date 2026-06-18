import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Response factories ───────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Kimlik doğrulama gerekli" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Bu kaynağa erişim yetkiniz yok" }, { status: 403 });
}

export function notFound(entity = "Kayıt") {
  return NextResponse.json({ error: `${entity} bulunamadı` }, { status: 404 });
}

export function serverError(err?: unknown) {
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
}

// ─── Validation helper ────────────────────────────────────────────────────────

export function handleZodError(error: ZodError) {
  return badRequest("Geçersiz veri", error.flatten());
}

// ─── Route handler wrapper ────────────────────────────────────────────────────

type Handler = (userId: string, req: Request, params?: Record<string, string>) => Promise<NextResponse>;

export function withAuth(handler: Handler) {
  return async (req: Request, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      const user   = await requireUser();
      const params = context?.params ? await context.params : undefined;
      return await handler(user.id, req, params);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") return unauthorized();
      return serverError(err);
    }
  };
}

// ─── Serializers ──────────────────────────────────────────────────────────────

export function serializeDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString().split("T")[0] : d;
}

export function serializeDateTime(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

// ─── Audit logger ─────────────────────────────────────────────────────────────

export async function logAudit(
  userId:     string,
  action:     string,
  entityType: string,
  entityId:   string,
  metadata?:  Record<string, unknown>,
  req?:       Request
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata:  metadata ?? null,
        ipAddress: req?.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
        userAgent: req?.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
  } catch {
    // Audit log failures are non-fatal
  }
}
