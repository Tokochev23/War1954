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
    countryPanelModal: document.getElementById('country-panel-modal'),
    countryPanelContent: document.getElementById('country-panel-content'),
    closeCountryPanelBtn: document.getElementById('close-country-panel'),
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
 * Mapeia um valor de estabilidade para uma string descritiva e classes de cor.
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
    const score = Math.round((normalizedPib * 0.45) + (parseFloat(country.Tecnologia) || 0) * 0.55);
    return clamp(score, 1, 100);
}

// Renderiza a lista de países
export function renderPublicCountries(countries) {
    DOM.countryListContainer.innerHTML = '';
    
    const validCountries = countries.filter(country => country.Pais && country.Bandeira && country.PIB && country.Populacao && country.ModeloPolitico && country.Estabilidade && country.Urbanizacao && country.Tecnologia);

    validCountries.forEach((country) => {
        const wpi = calculateWPI(country);
        const stabilityInfo = getStabilityInfo(parseFloat(country.Estabilidade) || 0);
        const formattedPib = formatCurrency(country.PIB || '0');
        const formattedPopulation = Number(country.Populacao || 0).toLocaleString('pt-BR');
        
        const cardHtml = `
        <button class="country-card-button group relative w-full rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-slate-700/80 hover:shadow-md" data-country-id="${country.id}">
            <!-- Header: bandeira + nome + WPI -->
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <div class="h-7 w-10 flex-shrink-0 grid place-items-center rounded-md ring-1 ring-white/10 bg-slate-800 text-2xl">
                        ${country.Bandeira}
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


/**
 * Renderiza o painel completo do país.
 * @param {object} country - Objeto com todos os dados do país.
 */
export function renderDetailedCountryPanel(country) {
    const wpi = calculateWPI(country);
    const stabilityInfo = getStabilityInfo(parseFloat(country.Estabilidade) || 0);

    // Mock de histórico de PIB para o gráfico. Em um sistema real, viria do Firestore.
    const pibHistory = [
        { ano: 1950, valor: (parseFloat(country.PIB) || 0) * 0.5 },
        { ano: 1951, valor: (parseFloat(country.PIB) || 0) * 0.6 },
        { ano: 1952, valor: (parseFloat(country.PIB) || 0) * 0.8 },
        { ano: 1953, valor: (parseFloat(country.PIB) || 0) * 0.9 },
        { ano: 1954, valor: (parseFloat(country.PIB) || 0) },
    ];
    const maxPibHistory = Math.max(...pibHistory.map(d => d.valor));

    const html = `
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Card principal -->
          <div class="relative rounded-2xl p-6">
            <!-- Cabeçalho -->
            <div class="flex items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
                  ${country.Pais}
                </h1>
                <p class="text-sm text-slate-400 mt-1">
                  PIB per capita <span class="font-semibold text-slate-200">${formatCurrency((parseFloat(country.PIB) || 0) / (parseFloat(country.Populacao) || 1))}</span>
                </p>
              </div>

              <!-- WPI medalhão -->
              <div class="shrink-0">
                <div class="grid place-items-center h-14 w-14 rounded-2xl border border-white/10 bg-slate-900/60 shadow-inner">
                  <span class="text-xl font-extrabold text-slate-100">${wpi}</span>
                </div>
                <div class="mt-1 text-[10px] text-center uppercase tracking-wider text-slate-400">
                  War Power
                </div>
              </div>
            </div>

            <!-- Bandeira -->
            <div class="relative overflow-hidden rounded-xl mt-5 ring-1 ring-white/10">
                <div class="h-40 w-full object-cover grid place-items-center text-8xl bg-slate-800">${country.Bandeira}</div>
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
              <div class="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-slate-200/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A7.495 7.495 0 0116.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
                <span>Modelo: ${country.ModeloPolitico}</span>
              </div>
            </div>

            <!-- Stats grid -->
            <div class="mt-6 grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-white/5 bg-slate-900/40 p-4">
                <div class="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                      <polyline points="16 17 22 17 22 11"></polyline>
                  </svg>
                  PIB
                </div>
                <div class="mt-1 text-lg font-semibold text-slate-100">
                  ${formatCurrency(country.PIB)}
                </div>
                <div class="mt-3 h-20">
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="pibFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.55" />
                        <stop offset="90%" stop-color="#60a5fa" stop-opacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path d="M0,${100 - (pibHistory[0].valor / maxPibHistory) * 100} 
                        L${pibHistory.map((d, i) => `${(i / (pibHistory.length - 1)) * 300},${100 - (d.valor / maxPibHistory) * 100}`).join(" L")}
                        L300,100 L0,100 Z" fill="url(#pibFill)" stroke="#93c5fd" stroke-width="2" />
                  </svg>
                </div>
              </div>

              <div class="rounded-xl border border-white/5 bg-slate-900/40 p-4">
                <div class="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  População
                </div>
                <div class="mt-1 text-lg font-semibold text-slate-100">
                  ${Number(country.Populacao || 0).toLocaleString('pt-BR')}
                </div>
                <div class="mt-3 text-[11px] text-slate-400">Densidade urbana</div>
                <div class="mt-2">
                    <div class="flex items-center justify-between text-slate-300 text-sm">
                        <div class="inline-flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="3" y1="22" x2="21" y2="22"></line>
                                <line x1="12" y1="6" x2="12" y2="18"></line>
                                <line x1="6" y1="12" x2="18" y2="12"></line>
                                <line x1="10" y1="18" x2="10" y2="11"></line>
                                <line x1="14" y1="18" x2="14" y2="11"></line>
                                <polygon points="12 2 20 7 4 7 12 2"></polygon>
                            </svg>
                            <span>Urbanização</span>
                        </div>
                        <span class="font-medium text-slate-200">${country.Urbanizacao}%</span>
                    </div>
                    <div class="h-2.5 w-full rounded-full bg-slate-800/60 ring-1 ring-white/5 overflow-hidden">
                        <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300" style="width: ${clamp(country.Urbanizacao, 0, 100)}%"></div>
                    </div>
                </div>
              </div>
            </div>

            <!-- Barras de progresso -->
            <div class="mt-6 grid grid-cols-1 gap-4">
              <div class="flex items-center justify-between">
                <div class="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border ${stabilityInfo.tone}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Estabilidade: ${stabilityInfo.label}</span>
                </div>
                <div class="text-sm text-slate-300">
                  Índice: <span class="font-semibold text-slate-100">${country.Estabilidade}</span>
                </div>
              </div>
              
              <div class="space-y-2">
                <div class="flex items-center justify-between text-slate-300 text-sm">
                    <div class="inline-flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        <span>Tecnologia</span>
                    </div>
                    <span class="font-medium text-slate-200">${country.Tecnologia}%</span>
                </div>
                <div class="h-2.5 w-full rounded-full bg-slate-800/60 ring-1 ring-white/5 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300" style="width: ${clamp(country.Tecnologia, 0, 100)}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Painel lateral de metadados / resumo -->
          <div class="relative rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-slate-100">Resumo Estratégico</h2>
            <p class="mt-1 text-sm text-slate-400">
              Visão geral de capacidades e riscos do país no contexto do seu RPG.
            </p>

            <div class="mt-5 grid gap-4">
              <div class="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2">
                <span class="text-sm text-slate-400">Modelo Político</span>
                <span class="text-sm font-medium text-slate-100">${country.ModeloPolitico}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2">
                <span class="text-sm text-slate-400">PIB total</span>
                <span class="text-sm font-medium text-slate-100">${formatCurrency(country.PIB)}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2">
                <span class="text-sm text-slate-400">População</span>
                <span class="text-sm font-medium text-slate-100">${Number(country.Populacao).toLocaleString('pt-BR')}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2">
                <span class="text-sm text-slate-400">Urbanização</span>
                <span class="text-sm font-medium text-slate-100">${country.Urbanizacao}%</span>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2">
                <span class="text-sm text-slate-400">War Power Index</span>
                <span class="text-sm font-medium text-slate-100">${wpi}/100</span>
              </div>
            </div>

            <div class="mt-6 text-xs text-slate-400">
              * O War Power Index é uma métrica interna que pondera tecnologia e renda per capita.
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <button class="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/50 hover:border-white/20 transition shadow-inner">
                Ver Exército
              </button>
              <button class="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/50 hover:border-white/20 transition shadow-inner">
                Diplomacia
              </button>
              <button class="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/50 hover:border-white/20 transition shadow-inner">
                Indústria
              </button>
              <button class="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/50 hover:border-white/20 transition shadow-inner">
                Relatórios
              </button>
            </div>
          </div>
        </div>
    `;

    DOM.countryPanelContent.innerHTML = html;
    
    // Animação de abertura
    setTimeout(() => {
        DOM.countryPanelModal.classList.remove('opacity-0');
        DOM.countryPanelContent.parentElement.classList.remove('-translate-y-2');
    }, 10);
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
