import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ioiio.bet - Prediction Experiment",
    template: "%s | ioiio.bet",
  },
  description:
    "A crypto enthusiast's prediction experiment using atypica.ai. Tracking bets, analyzing markets, learning to predict smarter.",
  keywords: [
    "AI",
    "Prediction",
    "Market Analysis",
    "atypica.ai",
    "crypto",
    "betting",
  ],
  authors: [{ name: "Crypto Enthusiast" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ioiio.bet",
    title: "ioiio.bet - Prediction Experiment",
    description:
      "An independent prediction experiment using atypica.ai for market analysis.",
    siteName: "ioiio.bet",
  },
  twitter: {
    card: "summary_large_image",
    title: "ioiio.bet - Prediction Experiment",
    description:
      "Learning to bet smarter with atypica.ai - an independent prediction experiment.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <div className="min-h-screen flex flex-col font-sans">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
