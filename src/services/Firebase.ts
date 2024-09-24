import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD7RZw8KrGGoiD_Pky4ho59tva_7nKY4Qo",
    authDomain: "siasmobile-5a101.firebaseapp.com",
    projectId: "siasmobile-5a101",
    storageBucket: "siasmobile-5a101.appspot.com",
    messagingSenderId: "18631145700",
    appId: "1:18631145700:web:7c3d01d6c29f52804394f1",
    measurementId: "G-J29RZYWT9D",
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
})

export const usersRef = collection(db, 'users');
export const roomRef = collection(db, 'rooms')

// Função para registrar o usuário
export const registerUser = async (email: string, password: string, username:string, identificador:string) => {
    try {
        const response = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", response?.user?.uid),{
            username,
            email,
            identificador,
            userId: response?.user?.uid
        });
        return {success: true, data: response?.user}
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