import React from 'react';
import { TouchableOpacity, TouchableWithoutFeedback, Text, StyleSheet } from 'react-native';

interface EditProfileButtonProps {
  onPress: () => void;
}

const EditProfileButton: React.FC<EditProfileButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0} // Define opacidade ao clicar como 1 (sem efeito)
      hitSlop={{ top: 10, bottom: 10, left: 150, right: 5 }}
    >
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000', // Cor de fundo do botão
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 20,
    alignItems: 'center',
    position: 'static',
    top: 119,
    opacity: 0,
    right: -146,
  },
  buttonText: {
    color: '#ffffff', // Cor do texto
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileButton;
