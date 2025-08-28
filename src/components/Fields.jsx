// Componentes de input para o formulário do narrador
import React from 'react';

export function Field({ label, value, onChange, placeholder, className }) {
    return (
        <label className={`text-sm ${className}`}>
            <div className="mb-1 text-slate-300">{label}</div>
            <input
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-slate-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}

export function NumberField({ label, value, onChange, className }) {
    return (
        <label className={`text-sm ${className}`}>
            <div className="mb-1 text-slate-300">{label}</div>
            <input
                type="number"
                step="any"
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-slate-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

export function ReadOnlyField({ label, value, className }) {
    return (
        <div className={`text-sm rounded-xl bg-white/5 border border-white/10 p-3 ${className}`}>
            <div className="text-slate-300 mb-1">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    );
}

export function SelectLevel({ label, value, onChange, className }) {
    return (
        <label className={`text-sm ${className}`}>
            <div className="mb-1 text-slate-300">{label}</div>
            <select
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-slate-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
            </select>
        </label>
    );
}
