"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CreditCard, Receipt, Wallet,
  PieChart, BarChart3, Settings, HardDrive, Calendar,
  ChevronLeft, ChevronRight, Sun, Moon, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { href: "/transactions", label: "İşlemler",           icon: Receipt },
  { href: "/payments",     label: "Ödemeler",           icon: Wallet },
  { href: "/calendar",     label: "Takvim",             icon: Calendar },
  { href: "/budgets",      label: "Bütçeler",           icon: PieChart },
  { href: "/investments",  label: "Yatırımlarım",       icon: TrendingUp },
  { href: "/reports",      label: "Raporlar",           icon: BarChart3 },
  { href: "/backup",       label: "Veri Yedekleme",     icon: HardDrive },
  { href: "/settings",     label: "Ayarlar",            icon: Settings },
];

export default function AppSidebar() {
  const pathname  = usePathname();
  const { darkMode, toggleDark, sidebarOpen, setSidebar } = useStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "h-screen sticky top-0 flex flex-col bg-card border-r border-border transition-[width] duration-300 ease-in-out shrink-0 z-30",
        sidebarOpen ? "w-56" : "w-[68px]"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 border-b border-border shrink-0",
          sidebarOpen ? "px-4 py-5 justify-between" : "px-0 py-5 justify-center"
        )}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm shadow-primary/30 shrink-0">
                  <span className="text-white font-black text-sm">₺</span>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground leading-tight">FinansApp</p>
                  <p className="text-[10px] text-muted-foreground">Kişisel Finans</p>
                </div>
              </div>
              <button onClick={() => setSidebar(false)} className="p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setSidebar(true)} className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-black text-sm">₺</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">FinansApp — Genişlet</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      sidebarOpen ? "" : "justify-center px-0",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {sidebarOpen && <span>{label}</span>}
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right">{label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="py-3 px-2 border-t border-border space-y-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleDark}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                  sidebarOpen ? "" : "justify-center px-0"
                )}
              >
                {darkMode ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
                {sidebarOpen && <span>{darkMode ? "Aydınlık Mod" : "Karanlık Mod"}</span>}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">{darkMode ? "Aydınlık Mod" : "Karanlık Mod"}</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
