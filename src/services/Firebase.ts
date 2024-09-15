import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCiv4Lg8YfG6ezUmV0t-1vsGYI0i6QgMe8",
    authDomain: "siasmobile-72225.firebaseapp.com",
    projectId: "siasmobile-72225",
    storageBucket: "siasmobile-72225.appspot.com",
    messagingSenderId: "871110692356",
    appId: "1:871110692356:web:a8e3ec81c9afa4a58a2f51"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Função para registrar o usuário
export const registerUser = async (email: string, password: string) => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Usuário registrado com sucesso');
    } catch (error) {
        // Verifique se o erro é do tipo FirebaseError
        if (error instanceof Error) {
            console.error('Erro ao registrar usuário:', error.message);
        } else {
            // Caso o erro não seja do tipo esperado, logue uma mensagem genérica
            console.error('Erro desconhecido ao registrar usuário:', error);
        }
        throw error; // Repassa o erro para que possa ser tratado no componente
    }
};
