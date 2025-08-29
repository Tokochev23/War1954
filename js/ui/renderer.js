import { formatCurrency, formatDelta, animateCounter } from "../utils.js";

const DOM = {
    countryListContainer: document.getElementById('lista-paises-publicos'),
    emptyState: document.getElementById('empty-state'),
    totalCountriesBadge: document.getElementById('total-paises-badge'),
    totalPlayers: document.getElementById('total-players'),
    pibMedio: document.getElementById('pib-medio'),
    estabilidadeMedia: document.getElementById('estabilidade-media'),
    paisesPublicos: document.getElementById('paises-publicos'),
    playerCountryName: document.getElementById('player-country-name'),
    playerCurrentTurn: document.getElementById('player-current-turn'),
    playerPib: document.getElementById('player-pib'),
    playerEstabilidade: document.getElementById('player-estabilidade'),
    playerCombustivel: document.getElementById('player-combustivel'),
    playerPibDelta: document.getElementById('player-pib-delta'),
    playerEstabilidadeDelta: document.getElementById('player-estabilidade-delta'),
    playerCombustivelDelta: document.getElementById('player-combustivel-delta'),
    playerHistorico: document.getElementById('player-historico'),
    playerNotifications: document.getElementById('player-notifications'),
    playerPanel: document.getElementById('player-panel'),
    narratorTools: document.getElementById('narrator-tools'),
    userRoleBadge: document.getElementById('user-role-badge'),
};

/**
 * Função para limitar um valor entre um mínimo e um máximo.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

/**
 * Mapeia um valor de estabilidade para uma string descritiva.
 * @param {number} stability - O valor de estabilidade (0-100).
 * @returns {{label: string, tone: string}} - A string e as classes de cor.
 */
