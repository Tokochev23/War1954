// painel-publico.js
import { formatCurrency, formatDelta, animateCounter } from "../utils.js";

const DOM = {
  countryListContainer: document.getElementById("lista-paises-publicos"),
  emptyState: document.getElementById("empty-state"),
  totalCountriesBadge: document.getElementById("total-paises-badge"),
  totalPlayers: document.getElementById("total-players"),
  pibMedio: document.getElementById("pib-medio"),
  estabilidadeMedia: document.getElementById("estabilidade-media"),
  paisesPublicos: document.getElementById("paises-publicos"),
  playerCountryName: document.getElementById("player-country-name"),
  playerCurrentTurn: document.getElementById("player-current-turn"),
  playerPib: document.getElementById("player-pib"),
  playerEstabilidade: document.getElementById("player-estabilidade"),
  playerCombustivel: document.getElementById("player-combustivel"),
  playerPibDelta: document.getElementById("player-pib-delta"),
  playerEstabilidadeDelta: document.getElementById("player-estabilidade-delta"),
  playerCombustivelDelta: document.getElementById("player-combustivel-delta"),
  playerHistorico: document.getElementById("player-historico"),
  playerNotifications: document.getElementById("player-notifications"),
  playerPanel: document.getElementById("player-panel"),
  narratorTools: document.getElementById("narrator-tools"),
  userRoleBadge: document.getElementById("user-role-badge"),
};

