"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-visible">
      <div className="text-2xl font-black text-white mb-0.5">{value}</div>
      <div className="text-[10px] text-muted font-bold uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
};
