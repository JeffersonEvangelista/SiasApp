import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface DeleteAccountButton {
  onPress: () => void;
}

const DeleteAccountButton: React.FC<DeleteAccountButton> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>Deletar Conta</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF0000', // Cor de fundo do botão
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 50,
    marginTop: 20,
    alignItems: 'center',
    position: 'static',
    top: 475,
  },
  buttonText: {
    color: '#ffffff', // Cor do texto
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeleteAccountButton;
