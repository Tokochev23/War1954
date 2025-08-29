import { showNotification } from "../utils.js";

// Inicializa Firebase SDKs.
// Este é o único arquivo que precisa carregar as CDNs de Firebase.
import "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";

const firebaseConfig = {
    apiKey: "AIzaSyBd-cQsmXqgU9wVDtxYdaeLFQIfIUxv6GE",
    authDomain: "war-1954-1799c.firebaseapp.com",
    projectId: "war-1954-1799c",
    storageBucket: "war-1954-1799c.firebasestorage.app",
    messagingSenderId: "147967902110",
    appId: "1:147967902110:web:2e2a54b98ef9474d7a968f",
    measurementId: "G-LQNDE985RB"
};

let app, auth, db;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase e Firestore inicializados com sucesso.');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    showNotification('error', 'Erro ao conectar com Firebase. Recarregue a página.');
}

// Adiciona o provedor Google e exporta
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { app, auth, db, googleProvider };

/**
 * Função para login com Google.
 * @returns {Promise<object>} Um objeto com o status da operação.
 */
export async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Salvar/atualizar dados do usuário no Firestore
        await db.collection('usuarios').doc(user.uid).set({
            nome: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            papel: 'jogador', // padrão
            dataIngresso: firebase.firestore.Timestamp.now(),
            ultimoLogin: firebase.firestore.Timestamp.now(),
            ativo: true
        }, { merge: true });
        
        return { success: true, user };
    } catch (error) {
        console.error('Erro no login com Google:', error);
        return { success: false, error };
    }
}

/**
 * Função para registro com email/senha.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<object>} Um objeto com o status da operação.
 */
export async function registerWithEmailPassword(email, password, displayName) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const user = result.user;
        
        // Atualizar perfil com nome
        await user.updateProfile({
            displayName: displayName
        });
        
        // Salvar no Firestore
        await db.collection('usuarios').doc(user.uid).set({
            nome: displayName,
            email: email,
            papel: 'jogador',
            dataIngresso: firebase.firestore.Timestamp.now(),
            ultimoLogin: firebase.firestore.Timestamp.now(),
            ativo: true
        });
        
        return { success: true, user };
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    }
}

/**
 * Função para login com email/senha.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Um objeto com o status da operação.
 */
export async function signInWithEmailPassword(email, password) {
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        
        // Atualizar último login
        await db.collection('usuarios').doc(result.user.uid).update({
            ultimoLogin: firebase.firestore.Timestamp.now()
        });
        
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
}


// Função para vincular jogador ao país no Firestore
export async function vincularJogadorAoPais(userId, paisId) {
    try {
        await db.collection('paises').doc(paisId).update({
            Player: userId,
            DataVinculacao: firebase.firestore.Timestamp.now()
        });
        
        await db.collection('usuarios').doc(userId).set({
            paisId: paisId,
            papel: 'jogador',
            dataIngresso: firebase.firestore.Timestamp.now(),
            ativo: true
        }, { merge: true });
        
        console.log('Jogador vinculado ao país com sucesso');
    } catch (error) {
        console.error('Erro ao vincular jogador ao país:', error);
        throw error;
    }
}

// Função para verificar se o usuário é narrador/admin
export async function checkUserPermissions(userId) {
    try {
        const userDoc = await db.collection('usuarios').doc(userId).get();
        if (userDoc.exists) {
            const role = userDoc.data().papel;
            return {
                isNarrator: role === 'narrador' || role === 'admin',
                isAdmin: role === 'admin'
            };
        }
        return { isNarrator: false, isAdmin: false };
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return { isNarrator: false, isAdmin: false };
    }
}

// Função para obter países disponíveis
export async function getAvailableCountries() {
    try {
        const paisesRef = db.collection('paises');
        const querySnapshot = await paisesRef.where('Player', '==', null).get();
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Erro ao obter países disponíveis:', error);
        return [];
    }
}

// Função para obter todos os países
export async function getAllCountries() {
    try {
        const paisesRef = db.collection('paises');
        const querySnapshot = await paisesRef.get();
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Erro ao carregar dados do site:", error);
        showNotification('error', 'Erro ao carregar dados do servidor.');
        return [];
    }
}

// Função para obter dados de um único país
export async function getCountryData(paisId) {
    try {
        const doc = await db.collection('paises').doc(paisId).get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error("Erro ao carregar dados do país:", error);
        return null;
    }
}

// Função para obter a configuração do jogo
export async function getGameConfig() {
    try {
        const doc = await db.collection('configuracoes').doc('jogo').get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error("Erro ao carregar configuração do jogo:", error);
        return null;
    }
}

// Função para atualizar o turno
export async function updateTurn(newTurn) {
    try {
        await db.collection('configuracoes').doc('jogo').set({
            turnoAtual: parseInt(newTurn),
            ultimaAtualizacao: firebase.firestore.Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Erro ao salvar turno:', error);
        return false;
    }
}
