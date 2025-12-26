import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LoveLobby - The Couples Quiz Game",
  description: "How well do you really know each other? Play the ultimate couples quiz!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LoveLobby",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ec4899",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="auto">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} antialiased bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 min-h-screen pb-safe font-sans`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
