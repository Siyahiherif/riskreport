import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";
import Gtag from "./components/Gtag";
import SiteHeader from "./components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Passive IT Security Risk Report | Email, TLS & Web Risk Score",
  description: "Get a passive IT security risk score for your domain. Email security, TLS, and web headers analyzed in minutes. No scans. Executive-ready PDF.",
  alternates: {
    canonical: "https://cyberfacex.com/",
  },
  openGraph: {
    title: "Passive IT Security Risk Report",
    description: "Get a passive IT security risk score in minutes.",
    url: "https://cyberfacex.com/",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Gtag />
        <SiteHeader />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
