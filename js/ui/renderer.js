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

// Renderiza a lista de países
export function renderPublicCountries(countries) {
    DOM.countryListContainer.innerHTML = '';
    
    countries.forEach((country) => {
        const stability = parseFloat(String(country.Estabilidade).replace(/%/g, '')).toFixed(0);
        const pib = formatCurrency(country.PIB || '0');
        const isPublic = country.Visibilidade && country.Visibilidade.trim() === 'Público';

        const cardHtml = `
        <div class="group rounded-2xl bg-bg-soft border border-bg-ring/70 p-4 hover:border-slate-500/60 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer transform hover:scale-[1.02]">
            <div class="flex items-center justify-between mb-3">
                <div class="text-sm text-slate-400">#${String(country.id).padStart(2, '0')}</div>
                <div class="flex items-center gap-2">
                    <div class="text-xs rounded-md px-2 py-0.5 border ${
                        stability >= 70 ? 'border-emerald-600/30 text-emerald-300/90 bg-emerald-500/10' :
                        stability >= 40 ? 'border-yellow-600/30 text-yellow-300/90 bg-yellow-500/10' :
                        'border-red-600/30 text-red-300/90 bg-red-500/10'
                    }">
                        ${stability}/100
                    </div>
                    <div class="text-xs px-2 py-0.5 rounded-md ${
                        isPublic ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }">
                        ${isPublic ? 'Público' : 'Privado'}
                    </div>
                </div>
            </div>
            
            <div class="mb-2">
                <div class="font-semibold text-lg group-hover:text-white transition-colors">${country.Pais}</div>
                <div class="text-sm text-slate-400">PIB: ${pib}</div>
            </div>
            
            <div class="flex items-center justify-between text-xs">
                <div class="text-slate-500">Estabilidade</div>
                <div class="flex items-center gap-1">
                    <div class="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full ${
                            stability >= 70 ? 'bg-emerald-400' :
                            stability >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                        } transition-all duration-500" style="width: ${stability}%"></div>
                    </div>
                    <span class="text-slate-400">${stability}%</span>
                </div>
            </div>
        </div>
        `;
        DOM.countryListContainer.innerHTML += cardHtml;
    });

    DOM.totalCountriesBadge.textContent = `${countries.length} países`;
    if (countries.length === 0) {
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

// Cria o modal de seleção de país
export function createCountrySelectionModal(availableCountries) {
    const modal = document.createElement('div');
    modal.id = 'selecao-pais-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm';
    
    modal.innerHTML = `
    <div class="w-full max-w-4xl max-h-[80vh] rounded-2xl bg-bg-soft border border-bg-ring/70 p-6 shadow-card animate-slide-up overflow-y-auto">
        <div class="text-center mb-6">
            <div class="h-16 w-16 rounded-2xl bg-brand-500/15 ring-1 ring-brand-500/30 grid place-items-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 class="text-2xl font-bold">Escolha seu País</h2>
            <p class="text-sm text-slate-400 mt-2">Selecione o país que você governará durante a Guerra Fria de 1954</p>
            <p class="text-xs text-slate-500 mt-1">${availableCountries.length} países disponíveis</p>
        </div>
        
        <div class="mb-6">
            <div class="relative">
                <input type="text" id="busca-pais" placeholder="Buscar país por nome..." 
                       class="w-full rounded-xl bg-bg border border-bg-ring/70 p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto mb-6" id="lista-paises-disponiveis">
            ${availableCountries.map(country => `
            <div class="pais-option group cursor-pointer rounded-xl bg-bg border border-bg-ring/70 p-4 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all duration-200" 
                 data-pais-id="${country.id}" data-pais-nome="${country.Pais}">
                <div class="flex items-center justify-between mb-2">
                    <div class="text-sm text-slate-400">Disponível</div>
                    <div class="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Livre
                    </div>
                </div>
                <div class="font-semibold text-lg group-hover:text-brand-400 transition-colors mb-2">${country.Pais}</div>
                <div class="text-sm text-slate-400 space-y-1">
                    <div>💰 PIB: ${formatCurrency(country.PIB || 0)}</div>
                    <div>👥 População: ${Number(country.Populacao || 0).toLocaleString()}</div>
                    <div>📊 Estabilidade: ${country.Estabilidade || 0}/100</div>
                    <div>🏭 Tecnologia: ${country.Tecnologia || 0}</div>
                </div>
                <div class="mt-3 flex justify-between text-xs">
                    <span class="text-slate-500">⚔️ ${country.Exercito || 0}</span>
                    <span class="text-slate-500">🚢 ${country.Marinha || 0}</span>
                    <span class="text-slate-500">✈️ ${country.Aeronautica || 0}</span>
                    <span class="text-slate-500">🚗 ${country.Veiculos || 0}</span>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="flex justify-between items-center">
            <div class="text-sm text-slate-400">
                <span id="paises-visiveis">${availableCountries.length}</span> de ${availableCountries.length} países mostrados
            </div>
            <div class="flex gap-3">
                <button id="cancelar-selecao" class="px-4 py-2 text-slate-400 hover:text-slate-200 transition">
                    Cancelar
                </button>
                <button id="confirmar-selecao" disabled 
                        class="px-6 py-3 bg-brand-500 text-slate-950 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-400 transition-all">
                    Confirmar Seleção
                </button>
            </div>
        </div>
    </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

// Atualiza a interface do narrador
export function updateNarratorUI(isNarrator, isAdmin) {
    if (isNarrator) {
        DOM.narratorTools.style.display = 'block';
        const badge = isAdmin ? 'Admin' : 'Narrador';
        const badgeColor = isAdmin ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-brand-500/10 text-brand-400 border-brand-500/20';
        DOM.userRoleBadge.className = `text-xs px-2 py-1 rounded-full ${badgeColor}`;
        DOM.userRoleBadge.textContent = badge;
    } else {
        DOM.narratorTools.style.display = 'none';
    }
}

// Funções de UI para login
export function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

export function hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('login-error-message').classList.add('hidden');
}

export function setLoginLoading(isLoading) {
    const loginSubmit = document.getElementById('login-submit');
    loginSubmit.disabled = isLoading;
    loginSubmit.querySelector('.submit-text').style.display = isLoading ? 'none' : 'inline';
    loginSubmit.querySelector('.submit-loading').classList.toggle('hidden', !isLoading);
}

export function setLoginError(message) {
    const errorMessage = document.getElementById('login-error-message');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}
