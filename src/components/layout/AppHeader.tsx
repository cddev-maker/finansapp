"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayments } from "@/hooks/use-payments";
import { daysUntil } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export default function AppHeader({ user }: Props) {
  const { data: payments = [] } = usePayments();

  const urgentCount = payments.filter((p) => {
    const d = daysUntil(p.dueDate);
    return !p.completed && d >= 0 && d <= 7;
  }).length;

  const overdueCount = payments.filter((p) => !p.completed && daysUntil(p.dueDate) < 0).length;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 z-20 sticky top-0">
      {/* Breadcrumb area — pages fill this via portal if needed */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Alert indicators */}
        {(urgentCount > 0 || overdueCount > 0) && (
          <Link href="/payments" className="flex items-center gap-1.5 text-xs">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1 text-[10px] h-5">
                <Bell className="w-2.5 h-2.5" /> {overdueCount} gecikmiş
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge variant="warning" className="gap-1 text-[10px] h-5">
                <Bell className="w-2.5 h-2.5" /> {urgentCount} yaklaşan
              </Badge>
            )}
          </Link>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white text-xs font-bold flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-semibold text-sm">{user.name ?? "Kullanıcı"}</p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" /> Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
