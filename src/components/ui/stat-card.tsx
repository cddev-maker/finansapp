import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

interface StatCardProps {
  label:    string;
  value:    string;
  sub?:     string;
  icon:     React.ReactNode;
  trend?:   { value: number; label?: string };
  color:    "green" | "red" | "indigo" | "blue" | "amber" | "purple";
  loading?: boolean;
  className?: string;
}

const colors = {
  green:  { icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", value: "text-emerald-600 dark:text-emerald-400" },
  red:    { icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",                 value: "text-red-600 dark:text-red-400" },
  indigo: { icon: "bg-primary/10 text-primary",                                                   value: "text-primary" },
  blue:   { icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",             value: "text-blue-600 dark:text-blue-400" },
  amber:  { icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",         value: "text-amber-600 dark:text-amber-400" },
  purple: { icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",     value: "text-purple-600 dark:text-purple-400" },
};

export function StatCard({ label, value, sub, icon, trend, color, loading, className }: StatCardProps) {
  const c = colors[color];
  if (loading) return <Skeleton className={cn("h-32 rounded-2xl", className)} />;

  return (
    <Card className={cn("p-5 flex flex-col gap-3 card-hover", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        <span className={cn("p-2 rounded-xl", c.icon)}>{icon}</span>
      </div>
      <div>
        <p className={cn("text-2xl font-extrabold tracking-tight", c.value)}>{value}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend && (
            <span className={cn("text-xs font-semibold", trend.value >= 0 ? "text-emerald-600" : "text-red-500")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
              {trend.label && <span className="text-muted-foreground font-normal ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
