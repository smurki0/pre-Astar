import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/estar/ThemeProvider";
import { I18nProvider as LanguageProvider } from "@/lib/i18n";
import { CartDrawer } from "@/components/estar/CartDrawer";
import { SEOHead } from "@/components/estar/SEOHead";
import { MaintenanceChecker } from "@/components/estar/MaintenanceChecker";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { FaviconManager } from "@/components/estar/FaviconManager";
import SessionProvider from "@/components/estar/SessionProvider";
import { Analytics } from "@vercel/analytics/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseMetadata: Metadata = {
  title: {
    default: "Astar | استآر - أزياء محتشمة عصرية",
    template: "%s | Astar استآر"
  },
  description: "اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية. عباءات، فساتين، بلوزات بأعلى جودة وأفضل الأسعار. شحن سريع لجميع أنحاء مصر والخليج.",
  keywords: ["عبايات", "حجاب", "ملابس محتشمة", "فساتين", "أزياء إسلامية", "modest fashion", "hijab", "abayas", "استآر", "Astar"],
  authors: [{ name: "Astar Team" }],
  creator: "Astar",
  publisher: "Astar",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Astar | استآر - أزياء محتشمة عصرية",
    description: "اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية",
    url: "https://astar.com",
    siteName: "Astar",
    type: "website",
    locale: "ar_EG",
    alternateLocale: ["en_US", "ar_SA"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Astar | استآر - أزياء محتشمة",
    description: "اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية",
    creator: "@astar_fashion",
  },
  verification: {
    google: "google-site-verification-code",
  },
  alternates: {
    canonical: "https://astar.com",
    languages: {
      "ar": "https://astar.com",
      "en": "https://astar.com/en",
    },
  },
  category: "Fashion & Clothing",
  classification: "E-Commerce - Modest Fashion",
};

// The favicon is managed from Admin > Settings and stored in the `site_favicon`
// setting. Read it on the server so the <link rel="icon"> that Next.js renders
// into <head> already points at the admin's favicon on first paint of EVERY
// page (fixes "old favicon still shows after refresh"). The `?v=` token is the
// setting's updatedAt timestamp: it changes ONLY when the favicon changes, so
// the browser reloads the icon immediately after a save yet keeps caching it the
// rest of the time (professional cache-busting, no perf hit).
const DEFAULT_FAVICON = "/favicon.svg";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let favicon = DEFAULT_FAVICON;
  let version = "";

  try {
    const row = await db.setting.findUnique({ where: { key: "site_favicon" } });
    if (row?.value?.trim()) {
      favicon = row.value.trim();
      version = String(row.updatedAt.getTime());
    }
  } catch {
    // DB unavailable (e.g. build time) -> fall back to the bundled default.
  }

  const href =
    favicon.includes("?") || !version ? favicon : `${favicon}?v=${version}`;

  return {
    ...baseMetadata,
    icons: {
      icon: href,
      shortcut: href,
      apple: href,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <SEOHead />
            <Analytics />
            <SiteSettingsProvider>
              <FaviconManager />
              <SessionProvider refetchInterval={0} refetchOnWindowFocus>
                <MaintenanceChecker>
                  {children}
                <Toaster />


                </MaintenanceChecker>
              </SessionProvider>
            </SiteSettingsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

