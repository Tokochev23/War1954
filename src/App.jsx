// Componente principal
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Landmark, Users, Wheat, Fuel, Pickaxe, Calculator, Save, RefreshCcw, Flag,
  RotateCcw, Plus, Trash2, CheckCircle, XCircle, Search, Database, Globe2,
  ChevronRight,
} from "lucide-react";

import { TUNING } from "./tuning";
import { num, clamp, fmt } from "./utils";
import { fetchPaises, fetchPais, savePais, deletePais } from './services/paises';
import { Field, NumberField, ReadOnlyField, SelectLevel } from './components/Fields';
import { SaldoBadge } from './components/StatCards';

const initialState = {
  id: "",
  name: "",
  era: "1954",
  flag: "🏳️",
  pib: "",
  populacao: "",
  tec: "",
  estabilidade: "",
  burocracia: "",
  urbanizacao: "",
  fertilidadeSolo: 3,
  pocoTamanho: "",
  pocoNivel: 3,
  minaTamanho: "",
  teorMinerio: 3,
  orcamento: "",
  exercito: "",
  veiculos: "",
  marinha: "",
  aeronautica: "",
  gastos_fa: "",
  em_guerra: 'NAO',
  player_id: '',
};

function CountriesList({ countries, setForm }) {
    return (
        <section className="mt-6 p-6 rounded-3xl border border-white/10 bg-white/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                Países do Mundo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {countries.length > 0 ? countries.map((c) => (
                    <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35 }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-2xl" title={c.name}>{c.flag}</div>
                            <span className="text-xs text-white/60">{c.id}</span>
                        </div>
                        <h3 className="mt-2 font-semibold tracking-tight text-lg">{c.name}</h3>
                        <dl className="mt-2 text-sm">
                            <dt className="text-gray-400">PIB</dt>
                            <dd className="font-medium">${" "}{c.pib?.toLocaleString("pt-BR")} mi</dd>
                            <dt className="text-gray-400 mt-2">População</dt>
                            <dd className="font-medium">{c.populacao?.toLocaleString("pt-BR")}</dd>
                            <dt className="text-gray-400 mt-2">Estabilidade</dt>
                            <dd className="font-medium">{c.estabilidade}/100</dd>
                        </dl>
                        <button
                            onClick={() => {
                                setForm(c);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="mt-3 inline-flex items-center gap-2 text-amber-300 hover:text-amber-200"
                        >
                            Editar <ChevronRight className="h-4 w-4" />
                        </button>
                    </motion.div>
                )) : (
                    <div className="col-span-full text-center text-gray-500 p-8">Nenhum país público encontrado. Adicione um!</div>
                )}
            </div>
        </section>
    );
}

