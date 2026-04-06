import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AdminUiProvider } from "@/app/components/admin-ui-context";
import { Navbar } from "@/app/components/navbar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Airbnkey",
    template: "%s | Airbnkey",
  },
  description: "Locations d’appartements à Cannes",
  icons: {
    icon: "/favicon.svg",
  },
};

/** Layout global (thème + navigation), sans chargement direct des appartements. */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <AdminUiProvider>
          <Navbar />
          {children}
          <Toaster />
        </AdminUiProvider>
      </body>
    </html>
  );
}
