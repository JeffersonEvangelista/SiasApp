import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EditProfileButton from './EditProfileButton';
import LogOffButton from './LogoffButton';
import DeleteAccountButton from './DeleteAccountButton';
import { supabase } from '../services/userService';
import * as ImagePicker from 'expo-image-picker';

const Header: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (result.status !== 'granted') {
      alert('Desculpe, precisamos da permissão da câmera para isso funcionar!');
      return;
    }

    const pickedImage = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickedImage.cancelled) {
      uploadImage(pickedImage.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      // Converte a URI da imagem em ArrayBuffer
      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase
        .storage
        .from('avatars')
        .upload(`public/${Date.now()}.png`, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const imageUrl = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;

      // Atualiza a imagem do perfil com a URL do Supabase
      setProfileImage(imageUrl);
    } catch (error) {
      console.error('Erro ao fazer upload:', error.message);
      alert('Erro ao fazer upload da imagem!');
    } finally {
      setUploading(false);
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
    paddingVertical: -10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginBottom: -10,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    top: 70,
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
    top: -35,
  },
});

export default Header;
