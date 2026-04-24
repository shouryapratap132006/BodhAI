import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BodhAI — Intelligent Learning Assistant",
  description:
    "BodhAI is a powerful AI learning assistant that explains any topic with clarity — from beginner to advanced. Upload documents or enter a topic to learn instantly.",
  keywords: ["AI", "learning", "education", "BodhAI", "intelligent tutor"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
