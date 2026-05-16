import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Ivento - Event Management Platform",
  description: "Temukan dan buat event menarik di sekitarmu dengan Ivento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        spaceGrotesk.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