export default function App() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
      const unsubscribe = fetchPaises(setCountries);
      return () => unsubscribe();
  }, []);

  const pibPerCapita = useMemo(() => {
      const p = num(form.pib);
      const pop = Math.max(1, num(form.populacao));
      return p / pop;
  }, [form.pib, form.populacao]);

  const popUrbana = useMemo(
      () => Math.round(num(form.populacao) * clamp(num(form.urbanizacao) / 100, 0, 1)),
      [form.populacao, form.urbanizacao]
  );
  const popRural = useMemo(
      () => Math.max(0, num(form.populacao) - popUrbana),
      [form.populacao, popUrbana]
  );
  
  const techMultFood = useMemo(
    () => 1 + clamp(num(form.tec), 0, 100) * (TUNING.techFoodAlpha / 100),
    [form.tec]
  );
  const techMultFuel = useMemo(
    () => 1 + clamp(num(form.tec), 0, 100) * (TUNING.techFuelAlpha / 100),
    [form.tec]
  );
  const techMultMetal = useMemo(
    () => 1 + clamp(num(form.tec), 0, 100) * (TUNING.techMetalAlpha / 100),
    [form.tec]
  );

  const levelMultFood = useMemo(
    () => TUNING.level[clamp(num(form.fertilidadeSolo), 1, 5)],
    [form.fertilidadeSolo]
  );
  const levelMultFuel = useMemo(
    () => TUNING.level[clamp(num(form.pocoNivel), 1, 5)],
    [form.pocoNivel]
  );
  const levelMultMetal = useMemo(
    () => TUNING.level[clamp(num(form.teorMinerio), 1, 5)],
    [form.teorMinerio]
  );

  const foodProd = useMemo(() => {
    const base = popRural * TUNING.baseFoodPerRuralCapita;
    return base * levelMultFood * techMultFood;
  }, [popRural, levelMultFood, techMultFood]);

  const foodCons = useMemo(
    () => num(form.populacao) * TUNING.foodConsumptionPerCapita,
    [form.populacao]
  );
  const foodSaldo = useMemo(() => foodProd - foodCons, [foodProd, foodCons]);

  const fuelProd = useMemo(() => {
    const sizeBbl = num(form.pocoTamanho) * TUNING.fuelSizeUnitToBbl;
    return sizeBbl * levelMultFuel * techMultFuel;
  }, [form.pocoTamanho, levelMultFuel, techMultFuel]);

  const metalProd = useMemo(() => {
    const sizeTon = num(form.minaTamanho) * TUNING.metalSizeUnitToTon;
    return sizeTon * levelMultMetal * techMultMetal;
  }, [form.minaTamanho, levelMultMetal, techMultMetal]);
  
  const orcamentoCalculado = useMemo(() => {
    const pibFloat = num(form.pib);
    const estabilidadeFloat = num(form.estabilidade) / 100;
    const tecnologiaFloat = num(form.tec) / 100;
    const taxaOrcamento = TUNING.orcamentoPIBBase + (estabilidadeFloat * TUNING.orcamentoPIBEstabilidade) + (tecnologiaFloat * TUNING.orcamentoPIBTecnologia);
    return pibFloat * taxaOrcamento;
  }, [form.pib, form.estabilidade, form.tec]);

  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSearch = async () => {
    if (!form.id) {
        setStatus({ message: "Por favor, insira o ID do país para buscar.", type: "error" });
        return;
    }
    setIsSearching(true);
    setStatus({ message: "", type: "" });
    try {
        const data = await fetchPais(form.id);
        if (data) {
            setForm({
              id: data.id,
              name: data.name || '',
              era: data.era || '1954',
              flag: data.flag || '🏳️',
              pib: data.pib || '',
              populacao: data.populacao || '',
              tec: data.tecnologia || '',
              estabilidade: data.estabilidade || '',
              burocracia: data.burocracia || '',
              urbanizacao: data.urbanizacao || '',
              fertilidadeSolo: data.fertilidadeSolo || 3,
              pocoTamanho: data.pocoTamanho || '',
              pocoNivel: data.pocoNivel || 3,
              minaTamanho: data.minaTamanho || '',
              teorMinerio: data.teorMinerio || 3,
              orcamento: data.orcamento || '',
              exercito: data.exercito || '',
              veiculos: data.veiculos || '',
              marinha: data.marinha || '',
              aeronautica: data.aeronautica || '',
              gastos_fa: data.gastos_fa || '',
              em_guerra: data.em_guerra ? 'SIM' : 'NAO',
              player_id: data.player_id || '',
            });
            setStatus({ message: `País "${data.name}" (${data.id}) carregado com sucesso.`, type: "success" });
        } else {
            setStatus({ message: `País com ID "${form.id}" não encontrado.`, type: "error" });
        }
    } catch (e) {
        console.error("Erro ao buscar documento: ", e);
        setStatus({ message: "Erro ao buscar o país. Verifique o ID e a conexão.", type: "error" });
    } finally {
        setIsSearching(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ message: "", type: "" });

    if (!form.id) {
        setStatus({ message: "O ID do país é obrigatório.", type: "error" });
        setIsSaving(false);
        return;
    }

    const dataToSave = {
        name: form.name,
        era: form.era,
        flag: form.flag,
        pib: num(form.pib),
        populacao: num(form.populacao),
        pib_per_capita: pibPerCapita,
        tecnologia: num(form.tec),
        estabilidade: num(form.estabilidade),
        burocracia: num(form.burocracia),
        urbanizacao: num(form.urbanizacao),
        fertilidadeSolo: num(form.fertilidadeSolo),
        pop_urbana: popUrbana,
        pop_rural: popRural,
        producao_comida: foodProd,
        consumo_comida: foodCons,
        saldo_comida: foodSaldo,
        pocoTamanho: num(form.pocoTamanho),
        pocoNivel: num(form.pocoNivel),
        producao_combustivel: fuelProd,
        minaTamanho: num(form.minaTamanho),
        teorMinerio: num(form.teorMinerio),
        producao_metal: metalProd,
        orcamento: orcamentoCalculado,
        exercito: num(form.exercito),
        veiculos: num(form.veiculos),
        marinha: num(form.marinha),
        aeronautica: num(form.aeronautica),
        gastos_fa: num(form.gastos_fa),
        em_guerra: form.em_guerra === "SIM",
        player_id: form.player_id || null,
        visibilidade: "publico",
    };

    try {
        await savePais(form.id, dataToSave);
        setStatus({
            message: `País "${form.name}" (${form.id}) salvo com sucesso!`,
            type: "success",
        });
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        setStatus({
            message: "Erro ao salvar o país. Verifique a conexão e permissões.",
            type: "error",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) {
        setStatus({ message: "Selecione um país para deletar.", type: "error" });
        return;
    }
    setIsDeleting(true);
    try {
        await deletePais(form.id);
        setStatus({
            message: `País "${form.id}" deletado com sucesso.`,
            type: "success",
        });
        setForm(initialState);
    } catch (e) {
        console.error("Erro ao deletar documento: ", e);
        setStatus({ message: "Erro ao deletar o país.", type: "error" });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-6xl space-y-6"
      >
        {/* HEADER */}
        <header className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 grid place-items-center shadow-lg shadow-rose-500/20">
            <Landmark className="h-6 w-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Narrador • Construtor de País</h1>
            <p className="text-sm text-slate-300">Preencha os dados brutos; o sistema calcula o resto.</p>
          </div>
        </header>

        {/* STATUS / MENSAGENS */}
        {status.message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${
              status.type === "success"
                ? "bg-emerald-600/20 text-emerald-300"
                : status.type === "info"
                ? "bg-blue-600/20 text-blue-300"
                : "bg-red-600/20 text-red-300"
            }`}
          >
            {status.type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span>{status.message}</span>
          </motion.div>
        )}

        {/* IDENTIFICAÇÃO E AÇÃO */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Field
              label="ID (ex.: BRA)"
              value={form.id}
              onChange={(v) => patch("id", v.toUpperCase())}
              placeholder="BRA"
              className="md:col-span-1"
            />
            <Field
              label="Nome do País"
              value={form.name}
              onChange={(v) => patch("name", v)}
              placeholder="Brasil"
              className="md:col-span-2"
            />
            <Field
              label="Bandeira"
              value={form.flag}
              onChange={(v) => patch("flag", v)}
              placeholder="🇧🇷"
              className="md:col-span-1"
            />
            <div className="rounded-xl border border-white/10 p-3 flex items-center justify-center md:col-span-1">
              <div className="text-4xl">{form.flag}</div>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !form.id}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors px-6 py-3 disabled:bg-blue-500/50"
            >
              {isSearching ? <RotateCcw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Buscar País
            </button>
            <button
              type="button"
              onClick={() => setForm(initialState)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors px-6 py-3"
            >
              <Plus className="h-5 w-5" /> Novo País
            </button>
          </div>
        </section>

        {/* ECONOMIA / SOCIEDADE */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Users className="h-4 w-4" /> Economia & Sociedade</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <NumberField label="PIB" value={form.pib} onChange={(v) => patch("pib", +v)} />
            <NumberField label="População" value={form.populacao} onChange={(v) => patch("populacao", +v)} />
            <ReadOnlyField label="PIB per Capita" value={`£ ${fmt(pibPerCapita.toFixed(2))}`} />
            <ReadOnlyField label="Pop. Rural" value={fmt(popRural)} />
            <NumberField label="Urbanização (%)" value={form.urbanizacao} onChange={(v) => patch("urbanizacao", clamp(+v, 0, 100))} />
            <ReadOnlyField label="Pop. Urbana" value={fmt(popUrbana)} />
            <NumberField label="Tec (0–100)" value={form.tec} onChange={(v) => patch("tec", clamp(+v, 0, 100))} />
            <NumberField label="Estabilidade (%)" value={form.estabilidade} onChange={(v) => patch("estabilidade", clamp(+v, 0, 100))} />
          </div>
          <div className="mt-4">
            <ReadOnlyField label="Orçamento Calculado" value={`£ ${fmt(orcamentoCalculado.toFixed(0))}`} />
          </div>
        </section>

        {/* COMIDA */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Wheat className="h-4 w-4" /> Produção de Comida</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SelectLevel label="Fertilidade do Solo (1–5)" value={form.fertilidadeSolo} onChange={(v) => patch("fertilidadeSolo", +v)} />
            <ReadOnlyField label="Produção (t/turno)" value={fmt(foodProd.toFixed(3))} />
            <ReadOnlyField label="Consumo (t/turno)" value={fmt(foodCons.toFixed(3))} />
            <ReadOnlyField label="Saldo (t/turno)" value={fmt(foodSaldo.toFixed(3))} />
          </div>
          <SaldoBadge value={foodSaldo} unit="t/turno" />
        </section>

        {/* COMBUSTÍVEL */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Fuel className="h-4 w-4" /> Produção de Combustível</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <NumberField label="Tamanho do Poço (size)" value={form.pocoTamanho} onChange={(v) => patch("pocoTamanho", +v)} />
            <SelectLevel label="Nível do Poço (1–5)" value={form.pocoNivel} onChange={(v) => patch("pocoNivel", +v)} />
            <ReadOnlyField label="Produção (bbl/turno)" value={fmt(fuelProd.toFixed(0))} />
            <ReadOnlyField label="Multiplicador (Tec.)" value={`× ${techMultFuel.toFixed(2)}`} />
          </div>
        </section>

        {/* METAL */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Pickaxe className="h-4 w-4" /> Produção de Metal</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <NumberField label="Tamanho da Mina (size)" value={form.minaTamanho} onChange={(v) => patch("minaTamanho", +v)} />
            <SelectLevel label="Teor do Minério (1–5)" value={form.teorMinerio} onChange={(v) => patch("teorMinerio", +v)} />
            <ReadOnlyField label="Produção (t/turno)" value={fmt(metalProd.toFixed(0))} />
            <ReadOnlyField label="Multiplicador (Tec.)" value={`× ${techMultMetal.toFixed(2)}`} />
          </div>
        </section>

        {/* AÇÕES */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-slate-900 px-4 py-2 font-semibold disabled:bg-amber-400/50"
          >
            {isSaving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar País no Firebase'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || !form.id}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 text-white px-4 py-2 font-semibold disabled:bg-red-500/50"
          >
            {isDeleting ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Deletar País
          </button>
        </div>
      </motion.div>
      <CountriesList setForm={setForm} countries={countries} />
    </div>
  );
}

function CountriesList({ countries, setForm }) {
    return (
        <section className="mt-6 p-6 rounded-3xl border border-white/10 bg-white/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                Países do Mundo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {countries.length > 0 ? countries.map((c) => (
                    <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35 }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-2xl" title={c.name}>{c.flag}</div>
                            <span className="text-xs text-white/60">{c.id}</span>
                        </div>
                        <h3 className="mt-2 font-semibold tracking-tight text-lg">{c.name}</h3>
                        <dl className="mt-2 text-sm">
                            <dt className="text-gray-400">PIB</dt>
                            <dd className="font-medium">${" "}{c.pib?.toLocaleString("pt-BR")} mi</dd>
                            <dt className="text-gray-400 mt-2">População</dt>
                            <dd className="font-medium">{c.populacao?.toLocaleString("pt-BR")}</dd>
                            <dt className="text-gray-400 mt-2">Estabilidade</dt>
                            <dd className="font-medium">{c.estabilidade}/100</dd>
                        </dl>
                        <button
                            onClick={() => {
                                setForm(c);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="mt-3 inline-flex items-center gap-2 text-amber-300 hover:text-amber-200"
                        >
                            Editar <ChevronRight className="h-4 w-4" />
                        </button>
                    </motion.div>
                )) : (
                    <div className="col-span-full text-center text-gray-500 p-8">Nenhum país público encontrado. Adicione um!</div>
                )}
            </div>
        </section>
    );
}

// -------------------- UI helpers --------------------
function Field({ label, value, onChange, placeholder, className }) {
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

function NumberField({ label, value, onChange, className }) {
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

function ReadOnlyField({ label, value, className }) {
    return (
        <div className={`text-sm rounded-xl bg-white/5 border border-white/10 p-3 ${className}`}>
            <div className="text-slate-300 mb-1">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    );
}

function SelectLevel({ label, value, onChange, className }) {
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

function SaldoBadge({ value, unit }) {
    const ok = value >= 0;
    return (
        <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm ${ok ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
            <Calculator className="h-4 w-4" /> {ok ? 'Superávit' : 'Déficit'}: <b>{fmt(value.toFixed(3))}</b> {unit}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
