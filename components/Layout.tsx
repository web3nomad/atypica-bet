
import React from 'react';
import { User, Menu } from 'lucide-react';
import DiceHexagon from './DiceHexagon';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.hash = '#'}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-all group-hover:rotate-12">
              <DiceHexagon className="text-black w-5 h-5 fill-current" />
            </div>
            <span className="text-sm font-black tracking-tight text-white uppercase letter-spacing-tight">
              Atypica <span className="text-muted">Bet</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-[11px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors">Matrix</a>
            <a href="#" className="text-[11px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors">Models</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="btn-outline px-6 py-2 text-[11px] font-bold uppercase tracking-widest">
              Connect
            </button>
            <button className="md:hidden p-2 text-white">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-black border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-2 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                  <DiceHexagon className="text-black w-3 h-3 fill-current" />
                </div>
                <span className="font-bold text-white uppercase tracking-tighter text-xs">Atypica Bet</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed font-medium uppercase tracking-widest max-w-xs">
                Objective predictive intelligence <br /> Powered by mathematical certainty.
              </p>
            </div>
            {['Engine', 'Network', 'Connect'].map((title, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">{title}</h4>
                <ul className="space-y-3 text-[10px] text-muted font-bold uppercase tracking-widest">
                  <li><a href="#" className="hover:text-white transition-colors">Core API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Research Paper</a></li>
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[9px] text-muted font-bold uppercase tracking-widest">© 2024 ATYPICA SYSTEM. NO RIGHTS RESERVED BY MACHINES.</span>
            <div className="flex gap-8">
              <a href="#" className="text-[9px] text-muted font-bold uppercase tracking-widest hover:text-white">Security</a>
              <a href="#" className="text-[9px] text-muted font-bold uppercase tracking-widest hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
