import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import EditProfileButton from './EditProfileButton';
import LogOffButton from './LogoffButton';
import DeleteAccountButton from './DeleteAccountButton';

const Header: React.FC = () => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.button} onPress={() => { /* Lógica para voltar */ }}>
        <Icon name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Configurações</Text>
        <View style={styles.profileCircle}>
          {/* NaN */}
        </View>
        <EditProfileButton onPress={() => { /* Lógica para editar perfil */ }} />
        <LogOffButton onPress={() => { /* Lógica para logoff */ }} />
        <DeleteAccountButton onPress={() => { /* Lógica para Deletar conta */ }} />
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
        backgroundColor: '#ff8c00', // Cor de fundo do cabeçalho
        paddingHorizontal: 16,
        paddingVertical: -10, // Mantém padding positivo para o espaço interno
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc', // Cor da borda inferior
        marginBottom: -10, // Margem negativa para ajustar o posicionamento
      },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20, // Espaçamento para o círculo
    top: 70
  },
  profileCircle: {
    width: 140,
    height: 140,
    borderRadius: 70, // Arredondamento do Círculo
    backgroundColor: '#e0e0e0', // Cor de fundo do círculo
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -70,
    left: '50%',
    transform: [{ translateX: -70 }],
    borderColor: '#ffffff',
  },
  button: {
    padding: 15,
    top: -35,
  },
});

export default Header;
