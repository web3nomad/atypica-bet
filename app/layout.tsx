import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Atypica Bet - Prediction Experiment',
    template: '%s | Atypica Bet',
  },
  description: 'A crypto enthusiast\'s prediction experiment using atypica.ai. Tracking bets, analyzing markets, learning to predict smarter.',
  keywords: ['AI', 'Prediction', 'Market Analysis', 'atypica.ai', 'crypto', 'betting'],
  authors: [{ name: 'Crypto Enthusiast' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://atypica-bet.vercel.app',
    title: 'Atypica Bet - Prediction Experiment',
    description: 'An independent prediction experiment using atypica.ai for market analysis.',
    siteName: 'Atypica Bet',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atypica Bet - Prediction Experiment',
    description: 'Learning to bet smarter with atypica.ai - an independent prediction experiment.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-black text-white antialiased">
        <div className="min-h-screen flex flex-col font-sans">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
