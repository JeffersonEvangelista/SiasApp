import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, getReactNativePersistence, sendEmailVerification, initializeAuth, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getFirestore, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoomId } from '../utils/common';

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

// Inicialize o Firebase apenas se já não houver uma instância inicializada
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0]; // Reutilize a instância já existente
}

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
})

export const db = getFirestore(app);

export const usersRef = collection(db, 'users');
export const roomRef = collection(db, 'rooms');

export const registerChatRoom = async (userId1: string, userId2: string) => {
    let roomId = getRoomId(userId1, userId2);
    await setDoc(doc(db, "rooms", roomId),{
      roomId,
      createdAt: Timestamp.fromDate(new Date())
    });
}

// Função para registrar o usuário e enviar e-mail de confirmação
export const registerUser = async (email: string, password: string, username: string, identificador: string, profileImg: string) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);

      // Salva os dados básicos no Firestore
      await setDoc(doc(db, 'users', response?.user?.uid), {
        username,
        email,
        identificador,
        profileImg,
        userId: response?.user?.uid,
      });

      // Envia e-mail de verificação
      await sendEmailVerification(response.user);
      console.log('E-mail de verificação enviado com sucesso');

      return { success: true, data: response?.user };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error instanceof Error ? error.message : error);
      throw error;
    }
  };

export const UpdateUserProfileImg =  async (id:string, foto:string|null) => {

    const docRef = doc(db, "users", id)

    const data = {
        profileImg: foto
    };

    updateDoc(docRef, data)

}

// Função para obter os dados do usuário logado atualmente
export const getCurrentUserData = () => {
    const user = auth.currentUser;
    return user ? { email: user.email, id: user.uid } : null;
};

// Função para obter o e-mail do usuário logado atualmente
export const getCurrentUserEmail = (): string | null => {
    const user = auth.currentUser;
    return user ? user.email : null;
};
export const isUserEmailVerified = (): boolean => {
    const user = auth.currentUser;
    return user ? user.emailVerified : false; // Retorna true se o e-mail estiver verificado
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

// Função para atualizar o e-mail no Firebase Authentication
export const updateUserEmail = async (newEmail: string, password: string): Promise<boolean> => {
  const user = auth.currentUser;

  if (!user) {
    console.error('Nenhum usuário autenticado.');
    return false;
  }

  try {
    // Reautenticar o usuário com o e-mail e senha fornecidos
    const credential = EmailAuthProvider.credential(user.email || '', password);
    await reauthenticateWithCredential(user, credential);

    // Atualizar o e-mail
    await updateEmail(user, newEmail);
    await sendEmailVerification(user); // Enviar e-mail de verificação

    return true;
  } catch (error) {
    console.error('Erro ao atualizar o e-mail no Firebase:', error);
    return false;
  }
};

// Função para deletar documento do usuário
export const deleteUserDocumentationInFirestore = async(userFirebaseId: string) => {
  const userDoc = doc(db, "users", userFirebaseId);
  await deleteDoc(userDoc);
};