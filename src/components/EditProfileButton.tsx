import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface EditProfileButtonProps {
  onPress: () => void;
}

const EditProfileButton: React.FC<EditProfileButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>Editar Perfil</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000', // Cor de fundo do botão
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 20,
    alignItems: 'center',
    position: 'static',
    top: 250,
  },
  buttonText: {
    color: '#ffffff', // Cor do texto
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileButton;
