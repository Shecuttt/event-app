import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./_components/sidebar";
import { SidebarNav } from "./_components/sidebar-nav";
import { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={session.user}>
        <SidebarNav isOrganizer={!!session.user.isOrganizer} />
      </DashboardSidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          {/* Top-right actions could go here */}
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
