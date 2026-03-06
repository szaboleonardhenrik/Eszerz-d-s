import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import CookieConsent from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "SzerződésPortál - Online Szerződéskezelő",
    template: "%s | SzerződésPortál",
  },
  description:
    "Magyar KKV-knak szánt online szerződéskészítő és aláíró platform. Ptk.-konform sablonok, e-aláírás, DÁP integráció.",
  metadataBase: new URL("https://szerzodes.cegverzum.hu"),
  openGraph: {
    title: "SzerződésPortál - Online Szerződéskezelő",
    description: "Magyar KKV-knak szánt platform: Ptk.-konform sablonok, digitális aláírás, automatikus PDF.",
    url: "https://szerzodes.cegverzum.hu",
    siteName: "SzerződésPortál",
    locale: "hu_HU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SzerződésPortál - Online Szerződéskezelő",
    description: "Szerződéskötés percek alatt, bárhonnan. Magyar KKV-knak.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <Toaster position="top-right" />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
