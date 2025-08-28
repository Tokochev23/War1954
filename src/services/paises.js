// Lógica de serviço para interagir com a coleção 'paises' no Firestore
import { db, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, getDoc } from '../firebase';

const paisesCollection = collection(db, "paises");

export const fetchPaises = (callback) => {
    return onSnapshot(paisesCollection, (snapshot) => {
        const paisesList = [];
        snapshot.forEach((doc) => {
            paisesList.push({ id: doc.id, ...doc.data() });
        });
        callback(paisesList);
    });
};

export const fetchPais = async (id) => {
    const docRef = doc(db, "paises", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const savePais = async (id, data) => {
    const docRef = doc(db, "paises", id);
    return await setDoc(docRef, data);
};

export const deletePais = async (id) => {
    const docRef = doc(db, "paises", id);
    return await deleteDoc(docRef);
};
