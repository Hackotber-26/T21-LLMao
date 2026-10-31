import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import AnimatedBackground from "@/components/background/AnimatedBackground";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Solvyn — Real-World Problem Discovery & Solution Platform",
  description:
    "AI-powered discovery connecting everyday people reporting real-world challenges with engineers, builders, and solvers ready to fix them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col relative text-slate-100 bg-[#05070D] antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Persistent animated ribbed-glass background */}
        <AnimatedBackground />

        {/* Global application header inside Suspense */}
        <Suspense fallback={<div className="h-16 w-full border-b border-white/[0.08] bg-[#05070D]" />}>
          <Navbar />
        </Suspense>

        {/* Main application content viewport */}
        <div className="flex-1 flex flex-col relative z-10">
          <Suspense fallback={<div className="p-12 text-center text-slate-500 text-sm">Loading Solvyn...</div>}>
            {children}
          </Suspense>
        </div>

        {/* Global footer */}
        <Footer />
      </body>
    </html>
  );
}
