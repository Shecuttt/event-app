/* eslint-disable react-hooks/purity */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  Users,
  QrCode,
  BarChart3,
  Link as LinkIcon,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const features = [
    {
      icon: Calendar,
      title: "Buat Event Instant",
      description:
        "Setup event dalam menit. Isi detail, dapat link, langsung bisa dishare.",
    },
    {
      icon: LinkIcon,
      title: "Link Auto-Generate",
      description:
        "Setiap event dapet unique link yang bisa langsung kamu share ke mana aja.",
    },
    {
      icon: Users,
      title: "Manage Peserta",
      description:
        "List peserta real-time, filter by status, dan export data kapan aja.",
    },
    {
      icon: QrCode,
      title: "QR Check-In",
      description:
        "Scan QR code peserta atau manual check-in. Cepat dan ga ribet.",
    },
    {
      icon: BarChart3,
      title: "Dashboard Analytics",
      description: "Track attendance rate, total peserta, dan performa event.",
    },
    {
      icon: CheckCircle2,
      title: "Kuota & Slot",
      description:
        "Set limit peserta dan liat real-time berapa slot yang tersisa.",
    },
  ];

  const randomTicketCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-white via-blue-50/30 to-white">
      {/* Navbar */}
      <header className="w-full border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Ivento
            </span>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="font-medium">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Event Management Made Simple
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 bg-linear-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
              Kelola Event Tanpa Ribet
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Platform lengkap buat bikin event, manage peserta, dan handle
              check-in.
              <br />
              Dari setup sampai hari H, semua dalam satu tempat.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="text-base px-8 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all"
                >
                  Mulai Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Login
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Ga perlu kartu kredit • Setup dalam 2 menit
            </p>
          </div>

          {/* Feature Showcase */}
          <div className="relative">
            {/* linear Blur Background */}
            <div className="absolute inset-0 bg-linear-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20 blur-3xl -z-10" />

            <Card className="shadow-2xl border-gray-200/50 overflow-hidden p-0">
              <div className="bg-linear-to-br from-blue-50 to-white p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
                      DASHBOARD PANITIA
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Kontrol Penuh dari Satu Tempat
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Dashboard yang clean dan powerful. Liat semua event lo,
                      track peserta, dan manage attendance dengan interface yang
                      intuitif.
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Real-time participant tracking",
                        "QR code scanner built-in",
                        "Export data ke CSV",
                        "Stats & analytics otomatis",
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-gray-700"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl blur-2xl opacity-20" />
                      <div className="relative bg-white rounded-2xl shadow-2xl p-6 border">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b">
                            <span className="text-sm font-semibold text-gray-700">
                              Event Overview
                            </span>
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-2xl font-bold text-blue-600">
                                48
                              </div>
                              <div className="text-xs text-gray-600">
                                Total Peserta
                              </div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-600">
                                35
                              </div>
                              <div className="text-xs text-gray-600">
                                Sudah Hadir
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {["John Doe", "Jane Smith", "Alex Wong"].map(
                              (name, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 py-2"
                                >
                                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-500" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      TIX-
                                      {randomTicketCode()}
                                    </div>
                                  </div>
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Semua yang Kamu Butuh
            </h2>
            <p className="text-lg text-gray-600">
              Feature lengkap buat handle event dari A sampai Z
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Bikin Event Pertama Lo?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Setup dalam hitungan menit. Ga perlu setup ribet atau technical
            knowledge.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              variant="secondary"
              className="text-base px-8 shadow-xl"
            >
              Mulai Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Ivento</span>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Ivento. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
