import type { Metadata } from "next";
import "./globals.css";

import { AdminUiProvider } from "@/app/components/admin-ui-context";
import { Navbar } from "@/app/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUserEmail, isAdminEmail } from "@/lib/admin-auth";

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
  description: "Apartment rentals in Cannes",
  icons: {
    icon: "/favicon.svg",
  },
};

/** Global layout (theme + navbar), without apartment loading. */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userEmail = await getCurrentUserEmail()
  const isAdminEligible = isAdminEmail(userEmail)

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background text-foreground antialiased transition-colors duration-300"
      >
        <AdminUiProvider
          initialUserEmail={userEmail}
          initialIsAdminEligible={isAdminEligible}
        >
          <Navbar />
          {children}
          <Toaster />
        </AdminUiProvider>
      </body>
    </html>
  );
}
