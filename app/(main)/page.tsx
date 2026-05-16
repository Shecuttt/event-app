import { HeroSection } from "./_components/hero-section";
import { EventSection } from "./_components/event-section";

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <EventSection />

      {/* Simple Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span className="text-xl font-bold text-primary">Ivento</span>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Ivento. All rights reserved.
              </p>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-foreground transition-colors">Bantuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