function getStabilityInfo(stability) {
    if (stability <= 20) return { label: "Anarquia", tone: "bg-rose-500/15 text-rose-300 border-rose-400/30" };
    if (stability <= 49) return { label: "Instável", tone: "bg-amber-500/15 text-amber-300 border-amber-400/30" };
    if (stability <= 74) return { label: "Neutro", tone: "bg-sky-500/15 text-sky-300 border-sky-400/30" };
    return { label: "Tranquilo", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" };
}

/**
 * Calcula o WPI (War Power Index) com base no PIB per capita e Tecnologia.
 * @param {object} country - Objeto com os dados do país.
 * @returns {number} - O WPI calculado.
 */
function calculateWPI(country) {
    const pibPerCapita = (parseFloat(country.PIB) || 0) / (parseFloat(country.Populacao) || 1);
    const normalizedPib = clamp(pibPerCapita, 0, 20000) / 200; // Normaliza para 0..100
    const score = Math.round((normalizedPib + (parseFloat(country.Tecnologia) || 0)) / 2);
    return clamp(score, 1, 100);
}

// Renderiza a lista de países
export function renderPublicCountries(countries) {
    DOM.countryListContainer.innerHTML = '';
    
    // Filtra para mostrar apenas países com dados essenciais para o novo painel
    const validCountries = countries.filter(country => country.Pais && country.Bandeira && country.PIB && country.Populacao && country.ModeloPolitico && country.Estabilidade && country.Urbanizacao && country.Tecnologia);

    validCountries.forEach((country) => {
        const wpi = calculateWPI(country);
        const stabilityInfo = getStabilityInfo(parseFloat(country.Estabilidade) || 0);
        const formattedPib = formatCurrency(country.PIB || '0');
        const formattedPopulation = Number(country.Populacao || 0).toLocaleString('pt-BR');
        
        const cardHtml = `
        <button class="group relative w-full rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-slate-700/80 hover:shadow-md">
            <!-- Header: bandeira + nome + WPI -->
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <div class="h-7 w-10 flex-shrink-0 grid place-items-center rounded-md ring-1 ring-white/10 bg-slate-800 text-2xl">
                        ${country.Bandeera}
                    </div>
                    <div class="min-w-0">
                        <div class="truncate text-sm font-semibold text-slate-100">
                            ${country.Pais}
                        </div>
                        <div class="text-[10px] text-slate-400">PIB pc ${formatCurrency((parseFloat(country.PIB) || 0) / (parseFloat(country.Populacao) || 1))}</div>
                    </div>
                </div>
                <div class="shrink-0">
                    <div class="grid place-items-center h-8 w-8 rounded-lg border border-white/10 bg-slate-900/70 text-[11px] font-bold text-slate-100 shadow-inner">
                        ${wpi}
                    </div>
                    <div class="mt-0.5 text-[9px] text-center uppercase text-slate-500">WPI</div>
                </div>
            </div>

            <!-- Linha 1: PIB + Pop -->
            <div class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div class="rounded-md border border-white/5 bg-slate-900/50 px-2 py-1">
                    <div class="flex items-center gap-1 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                            <polyline points="16 17 22 17 22 11"></polyline>
                        </svg>
                        PIB
                    </div>
                    <div class="mt-0.5 font-medium text-slate-100 leading-none">${formattedPib}</div>
                </div>
                <div class="rounded-md border border-white/5 bg-slate-900/50 px-2 py-1">
                    <div class="flex items-center gap-1 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Pop.
                    </div>
                    <div class="mt-0.5 font-medium text-slate-100 leading-none">${formattedPopulation}</div>
                </div>
            </div>

            <!-- Linha 2: Modelo + Estabilidade (texto) -->
            <div class="mt-2 flex items-center justify-between gap-2">
                <div class="truncate text-[11px] text-slate-300" title="${country.ModeloPolitico}">
                    <span class="text-slate-400">Modelo:</span> ${country.ModeloPolitico}
                </div>
                <span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${stabilityInfo.tone}">
                    ${stabilityInfo.label}
                </span>
            </div>

            <!-- Urbanização bar -->
            <div class="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="2" width="18" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="6" x2="12" y2="18"></line>
                    <line x1="6" y1="12" x2="18" y2="12"></line>
                </svg>
                Urbanização
                <span class="ml-auto text-slate-300">${country.Urbanizacao}%</span>
            </div>
            <div class="mt-1 h-1.5 w-full rounded-full bg-slate-800/70 ring-1 ring-white/5 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300" style="width: ${clamp(country.Urbanizacao, 0, 100)}%"></div>
            </div>
        </button>
        `;
        DOM.countryListContainer.innerHTML += cardHtml;
    });

    DOM.totalCountriesBadge.textContent = `${validCountries.length} países`;
    if (validCountries.length === 0) {
        DOM.emptyState.classList.remove('hidden');
    } else {
        DOM.emptyState.classList.add('hidden');
    }
}

// Atualiza os KPIs principais
export function updateKPIs(allCountries) {
    const activePlayers = allCountries.filter(c => c.Player);
    
    const pibs = activePlayers.map(c => parseFloat(String(c.PIB).replace(/[$.]+/g, '').replace(',', '.')) || 0);
    const stabilities = activePlayers.map(c => parseFloat(String(c.Estabilidade).replace(/%/g, '')) || 0);

    const avgPib = pibs.length > 0 ? pibs.reduce((sum, p) => sum + p, 0) / pibs.length : 0;
    const avgStability = stabilities.length > 0 ? stabilities.reduce((sum, s) => sum + s, 0) / stabilities.length : 0;
    const publicCountries = allCountries.filter(c => c.Visibilidade && c.Visibilidade.trim() === 'Público').length;

    animateCounter('total-players', activePlayers.length);
    DOM.pibMedio.textContent = formatCurrency(avgPib);
    DOM.estabilidadeMedia.textContent = `${Math.round(avgStability)}/100`;
    animateCounter('paises-publicos', publicCountries);
}

// Preenche o painel do jogador com seus dados
export function fillPlayerPanel(playerData, currentTurn) {
    if (playerData) {
        DOM.playerCountryName.textContent = playerData.Pais || 'País do Jogador';
        DOM.playerCurrentTurn.textContent = currentTurn;
        DOM.playerPib.textContent = formatCurrency(playerData.PIB || 0);
        DOM.playerEstabilidade.textContent = `${Number(playerData.Estabilidade) || 0}/100`;
        DOM.playerCombustivel.textContent = playerData.Combustivel || '50';
        
        // Deltas (variações) - aprimorar depois
        DOM.playerPibDelta.innerHTML = '<span class="text-slate-400">Sem histórico</span>';
        DOM.playerEstabilidadeDelta.innerHTML = '<span class="text-slate-400">Sem histórico</span>';
        DOM.playerCombustivelDelta.innerHTML = '<span class="text-slate-400">Sem histórico</span>';
        
        // Histórico simulado
        DOM.playerHistorico.innerHTML = `
            <div class="text-sm text-slate-300 border-l-2 border-emerald-500/30 pl-3 mb-2">
                <div class="font-medium">Turno ${currentTurn} (atual)</div>
                <div class="text-xs text-slate-400">
                    PIB: ${formatCurrency(playerData.PIB)} • 
                    Estab: ${playerData.Estabilidade}/100 • 
                    Pop: ${Number(playerData.Populacao || 0).toLocaleString()}
                </div>
            </div>
            <div class="text-sm text-slate-300 border-l-2 border-blue-500/30 pl-3 mb-2">
                <div class="font-medium">Dados Iniciais</div>
                <div class="text-xs text-slate-400">
                    Tecnologia: ${playerData.Tecnologia || 0} • 
                    Urbanização: ${playerData.Urbanizacao || 0}% • 
                    Burocracia: ${playerData.Burocracia || 0}%
                </div>
            </div>
            <div class="text-sm text-slate-300 border-l-2 border-purple-500/30 pl-3">
                <div class="font-medium">Forças Militares</div>
                <div class="text-xs text-slate-400">
                    ⚔️ Exército: ${playerData.Exercito || 0} • 
                    🚢 Marinha: ${playerData.Marinha || 0} • 
                    ✈️ Aeronáutica: ${playerData.Aeronautica || 0}
                </div>
            </div>
        `;
        
        const isTurnLate = playerData.TurnoUltimaAtualizacao < currentTurn;
        isTurnLate ? DOM.playerNotifications.classList.remove('hidden') : DOM.playerNotifications.classList.add('hidden');

        DOM.playerPanel.style.display = 'block';
    } else {
        DOM.playerCountryName.textContent = 'Carregando...';
        DOM.playerHistorico.innerHTML = '<div class="text-sm text-slate-400 italic">Nenhum histórico disponível</div>';
        DOM.playerPanel.style.display = 'none';
    }
}
