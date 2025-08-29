import {
  auth,
  checkUserPermissions,
  checkPlayerCountry,
  getAvailableCountries,
  vincularJogadorAoPais,
  getAllCountries,
  getGameConfig,
  updateTurn,
  signInWithGoogle,
  registerWithEmailPassword,
  signInWithEmailPassword
} from "./services/firebase.js";
import {
  renderPublicCountries,
  updateKPIs,
  fillPlayerPanel,
  createCountrySelectionModal,
  updateNarratorUI,
  renderDetailedCountryPanel
} from "./ui/renderer.js";
import { showNotification } from "./utils.js";

// Elementos do DOM
const authButton = document.getElementById('auth-button');
const mainLoginBtn = document.getElementById('main-login-btn');
const filterSelect = document.getElementById('filtro-visibilidade');
const refreshButton = document.getElementById('refresh-paises');
const turnoEditor = document.getElementById('turno-editor');
const lastSyncElement = document.getElementById('last-sync');
const countryListContainer = document.getElementById('lista-paises-publicos');
const countryPanelModal = document.getElementById('country-panel-modal');
const closeCountryPanelBtn = document.getElementById('close-country-panel');
const authModal = document.getElementById('auth-modal');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const closeAuthModal = document.getElementById('close-auth-modal');
const authErrorMessage = document.getElementById('auth-error-message');
const authSuccessMessage = document.getElementById('auth-success-message');

// Estado da aplicação
let appState = {
  allCountries: [],
  gameConfig: {},
  isDataLoaded: false,
};

let currentAuthMode = 'login'; // 'login' ou 'register'

// Funções de UI para o modal
function showAuthModal(mode = 'login') {
  currentAuthMode = mode;
  updateAuthModalUI();
  authModal.classList.remove('hidden');
  clearAuthMessages();
}

function hideAuthModal() {
  authModal.classList.add('hidden');
  clearAuthMessages();
  resetAuthForms();
}

function updateAuthModalUI() {
  const isLogin = currentAuthMode === 'login';

  // Atualizar tabs
  if (isLogin) {
    loginTab.classList.add('bg-brand-500', 'text-slate-950');
    loginTab.classList.remove('text-slate-300', 'hover:text-slate-100');
    registerTab.classList.remove('bg-brand-500', 'text-slate-950');
    registerTab.classList.add('text-slate-300', 'hover:text-slate-100');
  } else {
    registerTab.classList.add('bg-brand-500', 'text-slate-950');
    registerTab.classList.remove('text-slate-300', 'hover:text-slate-100');
    loginTab.classList.remove('bg-brand-500', 'text-slate-950');
    loginTab.classList.add('text-slate-300', 'hover:text-slate-100');
  }

  // Atualizar forms
  if (isLogin) {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    document.getElementById('auth-modal-title').textContent = 'Entrar no Portal';
    document.getElementById('auth-modal-subtitle').textContent = 'Acesse sua conta';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    document.getElementById('auth-modal-title').textContent = 'Criar Conta';
    document.getElementById('auth-modal-subtitle').textContent = 'Registre-se para começar';
  }
}

function clearAuthMessages() {
  authErrorMessage.classList.add('hidden');
  authSuccessMessage.classList.add('hidden');
}

function showAuthError(message) {
  authErrorMessage.textContent = message;
  authErrorMessage.classList.remove('hidden');
  authSuccessMessage.classList.add('hidden');
}

function showAuthSuccess(message) {
  authSuccessMessage.textContent = message;
  authSuccessMessage.classList.remove('hidden');
  authErrorMessage.classList.add('hidden');
}

function resetAuthForms() {
  loginForm.reset();
  registerForm.reset();
}

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
  }
  updateLastSyncTime();
}

function filterAndRenderCountries() {
  const filterValue = filterSelect.value;
  let filteredCountries = [];

  if (filterValue === 'todos') {
    filteredCountries = appState.allCountries;
  } else if (filterValue === 'publicos') {
    filteredCountries = appState.allCountries.filter(c => c.Visibilidade && c.Visibilidade.toLowerCase() === 'público');
  } else if (filterValue === 'privados') {
    filteredCountries = appState.allCountries.filter(c => c.Visibilidade && c.Visibilidade.toLowerCase() === 'privado');
  } else if (filterValue === 'com-jogadores') {
    filteredCountries = appState.allCountries.filter(c => c.Player);
  } else if (filterValue === 'sem-jogadores') {
    filteredCountries = appState.allCountries.filter(c => !c.Player);
  }

  renderPublicCountries(filteredCountries);
}

function updateLastSyncTime() {
  const now = new Date();
  const lastSyncElement = document.getElementById('last-sync');
  if (lastSyncElement) {
    lastSyncElement.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
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
      selectedCountry = {
        id: option.dataset.paisId,
        name: option.dataset.paisNome
      };
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
    showAuthModal('login');
  }
});

mainLoginBtn.addEventListener('click', () => {
  showAuthModal('login');
});

loginTab.addEventListener('click', () => {
  currentAuthMode = 'login';
  updateAuthModalUI();
  clearAuthMessages();
});

registerTab.addEventListener('click', () => {
  currentAuthMode = 'register';
  updateAuthModalUI();
  clearAuthMessages();
});

closeAuthModal.addEventListener('click', hideAuthModal);

// Google Login
googleLoginBtn.addEventListener('click', async () => {
  clearAuthMessages();

  try {
    const result = await signInWithGoogle();
    if (result.success) {
      hideAuthModal();
      showNotification('success', `Bem-vindo, ${result.user.displayName}!`);
    } else {
      showAuthError(result.error ? result.error.message : 'Erro no login com Google.');
    }
  } catch (error) {
    showAuthError('Erro inesperado no login com Google.');
  }
});

// Login Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthMessages();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const result = await signInWithEmailPassword(email, password);
    if (result.success) {
      hideAuthModal();
      showNotification('success', 'Login realizado com sucesso!');
    } else {
      showAuthError(result.error ? result.error.message : 'Erro no login.');
    }
  } catch (error) {
    showAuthError('Erro inesperado no login.');
  }
});

// Register Form
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthMessages();

  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  // Validações
  if (password !== confirmPassword) {
    showAuthError('As senhas não coincidem.');
    return;
  }

  if (password.length < 6) {
    showAuthError('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  try {
    const result = await registerWithEmailPassword(email, password, name);
    if (result.success) {
      showAuthSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => {
        hideAuthModal();
        showNotification('success', `Bem-vindo ao WAR, ${name}!`);
      }, 1500);
    } else {
      showAuthError(result.error ? result.error.message : 'Erro no registro.');
    }
  } catch (error) {
    showAuthError('Erro inesperado no registro.');
  }
});

// Fechar modal ao clicar fora
authModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    hideAuthModal();
  }
});

// Esc para fechar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !authModal.classList.contains('hidden')) {
    hideAuthModal();
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