/* ========================= Helpers numéricos seguros ========================= */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toNumber(x) {
  // aceita "US$ 1.234.567,00" | "1.234.567,00" | "1234567.00" | 1234567
  if (typeof x === "number") return x;
  if (!x) return 0;
  const s = String(x).trim();

  // porcentagem
  if (s.endsWith("%")) return Number(s.replace("%", "").trim()) || 0;

  // moeda/pt-BR
  const normalized = s
    .replace(/[R$US$\s]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function slugify(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* ========================= Mapeamentos UI ========================= */
function getStabilityInfo(stability) {
  const n = toNumber(stability);
  if (n <= 20) return { label: "Anarquia", tone: "bg-rose-500/15 text-rose-300 border-rose-400/30" };
  if (n <= 49) return { label: "Instável", tone: "bg-amber-500/15 text-amber-300 border-amber-400/30" };
  if (n <= 74) return { label: "Neutro", tone: "bg-sky-500/15 text-sky-300 border-sky-400/30" };
  return { label: "Tranquilo", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" };
}

// WPI: média entre PIB per capita (normalizado, cap 20k => 0..100) e Tecnologia
function calculateWPI(country) {
  // Se tiver campo direto PIBpercapita, use; senão derive de PIB/Pop
  const pib = toNumber(country.PIB);
  const pop = clamp(toNumber(country.Populacao), 1, Infinity);
  const pibPc = country.PIBpercapita ? toNumber(country.PIBpercapita) : pib / pop;
  const tecnologia = clamp(toNumber(country.Tecnologia), 0, 100);

  const normPib = clamp(pibPc, 0, 20000) / 200; // 0..100
  const score = Math.round((normPib + tecnologia) / 2);
  return clamp(score, 1, 100);
}

/* ========================= Render de UI ========================= */

// bandeira pode ser emoji (ex.: "🇧🇷") ou URL de imagem; suportar ambos
function renderFlag(bandeira, pais) {
  const s = String(bandeira || "").trim();
  if (!s) {
    return `<div class="h-7 w-10 overflow-hidden rounded-md ring-1 ring-white/10 bg-slate-800"></div>`;
  }
  const looksLikeUrl = /^https?:\/\//i.test(s) || s.endsWith(".svg") || s.endsWith(".png") || s.endsWith(".jpg");
  if (looksLikeUrl) {
    return `
      <div class="h-7 w-10 overflow-hidden rounded-md ring-1 ring-white/10 bg-slate-800">
        <img src="${s}" alt="Bandeira de ${pais}" class="h-full w-full object-cover" />
      </div>`;
  }
  // emoji/HTML
  return `<div class="h-7 w-10 flex items-center justify-center rounded-md ring-1 ring-white/10 bg-slate-800 text-lg">${s}</div>`;
}

const IconTrending = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
  <polyline points="17 6 23 6 23 12" />
</svg>`;

const IconUsers = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
</svg>`;

const IconLandmark = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="22" x2="21" y2="22" />
  <line x1="6" y1="18" x2="6" y2="11" />
  <line x1="10" y1="18" x2="10" y2="11" />
  <line x1="14" y1="18" x2="14" y2="11" />
  <line x1="18" y1="18" x2="18" y2="11" />
  <polygon points="12 2 20 7 4 7 12 2" />
</svg>`;

function bar(value) {
  const width = clamp(toNumber(value), 0, 100);
  return `
    <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-800/70 ring-1 ring-white/5 overflow-hidden">
      <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300" style="width:${width}%"></div>
    </div>`;
}

function countryCardHTML(country) {
  const wpi = calculateWPI(country);
  const stabilityInfo = getStabilityInfo(country.Estabilidade);
  const pib = toNumber(country.PIB);
  const pop = toNumber(country.Populacao);
  const pibPcDisplay = formatCurrency((pib || 0) / (pop || 1));

  return `
  <button
    class="group relative w-full rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-slate-700/80 hover:shadow-md"
    data-country="${country.Pais || ""}"
    data-slug="${slugify(country.Pais || "")}"
  >
    <!-- Header: bandeira + nome + WPI -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        ${renderFlag(country.Bandeira || country.BandeiraURL, country.Pais)}
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-slate-100">${country.Pais || "País"}</div>
          <div class="text-[10px] text-slate-400">PIB pc ${pibPcDisplay}</div>
        </div>
      </div>
      <div class="shrink-0">
        <div class="grid place-items-center h-8 w-8 rounded-lg border border-white/10 bg-slate-900/70 text-[11px] font-bold text-slate-100 shadow-inner">${wpi}</div>
        <div class="mt-0.5 text-[9px] text-center uppercase text-slate-500">WPI</div>
      </div>
    </div>

    <!-- Linha 1: PIB + Pop -->
    <div class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
      <div class="rounded-md border border-white/5 bg-slate-900/50 px-2 py-1">
        <div class="flex items-center gap-1 text-slate-400">${IconTrending} PIB</div>
        <div class="mt-0.5 font-medium text-slate-100 leading-none">${formatCurrency(pib)}</div>
      </div>
      <div class="rounded-md border border-white/5 bg-slate-900/50 px-2 py-1">
        <div class="flex items-center gap-1 text-slate-400">${IconUsers} Pop.</div>
        <div class="mt-0.5 font-medium text-slate-100 leading-none">${(pop || 0).toLocaleString("pt-BR")}</div>
      </div>
    </div>

    <!-- Linha 2: Modelo + Estabilidade (texto) -->
    <div class="mt-2 flex items-center justify-between gap-2">
      <div class="truncate text-[11px] text-slate-300" title="${country.ModeloPolitico || ""}">
        <span class="text-slate-400">Modelo:</span> ${country.ModeloPolitico || "—"}
      </div>
      <span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${stabilityInfo.tone}">
        ${stabilityInfo.label}
      </span>
    </div>

    <!-- Urbanização bar -->
    <div class="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
      ${IconLandmark} Urbanização
      <span class="ml-auto text-slate-300">${clamp(toNumber(country.Urbanizacao), 0, 100)}%</span>
    </div>
    ${bar(country.Urbanizacao)}
  </button>
`;
}

/* ========================= Render principal ========================= */
export function renderPublicCountries(countries) {
  DOM.countryListContainer.innerHTML = "";

  // Considera “válido” quando tem os campos essenciais definidos (pode ser 0)
  const validCountries = (countries || []).filter((c) => {
    const has = (k) => c[k] !== undefined && c[k] !== null && String(c[k]).trim() !== "";
    return has("Pais") && (has("Bandeira") || has("BandeiraURL")) && has("PIB") && has("Populacao") &&
           has("ModeloPolitico") && has("Estabilidade") && has("Urbanizacao") && has("Tecnologia");
  });

  // Ordene como quiser (ex.: por WPI desc)
  validCountries.sort((a, b) => calculateWPI(b) - calculateWPI(a));

  // Render
  const html = validCountries.map(countryCardHTML).join("");
  DOM.countryListContainer.innerHTML = html;

  // Clique → navegação (ajuste a URL/roteador)
  DOM.countryListContainer
    .querySelectorAll("button[data-slug]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = btn.getAttribute("data-slug");
        // Ex.: /pais/<slug>  (troque se usar hash/router)
        window.location.href = `/pais/${slug}`;
      });
    });

  // Empty state + badge
  if (DOM.totalCountriesBadge) DOM.totalCountriesBadge.textContent = `${validCountries.length} países`;
  if (validCountries.length === 0) {
    DOM.emptyState?.classList.remove("hidden");
  } else {
    DOM.emptyState?.classList.add("hidden");
  }
}

/* ========================= KPIs (sem mudanças grandes) ========================= */
export function updateKPIs(allCountries) {
  const activePlayers = (allCountries || []).filter((c) => c.Player);

  const pibs = activePlayers.map((c) => toNumber(c.PIB));
  const stabilities = activePlayers.map((c) => clamp(toNumber(c.Estabilidade), 0, 100));

  const avgPib = pibs.length ? pibs.reduce((s, n) => s + n, 0) / pibs.length : 0;
  const avgStability = stabilities.length ? stabilities.reduce((s, n) => s + n, 0) / stabilities.length : 0;
  const publicCountries = (allCountries || []).filter(
    (c) => (c.Visibilidade || "").toLowerCase().startsWith("público") || (c.Visibilidade || "").toLowerCase().startsWith("publico")
  ).length;

  animateCounter("total-players", activePlayers.length);
  if (DOM.pibMedio) DOM.pibMedio.textContent = formatCurrency(avgPib);
  if (DOM.estabilidadeMedia) DOM.estabilidadeMedia.textContent = `${Math.round(avgStability)}/100`;
  animateCounter("paises-publicos", publicCountries);
}

/* ========================= Painel do jogador (igual ao seu, com toNumber) ========================= */
export function fillPlayerPanel(playerData, currentTurn) {
  if (playerData) {
    DOM.playerCountryName.textContent = playerData.Pais || "País do Jogador";
    DOM.playerCurrentTurn.textContent = currentTurn;
    DOM.playerPib.textContent = formatCurrency(toNumber(playerData.PIB));
    DOM.playerEstabilidade.textContent = `${clamp(toNumber(playerData.Estabilidade), 0, 100)}/100`;
    DOM.playerCombustivel.textContent = playerData.Combustivel || "50";

    DOM.playerPibDelta.innerHTML = '<span class="text-slate-400">Sem histórico</span>';
    DOM.playerEstabilidadeDelta.innerHTML = '<span class="text-slate-400">Sem histórico</span>';
    DOM.playerCombustivelDelta.innerHTML = '<span class="text-slate-400">Sem histórico</span>';

    DOM.playerHistorico.innerHTML = `
      <div class="text-sm text-slate-300 border-l-2 border-emerald-500/30 pl-3 mb-2">
        <div class="font-medium">Turno ${currentTurn} (atual)</div>
        <div class="text-xs text-slate-400">
          PIB: ${formatCurrency(toNumber(playerData.PIB))} • 
          Estab: ${clamp(toNumber(playerData.Estabilidade), 0, 100)}/100 • 
          Pop: ${(toNumber(playerData.Populacao) || 0).toLocaleString("pt-BR")}
        </div>
      </div>
      <div class="text-sm text-slate-300 border-l-2 border-blue-500/30 pl-3 mb-2">
        <div class="font-medium">Dados Iniciais</div>
        <div class="text-xs text-slate-400">
          Tecnologia: ${clamp(toNumber(playerData.Tecnologia), 0, 100)} • 
          Urbanização: ${clamp(toNumber(playerData.Urbanizacao), 0, 100)}% • 
          Burocracia: ${clamp(toNumber(playerData.Burocracia), 0, 100)}%
        </div>
      </div>
      <div class="text-sm text-slate-300 border-l-2 border-purple-500/30 pl-3">
        <div class="font-medium">Forças Militares</div>
        <div class="text-xs text-slate-400">
          ⚔️ Exército: ${toNumber(playerData.Exercito)} • 
          🚢 Marinha: ${toNumber(playerData.Marinha)} • 
          ✈️ Aeronáutica: ${toNumber(playerData.Aeronautica)}
        </div>
      </div>
    `;

    const isTurnLate = toNumber(playerData.TurnoUltimaAtualizacao) < toNumber(currentTurn);
    isTurnLate ? DOM.playerNotifications.classList.remove("hidden") : DOM.playerNotifications.classList.add("hidden");

    DOM.playerPanel.style.display = "block";
  } else {
    DOM.playerCountryName.textContent = "Carregando...";
    DOM.playerHistorico.innerHTML = '<div class="text-sm text-slate-400 italic">Nenhum histórico disponível</div>';
    DOM.playerPanel.style.display = "none";
  }
}
