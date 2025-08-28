// Componentes de exibição para estatísticas
import React from 'react';
import { lucide } from 'lucide-react';
import { fmt } from '../utils';

export function SaldoBadge({ value, unit }) {
  const ok = value >= 0;
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm ${ok ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
      <lucide.Calculator className="h-4 w-4" /> {ok ? 'Superávit' : 'Déficit'}: <b>{fmt(value.toFixed(3))}</b> {unit}
    </div>
  );
}

export function MiniMetric({ title, value, trend }) {
  const negative = typeof trend === "string" && trend.trim().startsWith("-");
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      <div className={`text-xs ${negative ? "text-rose-300" : "text-emerald-300"}`}>{trend}</div>
    </div>
  );
}
