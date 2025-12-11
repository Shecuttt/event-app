import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="w-full border-b">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-semibold">Ivento</div>
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold leading-tight">
              Kelola Acara Tanpa Ribet.
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Bikin event, buka pendaftaran, cek kuota, manage peserta, dan
              handle absensi pakai satu aplikasi. Cocok buat UKM kampus sampai
              komunitas kecil.
            </p>

            <Link to="/login" className="mt-8 w-fit">
              <Button className="flex items-center gap-2">
                Mulai Kelola Event
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>

          {/* Right Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Selalu Terkontrol</CardTitle>
              <CardDescription>
                Semua event yang lo buat bakal langsung rapi: peserta, absensi,
                dan statistiknya.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <ul className="space-y-3 text-gray-700">
                <li>• Buat dan atur detail event</li>
                <li>• Link pendaftaran otomatis</li>
                <li>• Kuota peserta dan slot tersisa</li>
                <li>• QR check-in untuk hari H</li>
                <li>• Dashboard data peserta</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>

      <footer className="py-6 border-t">
        <div className="max-w-5xl mx-auto px-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Ivento. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
