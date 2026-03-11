import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import CookieConsent from "@/components/cookie-consent";
import ServiceWorkerRegister from "@/components/sw-register";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Legitas",
  url: "https://legitas.hu",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Magyar KKV-knak szánt online szerződéskészítő és aláíró platform.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "HUF",
    lowPrice: "0",
    highPrice: "2475",
    offerCount: "4",
  },
  publisher: {
    "@type": "Organization",
    name: "Legitas",
    url: "https://legitas.hu",
    logo: { "@type": "ImageObject", url: "https://legitas.hu/icons/icon-512.png" },
  },
};

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "Legitas - Online Szerződéskezelő",
    template: "%s | Legitas",
  },
  description:
    "Magyar KKV-knak szánt online szerződéskészítő és aláíró platform. Ptk.-konform sablonok, e-aláírás, DÁP integráció.",
  metadataBase: new URL("https://legitas.hu"),
  openGraph: {
    title: "Legitas - Online Szerződéskezelő",
    description: "Magyar KKV-knak szánt platform: Ptk.-konform sablonok, digitális aláírás, automatikus PDF.",
    url: "https://legitas.hu",
    siteName: "Legitas",
    locale: "hu_HU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legitas - Online Szerződéskezelő",
    description: "Szerződéskötés percek alatt, bárhonnan. Magyar KKV-knak.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Legitas",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900 dark:text-gray-100`}>
        <Script
          id="org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ThemeProvider>
          <I18nProvider>
            <Toaster position="top-right" />
            {children}
            <CookieConsent />
            <ServiceWorkerRegister />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
