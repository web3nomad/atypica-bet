"use client";

import React from "react";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/5 py-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Logo, Description, and CTA in one row */}
        <div className="flex flex-row items-center justify-between gap-8 mb-20 flex-wrap">
          <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
            <div className="w-8 h-8 relative transition-all flex-shrink-0">
              <Image
                src="/images/logoicon.jpg"
                alt="ioiio Logo"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white tracking-tighter text-sm whitespace-nowrap">
                ioiio <span className="text-muted">Bet</span>
              </span>
              <p className="text-[11px] text-muted leading-relaxed font-medium uppercase tracking-widest max-w-xs mt-1">
                An AI-powered experiment in prediction markets.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-[9px] text-muted font-bold uppercase tracking-widest">
            © 2026 ioiio.bet
          </span>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-[9px] text-muted font-bold uppercase tracking-widest hover:text-white"
            >
              Security
            </a>
            <a
              href="#"
              className="text-[9px] text-muted font-bold uppercase tracking-widest hover:text-white"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
