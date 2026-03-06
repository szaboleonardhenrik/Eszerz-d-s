import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "SzerződésPortál - Online Szerződéskezelő",
  description:
    "Magyar KKV-knak szánt online szerződéskészítő és aláíró platform. Ptk.-konform sablonok, e-aláírás, DÁP integráció.",
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
      </body>
    </html>
  );
}
