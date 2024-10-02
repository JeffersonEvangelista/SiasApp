import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Modal, Pressable, TextInput } from 'react-native';
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
import SettingsCard from '../components/SettingsCard';
import { StatusBar } from 'expo-status-bar';
import { updateUserEmail, auth } from '../services/Firebase';

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
  const [username, setUsername] = useState<string>(''); // Estado para armazenar o nome de usuário
  const [email, setEmail] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado para o modal de logout
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false); // Estado para o modal de deletar conta
  const [showEditModal, setShowEditModal] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  const navigation = useNavigation();

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
    const success = await logOutUser(); // Chama a função de logoff
    if (success) {
      Alert.alert("Deslogado com sucesso!");
      navigation.navigate('Auth', { screen: 'Login' });
    } else {
      Alert.alert("Erro ao deslogar. Tente novamente.");
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
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.settingsContainer}>
        <SettingsCard onPress={() => {}} />
      </View>

      <View style={styles.profileSection}>
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

        <View style={styles.buttonContainer}>
          {/* Botão de Editar Dados */}
          <EditProfileButton onPress={() => setShowEditModal(true)} />

          {/* Botão de Logoff */}
          <LogOffButton onPress={() => setShowLogoutModal(true)} />

          {/* Botão de Deletar Conta */}
          <DeleteAccountButton onPress={() => setShowDeleteAccountModal(true)} />
        </View>
      </View>

      {/* Modal para Editar Dados */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Editar Dados</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={username}
              onChangeText={(text) => setUsername(text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
            />

          <Pressable
            style={[styles.buttonModal, styles.buttonSave]}
            onPress={handleUpdateProfile}  // Chama a função de atualização do perfil
          >
            <Text style={styles.textStyle}>Salvar</Text>
          </Pressable>
            <Pressable
              style={[styles.buttonModal, styles.buttonCancel]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.textStyle}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de Logout */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Deseja realmente sair?</Text>
            <Pressable
              style={[styles.buttonModal, styles.buttonClose]}
              onPress={handleLogoff}
            >
              <Text style={styles.textStyle}>Sim</Text>
            </Pressable>
            <Pressable
              style={[styles.buttonModal, styles.buttonCancel]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.textStyle}>Não</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de Deletar Conta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeleteAccountModal}
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Tem certeza que deseja deletar sua conta?</Text>
            <Pressable
              style={[styles.buttonModal, styles.buttonDelete]}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.textStyle}>Sim</Text>
            </Pressable>
            <Pressable
              style={[styles.buttonModal, styles.buttonCancel]}
              onPress={() => setShowDeleteAccountModal(false)}
            >
              <Text style={styles.textStyle}>Não</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      { /* Modal de confirmar senha */ }
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Digite sua senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
            <Pressable
              style={[styles.buttonModal, styles.buttonSave]}
              onPress={() => handlePasswordSubmit(password)} // Certifique-se de passar a senha atual como argumento
            >
              <Text style={styles.textStyle}>Confirmar</Text>
            </Pressable>
            <Pressable style={[styles.buttonModal, styles.buttonCancel]} onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.textStyle}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2eeed',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    position: 'absolute',
    top: 100,
    left: '10%',
    transform: [{ translateX: -50 }],
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ffffff',
    borderWidth: 2,
    marginBottom: 10,
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
  usernameText: { // Estilo para o nome de usuário
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: -65, // Espaço acima do nome de usuário
    marginLeft: 30,
    right: -90,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    top: -52,
    left: 110,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  buttonModal: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
    width: 100,
    alignItems: 'center',
  },
  buttonSave: {
    backgroundColor: 'green',
  },
  buttonClose: {
    backgroundColor: 'green',
  },
  buttonCancel: {
    backgroundColor: 'gray',
  },
  buttonDelete: {
    backgroundColor: 'red',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Configuracoes;
