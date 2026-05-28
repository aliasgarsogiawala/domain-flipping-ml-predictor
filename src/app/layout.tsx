import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DomainFlip AI",
  description: "Analyze domain names before you invest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="shell min-h-full bg-background text-foreground">
        <Navbar />
        <div className="mx-auto w-full max-w-7xl px-6 pt-32 sm:px-8 lg:px-12">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
