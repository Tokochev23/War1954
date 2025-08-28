// Funções utilitárias para tratamento de dados
export const num = (v) => (Number.isFinite(+v) ? +v : 0);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const fmt = (n) => new Intl.NumberFormat("pt-BR").format(num(n));
