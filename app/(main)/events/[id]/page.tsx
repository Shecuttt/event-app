import { getEventById } from "@/src/db/queries/events";
import { notFound } from "next/navigation";
import { EventHeader } from "./_components/event-header";
import { TicketSection } from "./_components/ticket-section";
import type { Metadata } from "next";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event || event.status !== "published") {
    return {
      title: "Event Not Found",
    };
  }

  return {
    title: `${event.title} | Ivento`,
    description: event.description.substring(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.substring(0, 160),
      images: event.posterUrl ? [{ url: event.posterUrl }] : [],
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event || event.status !== "published") {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EventHeader event={event} />
        </div>
        <div className="lg:col-span-1">
          <TicketSection event={event} />
        </div>
      </div>
    </div>
  );
}
