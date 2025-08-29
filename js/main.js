import { auth, checkUserPermissions, checkPlayerCountry, getAvailableCountries, vincularJogadorAoPais, getAllCountries, getGameConfig, updateTurn } from "./services/firebase.js";
import { renderPublicCountries, updateKPIs, fillPlayerPanel, createCountrySelectionModal, showLoginModal, hideLoginModal, setLoginLoading, setLoginError, updateNarratorUI } from "./ui/renderer.js";
import { showNotification } from "./utils.js";

// Elementos do DOM
const authButton = document.getElementById('auth-button');
const loginForm = document.getElementById('login-form');
const closeModalButton = document.getElementById('close-modal');
const connectionStatus = document.getElementById('connection-status');
const serverStatus = document.getElementById('server-status');
const filterSelect = document.getElementById('filtro-visibilidade');
const refreshButton = document.getElementById('refresh-paises');
const turnoEditor = document.getElementById('turno-editor');
const lastSyncElement = document.getElementById('last-sync');

// Estado da aplicação
let appState = {
    allCountries: [],
    gameConfig: {},
    isDataLoaded: false,
};

// Funções de controle
async function loadSiteData() {
    console.log("Carregando dados do site...");
    document.querySelectorAll('.loading-shimmer').forEach(el => el.style.display = 'inline');

    appState.allCountries = await getAllCountries();
    appState.gameConfig = await getGameConfig();

    if (appState.allCountries.length > 0) {
        updateKPIs(appState.allCountries);
        filterAndRenderCountries();
        
        document.querySelectorAll('.loading-shimmer').forEach(el => el.style.display = 'none');
        appState.isDataLoaded = true;
        connectionStatus.classList.remove('hidden');
        serverStatus.classList.remove('hidden');
    }
    updateLastSyncTime();
}

function filterAndRenderCountries() {
    const filterValue = filterSelect.value;
    let filteredCountries = [];

    if (filterValue === 'todos') {
        filteredCountries = appState.allCountries;
    } else if (filterValue === 'publicos') {
        filteredCountries = appState.allCountries.filter(c => c.Visibilidade === 'Público');
    } else if (filterValue === 'privados') {
        filteredCountries = appState.allCountries.filter(c => c.Visibilidade === 'Privado');
    } else if (filterValue === 'com-jogadores') {
        filteredCountries = appState.allCountries.filter(c => c.Player);
    } else if (filterValue === 'sem-jogadores') {
        filteredCountries = appState.allCountries.filter(c => !c.Player);
    }

    renderPublicCountries(filteredCountries);
}

function updateLastSyncTime() {
    const now = new Date();
    lastSyncElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Lógica de Autenticação e Dados do Jogador
async function handleUserLogin(user) {
    if (user) {
        authButton.querySelector('.btn-text').textContent = 'Sair';
        const userPermissions = await checkUserPermissions(user.uid);
        updateNarratorUI(userPermissions.isNarrator, userPermissions.isAdmin);

        const paisId = await checkPlayerCountry(user.uid);
        if (paisId) {
            const playerData = appState.allCountries.find(c => c.id === paisId);
            if (playerData) {
                fillPlayerPanel(playerData, appState.gameConfig.turnoAtual);
            }
        } else {
            const availableCountries = appState.allCountries.filter(c => !c.Player);
            if (availableCountries.length > 0) {
                const modal = createCountrySelectionModal(availableCountries);
                handleCountrySelection(modal, user.uid);
            } else {
                showNotification('warning', 'Não há países disponíveis para seleção no momento.');
            }
        }
    } else {
        authButton.querySelector('.btn-text').textContent = 'Entrar';
        updateNarratorUI(false, false);
        fillPlayerPanel(null); // Limpa o painel do jogador
    }
}

// Lida com a seleção de país no modal
function handleCountrySelection(modal, userId) {
    let selectedCountry = null;
    const countryOptions = modal.querySelectorAll('.pais-option');
    const confirmButton = modal.querySelector('#confirmar-selecao');
    const cancelButton = modal.querySelector('#cancelar-selecao');
    const searchInput = modal.querySelector('#busca-pais');
    const visibleCountriesCount = modal.querySelector('#paises-visiveis');

    countryOptions.forEach(option => {
        option.addEventListener('click', () => {
            countryOptions.forEach(op => op.classList.remove('border-brand-500', 'bg-brand-500/10'));
            option.classList.add('border-brand-500', 'bg-brand-500/10');
            selectedCountry = { id: option.dataset.paisId, name: option.dataset.paisNome };
            confirmButton.disabled = false;
        });
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let visibleCount = 0;
        countryOptions.forEach(option => {
            const countryName = option.dataset.paisNome.toLowerCase();
            const isVisible = countryName.includes(searchTerm);
            option.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        });
        visibleCountriesCount.textContent = visibleCount;
    });

    confirmButton.addEventListener('click', async () => {
        if (selectedCountry) {
            confirmButton.textContent = 'Vinculando...';
            confirmButton.disabled = true;
            try {
                await vincularJogadorAoPais(userId, selectedCountry.id);
                modal.remove();
                showNotification('success', `Você agora governa ${selectedCountry.name}!`);
                loadSiteData(); // Recarregar todos os dados
            } catch (error) {
                showNotification('error', 'Erro ao vincular país. Tente novamente.');
                console.error('Erro ao vincular país:', error);
            } finally {
                confirmButton.textContent = 'Confirmar Seleção';
                confirmButton.disabled = false;
            }
        }
    });

    cancelButton.addEventListener('click', () => {
        modal.remove();
    });
}

// Event Listeners
authButton.addEventListener('click', () => {
    if (auth.currentUser) {
        auth.signOut();
    } else {
        showLoginModal();
    }
});

closeModalButton.addEventListener('click', hideLoginModal);

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        hideLoginModal();
        showNotification('success', 'Login realizado com sucesso!');
    } catch (error) {
        let message = "Falha no login. Verifique e-mail e senha.";
        if (error.code === 'auth/user-not-found') {
            message = "Usuário não encontrado.";
        } else if (error.code === 'auth/wrong-password') {
            message = "Senha incorreta.";
        } else if (error.code === 'auth/invalid-email') {
            message = "Email inválido.";
        }
        setLoginError(message);
    } finally {
        setLoginLoading(false);
    }
});

filterSelect.addEventListener('change', filterAndRenderCountries);
refreshButton.addEventListener('click', loadSiteData);

turnoEditor.addEventListener('change', async (e) => {
    const newTurn = e.target.value;
    if (auth.currentUser) {
        const permissions = await checkUserPermissions(auth.currentUser.uid);
        if (permissions.isNarrator) {
            const success = await updateTurn(newTurn);
            if (success) {
                showNotification('success', `Turno atualizado para #${newTurn}`);
                appState.gameConfig.turnoAtual = newTurn;
                fillPlayerPanel(appState.allCountries.find(c => c.Player === auth.currentUser.uid), newTurn);
            } else {
                showNotification('error', 'Erro ao salvar turno.');
            }
        }
    }
});

// Monitora o estado da autenticação
auth.onAuthStateChanged(handleUserLogin);

// Carregamento inicial
document.addEventListener('DOMContentLoaded', loadSiteData);
