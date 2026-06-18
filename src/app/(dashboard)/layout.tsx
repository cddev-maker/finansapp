import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader  from "@/components/layout/AppHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader user={session.user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
