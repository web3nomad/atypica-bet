'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 relative transition-all group-hover:scale-105">
            <Image
              src="/images/logoicon.jpg"
              alt="Atypica Bet Logo"
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
          <span className="text-sm font-black tracking-tight text-white uppercase letter-spacing-tight">
            Atypica <span className="text-muted">Bet</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-[11px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors hidden">Matrix</a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="https://atypica.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors"
          >
            Using atypica.ai
          </a>
          <button className="btn-outline px-6 py-2 text-[11px] font-bold uppercase tracking-widest hidden">
            Connect
          </button>
          <button className="md:hidden p-2 text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
