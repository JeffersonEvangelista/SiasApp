import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EditProfileButton from './EditProfileButton';
import LogOffButton from './LogoffButton';
import DeleteAccountButton from './DeleteAccountButton';
import { supabase } from '../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { getUserNameAndId } from '../services/userService';

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
    return true; // Retorna true para indicar sucesso
  } catch (err) {
    console.error(err);
    return null;
  }
};

const Header: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      const imageName = `${userId}`; // Nome da imagem
      const uploadSuccess = await uploadToSupabase(base64Image, 'png', 'avatars', imageName);

      if (uploadSuccess) {
        setProfileImage(`avatars/${imageName}`);

        // Chama a função para buscar o elemento na tabela
        const element = await fetchElementById(userId, `avatars/${imageName}`);
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
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.button} onPress={() => { /* Lógica para voltar */ }}>
        <Icon name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Configurações</Text>
        <TouchableOpacity style={styles.profileCircle} onPress={pickImage}>
          {uploading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.placeholderText}>Adicionar Imagem</Text>
          )}
        </TouchableOpacity>
        <EditProfileButton onPress={() => { /* Lógica para editar perfil */ }} />
        <LogOffButton onPress={() => { /* Lógica para logoff */ }} />
        <DeleteAccountButton onPress={() => { /* Lógica para deletar conta */ }} />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => { /* Lógica para o sino */ }}>
        <Icon name="bell" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ff8c00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -70,
    left: '50%',
    transform: [{ translateX: -70 }],
    borderColor: '#ffffff',
    borderWidth: 2,
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
  button: {
    padding: 15,
  },
});

export default Header;
