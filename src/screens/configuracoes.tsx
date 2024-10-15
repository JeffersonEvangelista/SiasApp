import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Switch, Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { supabase } from '../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { getUserNameAndId } from '../services/userService';
import { DeleteUserDoc, getCurrentUserData, logOutUser, UpdateUserProfileImg } from '../services/Firebase';
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
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);

  const [currentPassword, setCurrentPassword] = useState(''); // Armazenar a senha atual
  const [newPassword, setNewPassword] = useState(''); // Armazenar a nova senha

  const [actionType, setActionType] = useState<"updateEmail" | "deleteAccount" | null>(null); // Para lidar com estado da ação (Deletar Conta e Alterar Email)

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

      // Buscando a foto de perfil
      const { data: profileData, error: profileError } = await supabase
        .from('candidatos')
        .select('foto_perfil, nome, email') // Buscando nome e foto de perfil
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Erro ao buscar dados do perfil:', profileError);
      } else {
        if (profileData) {
          setProfileImage(profileData.foto_perfil); // Define a foto de perfil
          setUsername(profileData.nome); // Define o nome de usuário
          setEmail(profileData.email);
          console.log('Foto de perfil carregada:', profileData.foto_perfil);
        }
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
      resolvePasswordRef.current = resolve; // Armazena a função resolve
      setActionType(action); // Define qual ação será executada após a senha
      setShowPasswordModal(true); // Exibe o modal
    });
  };

  // Função chamada ao submeter a senha
  const handlePasswordSubmit = async () => {
    if (resolvePasswordRef.current) {
      const password = passwordInput;
      resolvePasswordRef.current(password); // Passa a senha para a Promise

      if (actionType === "updateEmail") {
        await handleUpdateProfile(); // Chama a função de atualização de perfil
      } else if (actionType === "deleteAccount") {
        await handleDeleteAccount(); // Chama a função de deletar conta
      }
    }
    setShowPasswordModal(false); // Fecha o modal
    setPasswordInput(''); // Limpa o campo de senha
    setActionType(null); // Reseta a ação
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
      // Forçar a recarga dos dados do usuário do Firebase para garantir que o email esteja atualizado
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }

      const userEmail = auth.currentUser?.email;
      console.log('Usuário autenticado:', auth.currentUser); // Adicionando log para depuração

      if (!userEmail) {
        console.error('Email do usuário não encontrado no Firebase');
        return null;
      }

      // Buscar o ID do usuário no Supabase com o email atualizado
      const { data, error } = await supabase
        .from('candidatos')
        .select('id')
        .eq('email', userEmail?.toLowerCase()) // Comparação insensível a maiúsculas e minúsculas
        .single();

      if (error) {
        console.error('Erro ao buscar o ID no Supabase:', error);
        return null;
      }

      return data ? data.id : null; // Retorna o ID do Supabase ou null se não houver dados
    } catch (error) {
      console.error('Erro na função getUserIdFromSupabase:', error);
      return null;
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Validações antes de fazer update
      const emailTrimmed = email.trim();
      if (!validateEmail(emailTrimmed)) {
        Alert.alert('Por favor, insira um e-mail válido.');
        return;
      }

      if (!username.trim()) {
        Alert.alert('Por favor, insira um nome de usuário válido.');
        return;
      }

      const userId = await getUserIdFromSupabase(); // busca o ID do Supabase
      if (!userId) {
        Alert.alert('ID do usuário não encontrado. Verifique se o e-mail está correto.');
        return;
      }

      if (emailTrimmed !== auth.currentUser?.email) {
        // Solicita a senha para atualização de email
        const password = await promptUserForPassword("updateEmail");

        // Tenta atualizar o email no Firebase
        const emailUpdateSuccess = await updateUserEmail(emailTrimmed, password);
        if (!emailUpdateSuccess) {
          Alert.alert('Erro ao atualizar o e-mail no Firebase. Verifique suas credenciais.');
          return;
        }

        // Fechar o modal após sucesso no Firebase
        setShowPasswordModal(false);
      }

      // Atualiza nome e e-mail no Supabase
      const { error } = await supabase
        .from('candidatos')
        .update({ nome: username.trim(), email: emailTrimmed })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar dados no Supabase:', error);
        Alert.alert('Erro ao atualizar dados no Supabase.');
      } else {
        Alert.alert('Dados atualizados com sucesso!');
        loadUserData(); // Atualiza os dados do usuário
        setShowPasswordModal(false); // Fecha o modal, se estiver aberto
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

  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Você precisa estar logado para excluir sua conta.');
        return;
      }

      // Solicita a senha agora para a ação 'deleteAccount'
      const password = await promptUserForPassword("deleteAccount");

      // Reautentica o usuário com a senha fornecida
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Primeiro tenta deletar o usuário no Supabase
      const { error: supabaseError } = await supabase
        .from('candidatos')
        .delete()
        .eq('email', user.email);

      if (supabaseError) {
        console.error('Erro ao deletar conta no Supabase:', supabaseError);
        Alert.alert('Erro ao deletar a conta no Supabase. Tente novamente mais tarde.');
        return; // Se a exclusão no Supabase falhar, não continuar.
      }

      // Agora tenta deletar o usuário no Firebase, somente se a deleção no Supabase foi bem-sucedida
      await deleteUser(user);        
      const userId = getCurrentUserData();
      DeleteUserDoc(userId?.id!);
      console.log("Usuário deletado no Firebase com sucesso!");

      // Fecha o modal de senha e volta à tela inicial (ou navega para o login)
      setShowPasswordModal(false);
      Alert.alert('Conta deletada com sucesso!');
      closeModal();
      navigation.navigate('Auth', { screen: 'Login' });

    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      Alert.alert('Erro ao deletar a conta. Verifique sua senha e tente novamente.');
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
          <Text style={[styles.usernameText, colorScheme === 'dark' && { color: '#fff' }]}>
            {username ? username : 'Carregando...'}
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
                trackColor={{ false: "#767577", true: "#ff8c00" }}  // Barrinha laranja quando acionada
                thumbColor={isNotificationsEnabled ? "#ff8c00" : "#f4f3f4"}  // Botão laranja quando ativado
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

                      {/* Modal de confirmar senha */}
                      <Modal visible={showPasswordModal} transparent={true} animationType="slide">
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                            <Text>Digite sua senha para confirmar:</Text>
                            <TextInput
                              secureTextEntry
                              style={{ borderWidth: 1, borderColor: 'gray', marginTop: 10, padding: 10 }}
                              placeholder="Senha"
                              value={passwordInput}
                              onChangeText={setPasswordInput}
                            />
                            <TouchableOpacity onPress={handlePasswordSubmit} style={{ backgroundColor: '#ff8c00', padding: 10, marginTop: 10 }}>
                              <Text style={{ color: 'white' }}>Confirmar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Modal>

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
                      <Text style={[styles.modalInfo, colorScheme === 'dark' && { color: '#fff' }]}>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis, temporibus. Repudiandae ipsam unde dolor tenetur. Dolorem ab cupiditate aliquid velit. Quas fuga dicta similique! Ducimus culpa nam similique. Rerum, aliquam.</Text>
                    </View>
                  )}

                  {modalContent === 'Política de Privacidade' && (
                    <View>
                      <Text style={[styles.modalText, colorScheme === 'dark' && { color: '#fff' }]}>Política de Privacidade</Text>
                      <Text style={[styles.modalInfo, colorScheme === 'dark' && { color: '#fff' }]}>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Numquam, autem esse obcaecati atque quos officiis culpa soluta fuga! In sunt animi officiis distinctio possimus ad omnis sit natus pariatur fuga?</Text>
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
                        onPress={() => {
                          setActionType('deleteAccount'); // Define o actionType para deletar conta
                          setShowPasswordModal(true); // Abre o modal de senha
                        }} // Abre modal para digitar senha
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
                  placeholder="Senha"
                  value={passwordInput}
                  onChangeText={setPasswordInput}
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
});

export default Configuracoes;