import type { Metadata } from "next";
import { Providers } from "./providers";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "NU â€” Discover Ethiopia",
  description:
    "Your smart travel companion for Ethiopia. Find stays, tours, food, airport pickup, and AI-planned itineraries â€” all in one place.",
  keywords: [
    "Ethiopia",
    "Travel",
    "Addis Ababa",
    "Hotels",
    "Tours",
    "Restaurants",
    "AI Trip Planner"
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "NU â€” Discover Ethiopia",
    description: "Your smart travel companion for Ethiopia. Find stays, tours, food, airport pickup, and AI-planned itineraries.",
    url: "https://nu.com",
    siteName: "NU",
    images: [
      {
        url: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "NU Explore Ethiopia",
      },
    ],
    locale: "en_US",
    type: "website",
  }
};

export const viewport = {
  themeColor: "#1A1612",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Ethiopic:wght@900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-brand-dark antialiased" suppressHydrationWarning>
        <LanguageProvider>
        <Providers>
          <main className="max-w-lg mx-auto min-h-screen pb-24 px-4">
            {children}
          </main>
          <Onboarding />
          <BottomNav />
        </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}

