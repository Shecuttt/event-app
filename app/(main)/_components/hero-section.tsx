import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-32">
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Temukan dan Buat <span className="text-primary">Event Seru</span> di Sekitarmu
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Ivento memudahkanmu untuk mencari tiket konser, workshop, seminar, dan komunitas favorit. 
          Atau mulai buat event-mu sendiri dalam hitungan menit.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/events"
            className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-lg")}
          >
            Jelajahi Event
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/events/new"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-12 px-8 text-lg"
            )}
          >
            Buat Event Sendiri
          </Link>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[120px] bg-primary/30 rounded-full" />
    </section>
  );
}
