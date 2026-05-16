import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrganizerStats, getRecentOrganizerEvents } from "@/src/db/queries/events";
import { SummaryCards } from "./_components/summary-cards";
import { RecentEventsTable } from "./_components/recent-events-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function DashboardOverviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isOrganizer) {
    redirect("/dashboard/tickets");
  }

  const [stats, recentEvents] = await Promise.all([
    getOrganizerStats(session.user.id),
    getRecentOrganizerEvents(session.user.id),
  ]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Pantau performa event Anda di sini.
          </p>
        </div>
        <Button render={<Link href="/dashboard/events/new" />} nativeButton={false}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Event Baru
        </Button>
      </div>

      <SummaryCards stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Event Terbaru</h2>
          <Button variant="link" render={<Link href="/dashboard/events" />} nativeButton={false}>
            Lihat semua
          </Button>
        </div>
        <RecentEventsTable events={recentEvents} />
      </div>
    </div>
  );
}
