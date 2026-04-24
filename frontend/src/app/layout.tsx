import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BodhAI — Personal AI Tutor",
  description:
    "BodhAI is your personal AI tutor that teaches concepts, solves problems step-by-step, quizzes you, and adapts to your level in real-time. Like a human teacher, powered by AI.",
  keywords: [
    "AI tutor", "learn with AI", "BodhAI", "intelligent learning",
    "quiz AI", "homework help", "concept explanation", "LangGraph",
  ],
  openGraph: {
    title: "BodhAI — Personal AI Tutor",
    description: "Teach, test, guide, and adapt — just like a real teacher.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
