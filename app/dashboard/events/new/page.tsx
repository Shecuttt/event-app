import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EventForm } from "../_components/event-form";

export default async function NewEventPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Everyone can try to create an event, 
  // but they will be marked as organizer only after publishing.
  // Actually, for dashboard access, we already check in layout.
  // But let's be safe.

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Event Baru</h1>
        <p className="text-muted-foreground">
          Isi detail event Anda untuk mulai menarik peserta.
        </p>
      </div>
      <EventForm />
    </div>
  );
}
