import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Switch, Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EditProfileButton from '../components/EditProfileButton';
import LogOffButton from '../components/LogoffButton';
import DeleteAccountButton from '../components/DeleteAccountButton';
import { supabase } from '../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { getUserNameAndId } from '../services/userService';
import { getCurrentUserData, logOutUser, UpdateUserProfileImg } from '../services/Firebase';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { StatusBar } from 'expo-status-bar';
import { updateUserEmail, auth, isUserEmailVerified } from '../services/Firebase';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';



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
  const [password, setPassword] = useState('');
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
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);

  const toggleNotificationsSwitch = () => {
    setIsNotificationsEnabled(previousState => !previousState);
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

  const promptUserForPassword = async () => {
    return new Promise((resolve) => {
      resolvePasswordRef.current = resolve; // Armazena a função resolve no ref
      setShowPasswordModal(true); // Exibe o modal
    });
  };

  const handlePasswordSubmit = (password: string) => {
    setShowPasswordModal(false); // Fecha o modal
    if (resolvePasswordRef.current) {
      resolvePasswordRef.current(password); // Resolve a Promise com a senha digitada pelo usuário
    } else {
      console.error("resolvePassword is undefined");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { id: userId } = await getUserNameAndId();

      if (email !== auth.currentUser?.email) {
        const password = await promptUserForPassword(); // Chama a função que solicita a senha
        const emailUpdated = await updateUserEmail(email, password);

        if (!emailUpdated) {
          Alert.alert('Erro ao atualizar o e-mail no Firebase.');
          return;
        }
      }

      const { error } = await supabase
        .from('candidatos')
        .update({ nome: username, email })
        .eq('id', userId);

      if (error) {
        Alert.alert('Erro ao atualizar dados no Supabase.');
      } else {
        Alert.alert('Dados atualizados com sucesso!');
        setShowEditModal(false);
        loadUserData();
      }
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
    }
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

  const handleDeleteAccount = () => {
    // TODO: mplementar a lógica de deletar a conta do usuário.
    Alert.alert("Conta deletada com sucesso!");
    setShowDeleteAccountModal(false);
    navigation.navigate('Auth', { screen: 'Login' }); // Redireciona para a tela de login após deletar a conta
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


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.containerOpcoes}>
          <TouchableOpacity style={styles.profileCircle} onPress={pickImage}>
            {uploading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={styles.placeholderText}>Adicionar Imagem</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.usernameText}>
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
                backgroundColor: '#fff',
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


          <ScrollView contentContainerStyle={styles.containerScroll}>
            <View style={styles.line} />
            <Text style={styles.message}>Configurações de Conta</Text>

            <TouchableOpacity style={styles.Options} onPress={() => openModal('Editar dados')}>
              <Text style={styles.text}>Editar dados</Text>
              <Icon name="chevron-right" size={20} color="#ff8c00" style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.Options} onPress={() => openModal('Alterar a senha')}>
              <Text style={styles.text}>Alterar a senha</Text>
              <Icon name="chevron-right" size={20} color="#ff8c00" style={styles.icon} />
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.textSwitch}>Notificações</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#000" }}
                thumbColor={isNotificationsEnabled ? "#ff8c00" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleNotificationsSwitch}
                value={isNotificationsEnabled}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.textSwitch}>Dark mode</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#000" }}
                thumbColor={isDarkModeEnabled ? "#ff8c00" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleDarkModeSwitch}
                value={isDarkModeEnabled}
              />
            </View>

            <View style={styles.line} />
            <Text style={styles.message}>Mais Opções</Text>

            <TouchableOpacity style={styles.Options} onPress={() => openModal('Sobre nós')}>
              <Text style={styles.text}>Sobre nós</Text>
              <Icon name="chevron-right" size={20} color="#ff8c00" style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.Options} onPress={() => openModal('Política de Privacidade')}>
              <Text style={styles.text}>Política de Privacidade</Text>
              <Icon name="chevron-right" size={20} color="#ff8c00" style={styles.icon} />
            </TouchableOpacity>

            <View style={styles.line} />
            <Text style={styles.message}>Opções Avançadas</Text>

            <TouchableOpacity
              style={styles.Options}
              onPress={async () => {
                const choice = await AsyncStorage.getItem('rememberChoice');
                const isRememberChoice = choice ? JSON.parse(choice) : false;

                if (isRememberChoice) {
                  // Se o switch estiver ativado, desloga diretamente
                  handleLogoff();
                } else {
                  // Caso contrário, abre o modal
                  openModal('Sair do App');
                }
              }}
            >
              <Text style={styles.text}>Sair do App</Text>
              <Icon name="chevron-right" size={20} color="#ff8c00" style={styles.icon} />
            </TouchableOpacity>


            <TouchableOpacity style={styles.Options} onPress={() => openModal('Deletar Conta')}>
              <Text style={styles.text}>Deletar Conta</Text>
              <Icon name="chevron-right" size={20} color="#ff8c00" style={styles.icon} />
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
                <View style={styles.modalView}>
                  {/* Botão de Fechar como um X Vermelho */}
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>

                  {modalContent === 'Editar dados' && (
                    <View>
                      <Text style={{ fontSize: 18 }}>Editar Dados do Perfil</Text>
                      <TextInput
                        style={{ borderWidth: 1, borderColor: 'gray', marginTop: '5%', marginBottom: '10%', padding: 8 }}
                        placeholder="Nome de usuário"
                        value={username}
                        onChangeText={setUsername}
                        editable={emailVerified} // Bloqueia o campo se o e-mail não estiver verificado
                      />
                      <TextInput
                        style={{ borderWidth: 1, borderColor: 'gray', marginBottom: '10%', padding: 8 }}
                        placeholder="Email do usuário"
                        value={email}
                        onChangeText={setEmail}
                        editable={emailVerified} // Bloqueia o campo se o e-mail não estiver verificado
                      />

                      {/* Mensagem se o e-mail não estiver verificado */}
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
                    <View>
                      <Text style={styles.modalText}>Alterar Senha</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nova senha"
                        secureTextEntry={true}
                        onChangeText={(text) => console.log(`Nova senha: ${text}`)}
                      />
                      <TouchableOpacity style={styles.updateButton} onPress={() => { /* lógica para alterar a senha */ }}>
                        <Text style={styles.updateButtonText}>Alterar Senha</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {modalContent === 'Sobre nós' && (
                    <View>
                      <Text style={styles.modalText}>Sobre Nós</Text>
                      <Text style={styles.modalInfo}>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis, temporibus. Repudiandae ipsam unde dolor tenetur. Dolorem ab cupiditate aliquid velit. Quas fuga dicta similique! Ducimus culpa nam similique. Rerum, aliquam.</Text>
                    </View>
                  )}

                  {modalContent === 'Política de Privacidade' && (
                    <View>
                      <Text style={styles.modalText}>Política de Privacidade</Text>
                      <Text style={styles.modalInfo}>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Numquam, autem esse obcaecati atque quos officiis culpa soluta fuga! In sunt animi officiis distinctio possimus ad omnis sit natus pariatur fuga?</Text>
                    </View>
                  )}

                  {modalContent === 'Sair do App' && (
                    <View>
                      {/* Ícone */}
                      <Icon name="sign-out" size={20} color="red" style={styles.icon} />

                      <Text style={styles.modalText}>Tem certeza que deseja sair?</Text>
                      <Text style={styles.descriptionText}>
                        Ao sair, você precisará fazer login novamente para acessar sua conta.
                      </Text>

                      {/* Lembre-se da minha escolha */}
                      <View style={styles.rememberChoiceContainer}>
                        <Switch
                          value={rememberChoice}
                          onValueChange={setRememberChoice}
                        />
                        <Text style={styles.rememberChoiceText}>Lembre-se da minha escolha</Text>
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
                      {/* Ícone */}
                      <Icon name="trash" size={20} color="red" style={styles.icon} />

                      <Text style={styles.modalText}>Tem certeza  que deseja deletar sua conta?</Text>
                      <Text style={styles.descriptionText}>
                        Tem certeza de que deseja excluir esta Conta? Esta ação não pode ser desfeita.
                      </Text>

                      {/* Botões de ação */}
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                          <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.exitButton}
                          onPress={handleDeleteAccount}
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

          {/* Renderiza a notificação se showNotification for verdadeiro */}
          {showNotification && (
            <View style={styles.notificationContainer}>
              <Text style={styles.notificationText}>
                Você tem que validar seu e-mail para usar todas  as funcionalidades do aplicativo.

              </Text>
              <TouchableOpacity
                style={styles.ignoreButton}
                onPress={() => {
                  setShowNotification(false);
                  setShowBell(false); // Esconde o sino permanentemente
                }}
              >
                <Text style={styles.ignoreButtonText}>Ignorar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
      <StatusBar barStyle="light-content" backgroundColor="#ff8c00" />
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
