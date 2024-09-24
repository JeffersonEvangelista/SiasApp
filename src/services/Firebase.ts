import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD7RZw8KrGGoiD_Pky4ho59tva_7nKY4Qo",
    authDomain: "siasmobile-5a101.firebaseapp.com",
    projectId: "siasmobile-5a101",
    storageBucket: "siasmobile-5a101.appspot.com",
    messagingSenderId: "18631145700",
    appId: "1:18631145700:web:7c3d01d6c29f52804394f1",
    measurementId: "G-J29RZYWT9D"
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
        if (error instanceof Error) {
            console.error('Erro ao registrar usuário:', error.message);
        } else {
            console.error('Erro desconhecido ao registrar usuário:', error);
        }
        throw error;
    }
};


// Função para obter o e-mail do usuário logado atualmente
export const getCurrentUserEmail = (): string | null => {
    const user = auth.currentUser;
    return user ? user.email : null;
};

// Função para obter os dados do usuário logado atualmente
export const getCurrentUserData = () => {
    const user = auth.currentUser;
    return user ? { email: user.email, id: user.uid } : null;
};

// Função para realizar o logoff
export const logOutUser = async () => {
    const auth = getAuth();
    try {
        await signOut(auth);
        console.log('Usuário deslogado com sucesso');
        return true; // Sucesso
    } catch (error) {
        console.error('Erro ao fazer logoff:', error);
        return false; // Falha
    }
};
