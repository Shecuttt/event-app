import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getEventWithOwnerCheck } from "@/src/db/queries/events";
import { EventForm } from "../../_components/event-form";
import { Badge } from "@/components/ui/badge";

import { StatusButtons } from "./_components/status-buttons";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const event = await getEventWithOwnerCheck(id, session.user.id);

  if (!event) {
    notFound();
  }

  const statusColors = {
    draft: "secondary",
    published: "default",
    cancelled: "destructive",
    completed: "outline",
  } as const;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
            <Badge variant={statusColors[event.status]} className="capitalize">
              {event.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Perbarui informasi event atau ubah status publikasi.
          </p>
        </div>

        <StatusButtons eventId={id} status={event.status} />
      </div>

      <EventForm initialData={event} isEditing />
    </div>
  );
}
