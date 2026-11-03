import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {ToastProvider} from '@/components/ui/ToastProvider'

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nigertoday TV – Subscription Manager",
    template: "%s · Nigertoday TV",
  },
  description: "Private owner dashboard to track TV subscriptions, expiry dates and renewals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="nigertoday" className={inter.variable}>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}