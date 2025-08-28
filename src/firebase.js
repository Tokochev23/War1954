// Configuração e inicialização do Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

// Configuração do seu projeto Firebase (cole aqui!)
const firebaseConfig = {
    apiKey: "AIzaSyBd-cQsmXqgU9wVDtxYdaeLFQIfIUxv6GE",
    authDomain: "war-1954-1799c.firebaseapp.com",
    projectId: "war-1954-1799c",
    storageBucket: "war-1954-1799c.firebasestorage.app",
    messagingSenderId: "147967902110",
    appId: "1:147967902110:web:2e2a54b98ef9474d7a968f",
    measurementId: "G-LQNDE985RB"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, getDoc };
