import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
