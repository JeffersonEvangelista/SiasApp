import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Switch, Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { supabase } from '../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { getUserNameAndId } from '../services/userService';
import { getCurrentUserData, logOutUser, UpdateUserProfileImg, deleteUserDocumentationInFirestore } from '../services/Firebase';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { StatusBar } from 'expo-status-bar';
import { updateUserEmail, auth, isUserEmailVerified } from '../services/Firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from 'firebase/auth';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import * as Notifications from 'expo-notifications'; // Para notificações : EXPERIMENTAL

const uploadToSupabase = async (base64Image, imageExtension = 'jpg', bucketName = 'avatars', userId) => {
  try {
    const base64Str = base64Image.includes('base64,')
      ? base64Image.substring(base64Image.indexOf('base64,') + 'base64,'.length)
      : base64Image;

    const res = decode(base64Str);
    console.log('Decoded image length:', res.byteLength);

    if (!(res.byteLength > 0)) {
      console.error('[uploadToSupabase] ArrayBuffer is null');
      return null;
    }

    const imagePath = `${userId}.${imageExtension}`;
    console.log('Image path:', imagePath);

    const { data: existingData } = await supabase.storage.from(bucketName).list('', {
      limit: 1,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    const imageExists = existingData.some(file => file.name === imagePath);
    console.log('Image exists:', imageExists);

    const { error: uploadError } = imageExists
      ? await supabase.storage.from(bucketName).update(imagePath, res, {
        contentType: `image/${imageExtension}`,
      })
      : await supabase.storage.from(bucketName).upload(imagePath, res, {
        contentType: `image/${imageExtension}`,
      });

    if (uploadError) {
      console.error('[uploadToSupabase] upload error: ', uploadError);
      return null;
    }

    console.log('Imagem enviada com sucesso, caminho:', imagePath);

    // Obtendo o URL público da imagem
    const { data: publicUrlData, error: publicUrlError } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(imagePath);

    if (publicUrlError) {
      console.error('[uploadToSupabase] Erro ao obter publicUrl:', publicUrlError);
      return null;
    }

    console.log('URL público da imagem:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl; // Retorna o URL público da imagem
  } catch (err) {
    console.error(err);
    return null;
  }
};

const Configuracoes: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false); // Para lembrar a escolha
  const [showBell, setShowBell] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const navigation = useNavigation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true); // TODO: Persistir estado do botão de notoficação
  const [badgeCounts, setBadgeCounts] = useState({
    Home: 0,
    Agenda: 0,
    Assistente: 0,
    Chat: 0,
    Configurações: 0,
  });
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(''); // Armazenar a senha atual
  const [newPassword, setNewPassword] = useState(''); // Armazenar a nova senha
  const [actionType, setActionType] = useState<"updateEmail" | "deleteAccount">("updateEmail");



  /*
    const toggleNotificationsSwitch = async () => {
      try {
        const newValue = !isNotificationsEnabled;
        setIsNotificationsEnabled(newValue);
        await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
  
        if (newValue) {
          // Solicitar permissão para enviar notificações
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
              Alert.alert('Permissão para notificações foi negada.');
              setIsNotificationsEnabled(false); // Desative a opção se a permissão não for concedida
              return;
            }
          }
          console.log('Notificações habilitadas.');
        } else {
          // Cancelar todas as notificações se desativadas
          await Notifications.cancelAllScheduledNotificationsAsync();
          console.log('Notificações desativadas.');
        }
      } catch (error) {
        console.error('Erro ao salvar configurações de notificações:', error);
      }
    };
  */


  useEffect(() => {
    const fetchRememberChoice = async () => {
      try {
        const choice = await AsyncStorage.getItem('rememberChoice');
        if (choice !== null) {
          setRememberChoice(JSON.parse(choice));
        }
      } catch (error) {
        console.error('Error fetching remember choice: ', error);
      }
    };

    fetchRememberChoice();
  }, []);
  useEffect(() => {

    setEmailVerified(isUserEmailVerified());
  }, []);

  const { colorScheme, toggleColorScheme } = useColorScheme();

  const toggleDarkModeSwitch = () => {
    setIsDarkModeEnabled(previousState => !previousState);
  };

  const loadUserData = async () => {
    try {
      const { id: userId } = await getUserNameAndId(); // Obtém o ID do usuário
      console.log('User ID:', userId);

      // Primeiro, tenta buscar os dados do usuário na tabela de candidatos
      const { data: profileData, error: candidateError } = await supabase
        .from('candidatos')
        .select('foto_perfil, nome, email') // Buscando nome, foto de perfil e email
        .eq('id', userId)
        .single();

      if (candidateError || !profileData) {
        // Se ocorrer erro ou não encontrar candidato, tenta na tabela recrutadores
        console.log('Usuário não encontrado como candidato. Buscando na tabela de recrutadores...');

        const { data: recruiterData, error: recruiterError } = await supabase
          .from('recrutadores')
          .select('foto_perfil, nome, email') // Buscando nome, foto de perfil e email
          .eq('id', userId)
          .single();

        if (recruiterError || !recruiterData) {
          console.error('Erro ao buscar dados do recrutador:', recruiterError || 'Nenhum recrutador encontrado');
        } else {
          if (recruiterData) {
            // Se encontrar na tabela de recrutadores, define os dados
            setProfileImage(recruiterData.foto_perfil);
            setUsername(recruiterData.nome);
            setEmail(recruiterData.email);
            console.log('Dados do recrutador carregados:', recruiterData);
          }
        }
      } else {
        // Se encontrar como candidato, define os dados do candidato
        setProfileImage(profileData.foto_perfil);
        setUsername(profileData.nome);
        setEmail(profileData.email);
        console.log('Dados do candidato carregados:', profileData);
      }

      // Agora, verifica se existe um token salvo no banco de dados
      const { data: tokenData, error: tokenError } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', userId)
        .single();

      if (tokenError) {
        console.error('Erro ao buscar token:', tokenError.message);
      } else if (tokenData) {
        // Se o token existir, ativa as notificações
        setIsNotificationsEnabled(true);
        setExpoPushToken(tokenData.token);
      } else {
        // Se não houver token, as notificações permanecem desativadas
        setIsNotificationsEnabled(false);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  };



  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const openModal = (content) => {
    setModalContent(content);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalContent(''); // Limpa o conteúdo do modal ao fechar
  };

  const resolvePasswordRef = useRef<(password: string) => void>();

  // Função de abrir modal com ação específica
  const promptUserForPassword = (action: "updateEmail" | "deleteAccount"): Promise<string> => {
    return new Promise((resolve) => {
      resolvePasswordRef.current = (password) => {
        resolve(password); // Passa a senha quando o usuário submeter
      };
      setActionType(action); // Define a ação (neste caso 'deleteAccount')
      setShowPasswordModal(true); // Abre o modal de senha
    });
  };

  // Função chamada ao submeter a senha
  const handlePasswordSubmit = async () => {
    if (!passwordInput) {
      Alert.alert("Erro", "A senha não pode estar vazia.");
      return;
    }

    if (resolvePasswordRef.current) {
      resolvePasswordRef.current(passwordInput); // Resolve a Promise com a senha
      setPasswordInput(''); // Limpa o campo de senha
      setShowPasswordModal(false); // Fecha o modal
    }

    // Processa a ação com base no actionType
    if (actionType === "updateEmail") {
      await handleUpdateProfile();
    } else if (actionType === "deleteAccount") {
      console.log("entrou no else if delete account")
      await handleDeleteAccount(passwordInput);
    } else {
      console.error('ActionType está indefinido ou nulo!', actionType);
    }

    setPasswordInput(''); // Limpa o campo de senha
    setShowPasswordModal(false);
    // setActionType(null); // Reseta o actionType após a submissão DEIXEI NULL DE PROPÓSITO
  };

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Você precisa estar logado para alterar a senha.');
      return;
    }

    try {
      // Criar credenciais para reautenticação
      const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
      // Reautenticar o usuário
      await reauthenticateWithCredential(user, credential);

      // Atualizar a senha
      await updatePassword(user, newPassword);
      Alert.alert('Senha alterada com sucesso!');

      // Limpar os campos
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Erro ao alterar a senha:', error);
      Alert.alert('Erro ao alterar a senha. Verifique suas credenciais e tente novamente.');
    }
  };

  const getUserIdFromSupabase = async (): Promise<string | null> => {
    try {
        if (auth.currentUser) {
            await auth.currentUser.reload();
        }

        const userEmail = auth.currentUser?.email;
        console.log('Usuário autenticado:', auth.currentUser);
        console.log('E-mail do usuário sendo buscado:', userEmail);

        if (!userEmail) {
            console.error('Email do usuário não encontrado no Firebase');
            return null;
        }

        const { data: candidateData, error: candidateError } = await supabase
            .from('candidatos')
            .select('id')
            .ilike('email', userEmail)
            .maybeSingle();

        if (candidateError) {
            console.log('Usuário não encontrado na tabela de candidatos. Buscando na tabela de recrutadores...');

            const { data: recruiterData, error: recruiterError } = await supabase
                .from('recrutadores')
                .select('id')
            .ilike('email', userEmail)
            .maybeSingle();

            if (recruiterError) {
                console.error('Erro ao buscar o ID no Supabase:', recruiterError);
                return null;
            } else if (recruiterData) {
                return recruiterData.id;
            } else {
                console.error('Usuário não encontrado na tabela de recrutadores.');
                return null;
            }
        } else if (candidateData) {
            return candidateData.id;
        } else {
            console.error('Usuário não encontrado nem como candidato nem como recrutador.');
            return null;
        }
    } catch (error) {
        console.error('Erro na função getUserIdFromSupabase:', error);
        return null;
    }
};

  const handleUpdateProfile = async () => {
    try {
      // Validações de e-mail e nome
      const emailTrimmed = email.trim();
      if (!validateEmail(emailTrimmed)) {
        Alert.alert('Por favor, insira um e-mail válido.');
        return;
      }

      if (!username.trim()) {
        Alert.alert('Por favor, insira um nome de usuário válido.');
        return;
      }

      const userId = await getUserIdFromSupabase(); // Busca o ID do usuário no Supabase
      if (!userId) {
        Alert.alert('ID do usuário não encontrado. Verifique se o e-mail está correto.');
        return;
      }

      // Verifica se o e-mail foi alterado
      if (emailTrimmed !== auth.currentUser?.email) {
        // Solicita a senha para atualização de email
        const password = await promptUserForPassword("updateEmail");

        // Tenta atualizar o e-mail no Firebase
        const emailUpdateSuccess = await updateUserEmail(emailTrimmed, password);
        if (!emailUpdateSuccess) {
          Alert.alert('Erro ao atualizar o e-mail no Firebase. Verifique suas credenciais.');
          return;
        }

        // Fecha o modal após sucesso no Firebase
        setShowPasswordModal(false);
      }

      // Lógica para verificar em qual tabela o usuário está (candidatos ou recrutadores)
      let userType = '';

      // Tenta buscar o usuário na tabela de candidatos
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidatos')
        .select('id')
        .eq('id', userId)
        .single();

      if (candidateError || !candidateData) {
        console.log('Usuário não encontrado como candidato. Buscando na tabela de recrutadores...');

        // Se não encontrou na tabela de candidatos, busca na tabela de recrutadores
        const { data: recruiterData, error: recruiterError } = await supabase
          .from('recrutadores')
          .select('id')
          .eq('id', userId)
          .single();

        if (recruiterError || !recruiterData) {
          console.error('Erro ao buscar usuário nas tabelas:', recruiterError || candidateError);
          Alert.alert('Erro ao buscar usuário. Verifique sua conta.');
          return;
        } else {
          userType = 'recrutador'; // Usuário é recrutador
        }
      } else {
        userType = 'candidato'; // Usuário é candidato
      }

      // Lógica para atualizar os dados com base no tipo de usuário
      if (userType === 'candidato') {
        // Atualiza os dados na tabela de candidatos
        const { error: updateError } = await supabase
          .from('candidatos')
          .update({ nome: username.trim(), email: emailTrimmed })
          .eq('id', userId);

        if (updateError) {
          console.error('Erro ao atualizar dados no Supabase (candidatos):', updateError);
          Alert.alert('Erro ao atualizar dados no Supabase.');
        } else {
          Alert.alert('Dados de candidato atualizados com sucesso! Faça o login novamente!');
          loadUserData(); // Atualiza os dados do usuário
          setShowPasswordModal(false); // Fecha o modal, se estiver aberto
          navigation.navigate('Auth', { screen: 'Login' });
        }

      } else if (userType === 'recrutador') {
        // Atualiza os dados na tabela de recrutadores
        const { error: updateError } = await supabase
          .from('recrutadores')
          .update({ nome: username.trim(), email: emailTrimmed })
          .eq('id', userId);

        if (updateError) {
          console.error('Erro ao atualizar dados no Supabase (recrutadores):', updateError);
          Alert.alert('Erro ao atualizar dados no Supabase.');
        } else {
          Alert.alert('Dados de recrutador atualizados com sucesso! Faça o login novamente!');
          loadUserData(); // Atualiza os dados do usuário
          setShowPasswordModal(false); // Fecha o modal, se estiver aberto
          navigation.navigate('Auth', { screen: 'Login' });
        }
      }

    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
      Alert.alert('Ocorreu um erro ao salvar os dados. Tente novamente.');
    }
  };

  // Validação de formato de e-mail
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // LogOff
  const handleLogoff = async () => {
    // Lógica para verificar se o usuário deve ser deslogado
    if (!rememberChoice) {
      const success = await logOutUser(); // Chama a função de logoff
      if (success) {
        Alert.alert("Deslogado com sucesso!");
        navigation.navigate('Auth', { screen: 'Login' });
      } else {
        Alert.alert("Erro ao deslogar. Tente novamente.");
      }
    } else {
      // Lógica se o usuário desejar sair sem confirmação
      const success = await logOutUser();
      if (success) {
        Alert.alert("Deslogado com sucesso!");
        navigation.navigate('Auth', { screen: 'Login' });
      } else {
        Alert.alert("Erro ao deslogar. Tente novamente.");
      }
    }

    // Salvar a escolha do usuário
    try {
      await AsyncStorage.setItem('rememberChoice', JSON.stringify(rememberChoice));
    } catch (error) {
      console.error('Error saving remember choice: ', error);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Você precisa estar logado para excluir sua conta.');
        return;
      }

      // Reautentica o usuário com a senha fornecida
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      let deletedFrom = ''; // Variável para identificar de onde foi deletado

      // Verifica se o usuário é candidato
      const { data: candidateData, error: candidateFetchError } = await supabase
        .from('candidatos')
        .select('id')
        .eq('email', user.email)
        .single();

      if (candidateFetchError || !candidateData) {
        console.log('Usuário não encontrado como candidato. Tentando deletar como recrutador...');

        // Busca o ID do recrutador pelo email no Supabase
        const { data: recruiterData, error: recruiterFetchError } = await supabase
          .from('recrutadores')
          .select('id')
          .eq('email', user.email)
          .single();

        if (recruiterFetchError || !recruiterData) {
          console.error('Usuário não encontrado como recrutador também:', recruiterFetchError);
          Alert.alert('Conta não encontrada no Supabase.');
          return;
        }

        // Se o usuário foi encontrado como recrutador, delete da tabela recrutadores usando o ID
        const { error: recruiterDeleteError } = await supabase
          .from('recrutadores')
          .delete()
          .eq('id', recruiterData.id);

        if (recruiterDeleteError) {
          console.error('Erro ao deletar conta no Supabase (recrutadores):', recruiterDeleteError);
          Alert.alert('Erro ao deletar a conta no Supabase. Tente novamente mais tarde.');
          return;
        } else {
          deletedFrom = 'recrutadores'; // Usuário deletado como recrutador
        }
      } else {
        // Se o usuário foi encontrado como candidato, delete da tabela candidatos
        const { error: candidateDeleteError } = await supabase
          .from('candidatos')
          .delete()
          .eq('id', candidateData.id);

        if (candidateDeleteError) {
          console.error('Erro ao deletar conta no Supabase (candidatos):', candidateDeleteError);
          Alert.alert('Erro ao deletar a conta no Supabase. Tente novamente mais tarde.');
          return;
        } else {
          deletedFrom = 'candidatos'; // Usuário deletado como candidato
        }
      }

      // Exclui o usuário no Firebase
      await deleteUser(user);
      console.log('Usuário deletado com sucesso no Firebase!', user.email);

      // Exclui o documento do respectivo usuário no Firestore
      console.log('Deletando documento do usuário no Firestore...', user.uid);
      await deleteUserDocumentationInFirestore(user.uid);
      console.log('Documento do usuário deletado!');

      Alert.alert(`Conta deletada com sucesso no Supabase da tabela ${deletedFrom}!`);
      navigation.navigate('Auth', { screen: 'Login' });

    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      Alert.alert('Erro ao deletar a conta. Tente novamente.');
    }
  };


  useEffect(() => {
    loadUserData(); // Chama a função ao inicializar o componente
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Desculpe, precisamos de permissão para acessar a galeria!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      console.log('Selected image URI:', result.assets[0].uri);
      await uploadImage(result.assets[0].uri);
    } else {
      console.log('Seleção de imagem cancelada.');
    }
  };

  const getBase64 = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.open('GET', uri);
      xhr.responseType = 'blob';
      xhr.send();
    });
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    console.log('Iniciando upload da imagem:', uri);

    try {
      const base64Image = await getBase64(uri);
      const { id: userId } = await getUserNameAndId(); // Obtendo o ID do usuário
      console.log('User ID:', userId);

      // Define o nome da imagem
      const uniqueId = Date.now();
      const publicUrl = await uploadToSupabase(base64Image, 'png', 'avatars', `${userId}_${uniqueId}.png`);

      const user = getCurrentUserData();
      UpdateUserProfileImg(user?.id!, publicUrl);

      console.log(publicUrl);

      if (publicUrl) {
        setProfileImage(publicUrl); // Atualiza a imagem de perfil com o URL público

        // O URL público é muito importante, pois é através dele que obtemos a foto de perfil do usuário e o associamos a sua respectiva conta na tabela do banco de dados

        // Chama a função para buscar o elemento na tabela
        const element = await fetchElementById(userId, publicUrl);
        console.log('Elemento buscado:', element);
      } else {
        console.error('Erro no upload da imagem, não será possível atualizar a tabela.');
      }
    } catch (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      Alert.alert('Erro ao fazer upload da imagem', uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchElementById = async (userId: string, caminhoImagem: string) => {
    try {
      console.log(`Buscando candidato com ID: ${userId}`);
      const { data: candidatosData, error: candidatosError } = await supabase
        .from('candidatos')
        .select('*')
        .eq('id', userId);

      if (candidatosError) {
        console.error('Erro ao buscar candidato:', candidatosError);
        throw candidatosError;
      }

      console.log('Dados de candidatos encontrados:', candidatosData);

      if (candidatosData.length === 0) {
        console.log(`Nenhum candidato encontrado. Buscando recrutador com ID: ${userId}`);
        const { data: recrutadoresData, error: recrutadoresError } = await supabase
          .from('recrutadores')
          .select('*')
          .eq('id', userId);

        if (recrutadoresError) {
          console.error('Erro ao buscar recrutador:', recrutadoresError);
          throw recrutadoresError;
        }

        console.log('Dados de recrutadores encontrados:', recrutadoresData);

        if (recrutadoresData.length > 0) {
          console.log('Recrutador encontrado.');
          await updateRecrutador(userId, caminhoImagem);
        } else {
          console.log('Nenhum recrutador encontrado com esse ID.');
        }

        return recrutadoresData;
      }

      console.log('Candidato encontrado.');
      console.log('Atualizando candidato com caminho da imagem:', caminhoImagem);
      await updateCandidato(userId, caminhoImagem);
      return candidatosData;
    } catch (error) {
      console.error('Erro ao buscar elemento:', error);
      return null;
    }
  };

  const updateCandidato = async (userId: string, caminhoImagem: string) => {
    try {
      console.log(`Atualizando candidato com ID: ${userId} e caminho da imagem: ${caminhoImagem}`);
      const { error } = await supabase
        .from('candidatos')
        .update({ foto_perfil: caminhoImagem })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar candidato:', error);
        throw error;
      }
      console.log('Candidato atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
    }
  };

  const updateRecrutador = async (userId: string, caminhoImagem: string) => {
    try {
      console.log(`Atualizando recrutador com ID: ${userId} e caminho da imagem: ${caminhoImagem}`);
      const { error } = await supabase
        .from('recrutadores')
        .update({ foto_perfil: caminhoImagem })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar recrutador:', error);
        throw error;
      }
      console.log('Recrutador atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar recrutador:', error);
    }
  };

  console.log(colorScheme);
  console.log(actionType);



  const toggleNotificationsSwitch = async () => {
    const newValue = !isNotificationsEnabled;
    setIsNotificationsEnabled(newValue);

    const { id: userId } = await getUserNameAndId(); // Obtém o ID do usuário

    if (newValue) {
      // Solicita permissão e obtém o token
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync();
        setExpoPushToken(token.data);
        console.log('Token obtido:', token.data);

        // Armazena o token no Supabase
        await storeTokenInSupabase(userId, token.data);
      } else {
        alert('Você não pode receber notificações!');
      }
    } else {
      // O usuário desativou as notificações, apague o token do backend
      console.log('Notificações desativadas');
      await removeTokenFromBackend(userId); // Passar o userId para a função
      setExpoPushToken(''); // Limpa o token local
    }
  };

  const storeTokenInSupabase = async (userId, token) => {
    const { data, error } = await supabase
      .from('device_tokens')
      .upsert([
        {
          user_id: userId,
          token,
        }
      ]);

    if (error) {
      console.error('Erro ao armazenar o token:', error.message);
    } else {
      console.log('Token armazenado com sucesso:', data);
    }
  };

  const removeTokenFromBackend = async (userId) => {
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao remover o token:', error.message);
    } else {
      console.log('Token removido com sucesso');
    }
  };


  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        colorScheme === 'dark' && { backgroundColor: '#1a1a1a' } // Muda a cor do fundo no dark mode
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <SafeAreaView
        style={[
          styles.container,
          colorScheme === 'dark' && { backgroundColor: '#212121' } // Aplica o dark mode
        ]}
      >
        <Header />
        <View style={[
          styles.containerOpcoes,
          colorScheme === 'dark' && { backgroundColor: '#000' } // Fundo preto no dark mode
        ]}>
          <TouchableOpacity style={styles.profileCircle} onPress={pickImage}>
            {uploading ? (
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={[styles.placeholderText, colorScheme === 'dark' && { color: '#fff' }]}>Adicionar Imagem</Text>
            )}
          </TouchableOpacity>
          {/* Talves fazer um efeito de ficar passando o nome se for muito grande */}
          <Text style={[styles.usernameText, colorScheme === 'dark' && { color: '#fff' }]}>
            {username ? (username.length > 20 ? username.substring(0, 20) + '...' : username) : 'Carregando...'}
          </Text>


          {/* Renderiza o sino somente se o e-mail não estiver verificado */}
          {showBell && !isUserEmailVerified() && (
            <TouchableOpacity
              onPress={() => setShowNotification(!showNotification)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: 10,
                backgroundColor: colorScheme === 'dark' ? '#000' : '#fff', // Preto no Dark Mode, branco no Light Mode
                borderRadius: 10,
              }}
            >
              <Icon name="bell" size={30} color="#ff8c00" />
              {/* Bolinha vermelha */}
              {!showNotification && (
                <View
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    width: 12,
                    height: 12,
                    backgroundColor: 'red',
                    borderRadius: 15 / 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                />
              )}
            </TouchableOpacity>
          )}

          <ScrollView contentContainerStyle={[
            styles.containerScroll,
            colorScheme === 'dark' && { backgroundColor: '#000' } // Fundo preto no dark mode
          ]}>
            <View style={styles.line} />
            <Text style={[styles.message, colorScheme === 'dark' && { color: '#fff' }]}>Configurações de Conta</Text>

            <TouchableOpacity
              style={[
                styles.Options,
                colorScheme === 'dark' && { backgroundColor: '#ff8c00' } // Laranja no dark mode
              ]}
              onPress={() => openModal('Editar dados')}
            >
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Editar dados
              </Text>
              <Icon name="chevron-right" size={20} color={colorScheme === 'dark' ? '#fff' : '#ff8c00'} style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.Options,
                colorScheme === 'dark' && { backgroundColor: '#ff8c00' } // Laranja no dark mode
              ]}
              onPress={() => openModal('Alterar a senha')}
            >
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Alterar a senha
              </Text>
              <Icon name="chevron-right" size={20} color={colorScheme === 'dark' ? '#fff' : '#ff8c00'} style={styles.icon} />
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={[styles.textSwitch, colorScheme === 'dark' && { color: '#fff' }]}>
                Notificações
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: "#ff8c00" }}
                thumbColor={isNotificationsEnabled ? "#ff8c00" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleNotificationsSwitch}
                value={isNotificationsEnabled}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Dark mode
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: "#ff8c00" }}  // Barrinha laranja quando ativada
                thumbColor={colorScheme === 'dark' ? "#ff8c00" : "#f4f3f4"}  // Laranja quando dark mode está ativado
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleDarkModeSwitch}
                value={colorScheme === 'dark'}
                onChange={toggleColorScheme}
              />
            </View>

            <View style={styles.line} />
            <Text style={[styles.message, colorScheme === 'dark' && { color: '#fff' }]}>Mais Opções</Text>

            <TouchableOpacity
              style={[
                styles.Options,
                colorScheme === 'dark' && { backgroundColor: '#ff8c00' } // Laranja no dark mode
              ]}
              onPress={() => openModal('Sobre nós')}
            >
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Sobre nós
              </Text>
              <Icon name="chevron-right" size={20} color={colorScheme === 'dark' ? '#fff' : '#ff8c00'} style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.Options,
                colorScheme === 'dark' && { backgroundColor: '#ff8c00' } // Laranja no dark mode
              ]}
              onPress={() => openModal('Política de Privacidade')}
            >
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Política de Privacidade
              </Text>
              <Icon name="chevron-right" size={20} color={colorScheme === 'dark' ? '#fff' : '#ff8c00'} style={styles.icon} />
            </TouchableOpacity>

            <View style={styles.line} />
            <Text style={[styles.message, colorScheme === 'dark' && { color: '#fff' }]}>Opções Avançadas</Text>

            <TouchableOpacity
              style={[
                styles.Options,
                colorScheme === 'dark' && { backgroundColor: '#ff8c00' } // Laranja no dark mode
              ]}
              onPress={async () => {
                const choice = await AsyncStorage.getItem('rememberChoice');
                const isRememberChoice = choice ? JSON.parse(choice) : false;

                if (isRememberChoice) {
                  handleLogoff(); // Desloga diretamente
                } else {
                  openModal('Sair do App'); // Abre o modal
                }
              }}
            >
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Sair do App
              </Text>
              <Icon name="chevron-right" size={20} color={colorScheme === 'dark' ? '#fff' : '#ff8c00'} style={styles.icon} />
            </TouchableOpacity>


            <TouchableOpacity
              style={[
                styles.Options,
                colorScheme === 'dark' && { backgroundColor: '#ff8c00' } // Laranja no dark mode
              ]}
              onPress={() => openModal('Deletar Conta')}
            >
              <Text style={[styles.text, colorScheme === 'dark' && { color: '#fff' }]}>
                Deletar Conta
              </Text>
              <Icon name="chevron-right" size={20} color={colorScheme === 'dark' ? '#fff' : '#ff8c00'} style={styles.icon} />
            </TouchableOpacity>

            {/* Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={closeModal}
            >
              {/* Background com efeito de Blur */}
              <BlurView
                intensity={10} // Intensidade do Blur (de 0 a 100)
                tint="dark"
                style={styles.blurContainer}
                experimentalBlurMethod="dimezisBlurView"
              >
                <View style={[
                  styles.modalView,
                  colorScheme === 'dark' && { backgroundColor: '#1a1a1a' } // Fundo preto no dark mode
                ]}>
                  {/* Botão de Fechar como um X Vermelho */}
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>

                  {modalContent === 'Editar dados' && (
                    <View
                      style={{
                        padding: 20,
                        backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
                        borderRadius: 10,
                        elevation: 5,
                        shadowColor: colorScheme === 'dark' ? '#000' : '#ccc',
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                      }}
                    >
                      <Text style={{
                        fontSize: 18,
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      }}>
                        Editar Dados do Perfil
                      </Text>

                      {/* Campo para nome de usuário */}
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: colorScheme === 'dark' ? '#fff' : 'gray',
                          marginTop: '5%',
                          marginBottom: '10%',
                          padding: 8,
                          color: colorScheme === 'dark' ? '#fff' : '#000',
                          backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                        }}
                        placeholder="Nome de usuário"
                        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
                        value={username}
                        onChangeText={setUsername}
                        editable={emailVerified}
                      />

                      {/* Campo para email */}
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: colorScheme === 'dark' ? '#fff' : 'gray',
                          marginBottom: '10%',
                          padding: 8,
                          color: colorScheme === 'dark' ? '#fff' : '#000',
                          backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                        }}
                        placeholder="Email do usuário"
                        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
                        value={email}
                        onChangeText={setEmail}
                        editable={emailVerified}
                      />

                      {!emailVerified && (
                        <Text style={{ color: 'red' }}>
                          Verifique seu e-mail antes de atualizar os dados.
                        </Text>
                      )}



                      {/* Botão Atualizar desabilitado se o e-mail não estiver verificado */}
                      <TouchableOpacity
                        style={{ backgroundColor: '#ff8c00', padding: 10, marginTop: 10 }}
                        onPress={handleUpdateProfile}
                        disabled={!emailVerified}
                      >
                        <Text style={{ color: 'white' }}>
                          {emailVerified ? 'Atualizar' : 'Email não verificado'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {modalContent === 'Alterar a senha' && (
                    <View
                      style={{
                        backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff', // Fundo do modal
                        padding: 20,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: colorScheme === 'dark' ? '#fff' : '#000', // Cor do texto
                          fontSize: 18,
                          marginBottom: 20,
                        }}
                      >
                        Alterar Senha
                      </Text>

                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: colorScheme === 'dark' ? '#fff' : 'gray', // Cor da borda
                          backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff', // Fundo do campo
                          color: colorScheme === 'dark' ? '#fff' : '#000', // Cor do texto no campo
                          padding: 10,
                          marginBottom: 15,
                        }}
                        placeholder="Senha Atual"
                        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'} // Placeholder adaptado
                        secureTextEntry={true}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                      />

                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: colorScheme === 'dark' ? '#fff' : 'gray', // Cor da borda
                          backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff', // Fundo do campo
                          color: colorScheme === 'dark' ? '#fff' : '#000', // Cor do texto no campo
                          padding: 10,
                          marginBottom: 15,
                        }}
                        placeholder="Nova Senha"
                        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'} // Placeholder adaptado
                        secureTextEntry={true}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />

                      <TouchableOpacity
                        style={{
                          backgroundColor: '#ff8c00', // Cor do botão
                          padding: 10,
                          borderRadius: 5,
                          alignItems: 'center',
                        }}
                        onPress={handleChangePassword}
                      >
                        <Text
                          style={{
                            color: '#fff', // Cor do texto do botão
                            fontWeight: 'bold',
                          }}
                        >
                          Alterar Senha
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {modalContent === 'Sobre nós' && (
                    <View>
                      <Text style={[styles.modalText, colorScheme === 'dark' && { color: '#fff' }]}>Sobre Nós</Text>
                      <ScrollView style={styles.modalContent}>
                        <Text
                          style={[
                            styles.modalTitle,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >Sobre Nós</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          O<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Sias App</Text> é um aplicativo dedicado a transformar e otimizar a gestão de entrevistas no setor de Recursos Humanos. Criado com uma abordagem colaborativa e inovadora, nosso objetivo é oferecer uma solução eficiente e prática para candidatos e equipes de RH, melhorando a comunicação e a experiência em cada etapa do processo.
                        </Text>

                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >Nossa Estrutura e Metodologia</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          Para garantir uma base sólida e bem-organizada, utilizamos a metodologia de arquitetura<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >C4</Text> (Context, Containers, Components, and Code). Essa abordagem permite projetar e gerenciar o sistema com clareza, oferecendo uma estrutura robusta e fácil de evoluir.
                        </Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          Este aplicativo é uma extensão da versão web do SIAS, focado em simplificar processos de entrevistas e agendamentos.
                        </Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Importante:</Text> Algumas funcionalidades, como a criação de vagas e inscrições, não estão disponíveis no app. Além disso, contas recentes podem não ter acesso a todas as funcionalidades disponíveis em contas mais antigas.
                        </Text>

                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >O Que Fazemos</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          O<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Sias App</Text> foi projetado para atender às necessidades específicas de<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >equipes de RH</Text> e<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >candidatos</Text>, promovendo eficiência e agilidade em todos os aspectos do gerenciamento de entrevistas.
                        </Text>

                        <Text style={styles.subSectionTitle}>Para o RH:</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          •<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Envio de Solicitações:</Text> Permite enviar solicitações detalhadas diretamente para os candidatos qualificados.{"\n"}
                          •<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Detalhes das Solicitações:</Text> Inclui informações como data, horário e local da entrevista, assegurando clareza e organização.
                        </Text>

                        <Text style={styles.subSectionTitle}>Para os Candidatos:</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          •<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Gerenciamento de Solicitações:</Text> Visualize e acompanhe as solicitações recebidas de forma prática em uma aba dedicada.{"\n"}
                          •<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Respostas às Solicitações:</Text> Aceite ou recuse solicitações facilmente, mantendo o controle total sobre as interações com as empresas.
                        </Text>

                        <Text style={styles.subSectionTitle}>Funcionalidades Comuns:</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          •<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Chatbot de Suporte:</Text> Responde dúvidas frequentes sobre contas e funcionalidades, oferecendo suporte imediato.{"\n"}
                          •<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Modo de Treinamento para Entrevistas:</Text> Simula entrevistas com perguntas práticas e orientações úteis, ajudando candidatos a se preparar melhor.
                        </Text>

                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >Benefícios do Sias App</Text>
                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Facilidade e Agilidade:</Text> Simplifica o processo de agendamento e comunicação, tornando as interações mais eficientes para candidatos e RH.{"\n"}
                          <Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Suporte Prático e Contínuo:</Text> O app oferece orientação e apoio em tempo real, melhorando a experiência de todos os usuários.
                        </Text>

                        <Text
                          style={[
                            styles.modalText,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          Com o<Text
                            style={[
                              styles.boldText,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >Sias App</Text>, o futuro da gestão de entrevistas está ao seu alcance! 🚀
                        </Text>
                      </ScrollView>
                    </View>
                  )}

                  {modalContent === 'Política de Privacidade' && (
                    <View>
                      <Text style={[styles.modalText, colorScheme === 'dark' && { color: '#fff' }]}>Política de Privacidade</Text>
                      <ScrollView style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1C1C1CFF' : '#fff' }]}>
                        <Text
                          style={[
                            styles.title,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >Termos e Permissões</Text>

                        <Text
                          style={[
                            styles.paragraph,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          Bem-vindo ao <Text style={styles.bold}
                          >Sias</Text>. Ao utilizar nosso aplicativo, você concorda com os seguintes termos e condições relacionados às permissões que solicitamos. Nosso compromisso é respeitar sua privacidade e garantir que seus dados sejam usados de forma segura e responsável.
                        </Text>

                        <View style={styles.section}>
                          <Text
                            style={[
                              styles.subtitle,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            1. Coleta e Uso de Localização</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            O aplicativo pode solicitar acesso à sua localização para fornecer funcionalidades como:
                          </Text>
                          <Text
                            style={[
                              styles.bullet,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            - Sugestões de locais próximos;</Text>
                          <Text
                            style={[
                              styles.bullet,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >- Otimização de rotas.</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            <Text style={styles.bold}>Como usamos:</Text> A localização será coletada apenas quando necessária e usada exclusivamente para fins relacionados à funcionalidade do aplicativo. Não compartilhamos sua localização com terceiros sem sua autorização explícita.
                          </Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            <Text style={styles.bold}>Configuração:</Text> Você pode habilitar ou desabilitar o acesso à localização nas configurações do seu dispositivo a qualquer momento.
                          </Text>
                        </View>

                        <View style={styles.section}>
                          <Text
                            style={[
                              styles.subtitle,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >2. Acesso à Galeria</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            Solicitamos acesso à galeria do seu dispositivo para:
                          </Text>
                          <Text
                            style={[
                              styles.bullet,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >- Permitir upload de fotos;</Text>
                          <Text
                            style={[
                              styles.bullet,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >- Personalização de perfil.</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            <Text style={styles.bold}>Como usamos:</Text> O acesso é utilizado exclusivamente para selecionar ou visualizar imagens escolhidas por você. Não acessamos ou armazenamos outras imagens sem sua permissão explícita.
                          </Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            <Text style={styles.bold}>Configuração:</Text> Você pode gerenciar o acesso à galeria através das configurações do seu dispositivo.
                          </Text>
                        </View>

                        <View style={styles.section}>
                          <Text
                            style={[
                              styles.subtitle,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >3. Permissão para Notificações</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            Solicitamos permissão para enviar notificações para:
                          </Text>
                          <Text
                            style={[
                              styles.bullet,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >- Informar sobre atualizações importantes;</Text>
                          <Text
                            style={[
                              styles.bullet,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >- Lembrá-lo de compromissos ou eventos.</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            <Text style={styles.bold}>Como usamos:</Text> As notificações serão enviadas apenas para mantê-lo informado sobre funcionalidades ou eventos importantes. Você pode ajustar a frequência ou desativar as notificações nas configurações do aplicativo ou do dispositivo.
                          </Text>
                        </View>

                        <View style={styles.section}>
                          <Text
                            style={[
                              styles.subtitle,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >4. Segurança dos Dados</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            Nosso compromisso é proteger suas informações. Os dados coletados por meio das permissões solicitadas são armazenados e processados com alto padrão de segurança. Nunca venderemos ou compartilharemos suas informações com terceiros sem sua permissão.
                          </Text>
                        </View>

                        <View style={styles.section}>
                          <Text
                            style={[
                              styles.subtitle,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            5. Alterações e Revogação de Permissões</Text>
                          <Text
                            style={[
                              styles.paragraph,
                              { color: colorScheme === 'dark' ? '#fff' : '#000' },
                            ]}
                          >
                            Você pode alterar ou revogar qualquer uma das permissões concedidas diretamente nas configurações do seu dispositivo. No entanto, observe que algumas funcionalidades podem ser limitadas sem as permissões necessárias.
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.paragraph,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          Ao continuar a usar o <Text style={styles.bold}>Sias</Text>, você concorda com os termos acima e autoriza o uso das permissões descritas de acordo com nossa <Text style={styles.link}>Política de Privacidade</Text>.
                        </Text>
                        <Text style={styles.footer}>
                          Última atualização: 15/11/2024
                        </Text>
                      </ScrollView>
                    </View>
                  )}

                  {modalContent === 'Sair do App' && (
                    <View>
                      {/* Ícone */}
                      <Icon name="sign-out" size={20} color="red" style={styles.icon} />

                      <Text style={[styles.modalText, colorScheme === 'dark' && { color: '#fff' }]}>Tem certeza que deseja sair?</Text>
                      <Text style={[styles.modalDescriptionText, colorScheme === 'dark' && { color: '#fff' }]}>
                        Ao sair, você precisará fazer login novamente para acessar sua conta.
                      </Text>

                      {/* Lembre-se da minha escolha */}
                      <View style={styles.rememberChoiceContainer}>
                        <Switch
                          value={rememberChoice}
                          onValueChange={setRememberChoice}
                        />
                        <Text style={[styles.rememberChoiceText, colorScheme === 'dark' && { color: '#fff' }]}>Lembre-se da minha escolha</Text>
                      </View>

                      {/* Botões de ação */}
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                          <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.exitButton}
                          onPress={handleLogoff}
                        >
                          <Text style={styles.buttonText}>Sair</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {modalContent === 'Deletar Conta' && (
                    <View>
                      {/* Ícone de Lixeira */}
                      <Icon name="trash" size={20} color="red" />

                      <Text style={[styles.modalText, colorScheme === 'dark' && { color: '#fff' }]}>Tem certeza  que deseja deletar sua conta?</Text>
                      <Text style={[styles.modalDescriptionText, colorScheme === 'dark' && { color: '#fff' }]}>
                        Tem certeza de que deseja excluir esta Conta? Esta ação não pode ser desfeita.
                      </Text>

                      {/* Botões de Ação */}
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                          <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.exitButton}
                          onPress={async () => {
                            setActionType('deleteAccount'); // Define o actionType para deletar conta
                            const password = await promptUserForPassword("deleteAccount"); // Chama prompt para a senha
                            handleDeleteAccount(password); // Após obter a senha, chama a função de exclusão
                          }}
                        >
                          <Text style={styles.buttonText}>Deletar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </BlurView>
            </Modal>
          </ScrollView>

          {/* Modal para solicitar senha */}
          <Modal visible={showPasswordModal} transparent={true} animationType="slide">
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                <Text>Digite sua senha para confirmar:</Text>
                <TextInput
                  secureTextEntry
                  style={{ borderWidth: 1, borderColor: 'gray', marginTop: 10, padding: 10 }}
                  placeholder="Insira a Senha"
                  value={passwordInput}
                  onChangeText={(text) => {
                    console.log('Senha digitada:', text); // Log para verificar o valor digitado
                    setPasswordInput(text);
                  }}
                />
                <TouchableOpacity onPress={handlePasswordSubmit} style={{ backgroundColor: '#ff8c00', padding: 10, marginTop: 10 }}>
                  <Text style={{ color: 'white' }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Renderiza a notificação se showNotification for verdadeiro */}
          {showNotification && (
            <View style={[
              styles.notificationContainer,
              colorScheme === 'dark' && { backgroundColor: '#000' }  // Preto no Dark Mode
            ]}>
              <Text style={[styles.notificationText, colorScheme === 'dark' && { color: '#fff' }]}>
                Você tem que validar seu e-mail para usar todas as funcionalidades do aplicativo.
              </Text>
              <TouchableOpacity
                style={styles.ignoreButton}
                onPress={() => {
                  setShowNotification(false);
                  setShowBell(false); // Esconde o sino permanentemente
                }}
              >
                <Text style={[styles.ignoreButtonText, colorScheme === 'dark' && { color: '#fff' }]}>Ignorar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2eeed',
  },
  containerOpcoes: {
    backgroundColor: '#fff',
    width: 360,
    height: '85%',
    borderRadius: 16,
    padding: 10,
    marginLeft: '6%',
    marginTop: '-70%',
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 }, // Deslocamento da sombra
    shadowOpacity: 0.5, // Opacidade da sombra
    shadowRadius: 4.5, // Raio da sombra

    // Sombra para Android
    elevation: 10, // Nível da sombra
  },
  containerScroll: {
    backgroundColor: '#fff',
    marginTop: '15%',
    flexGrow: 1,
    paddingBottom: '35%',
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ff8c00',
    borderWidth: 2,
    marginBottom: 10,
    zIndex: 1
  },

  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  placeholderText: {
    color: '#888',
    textAlign: 'center',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: -65,
    marginLeft: 30,
    right: -90,
  },
  notificationContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 5000,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: 'bold',
    zIndex: 99
  },
  ignoreButton: {
    backgroundColor: '#ff8c00',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  ignoreButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  line: {
    marginTop: '5%',
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  message: {
    marginTop: '5%',
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'left',
  },

  Options: {
    width: '95%',
    marginTop: '5%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.62,
    elevation: 4,
    marginVertical: 5,
    marginLeft: '2%'
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  textSwitch: {
    fontSize: 16,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
  },
  updateButton: {
    backgroundColor: '#ff8c00',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
    width: '100%',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 10,
  },
  closeButtonText: {
    color: 'red',
    fontSize: 24,
    fontWeight: 'bold',
  },
  updateButtonDisabled: {
    backgroundColor: '#b0b0b0', // Cinza para indicar que está desativado
  },
  warningText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  icon: {
    marginBottom: 10, // Espaçamento abaixo do ícone
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  rememberChoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberChoiceText: {
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  bullet: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  footer: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#555',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#666',
  },

  boldText: {
  fontWeight: 'bold',
  color: '#000',
},
});

export default Configuracoes;
