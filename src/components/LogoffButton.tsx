import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LogOffButton {
  onPress: () => void;
}

const LogOffButton: React.FC<LogOffButton> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>Sair</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000', // Cor de fundo do botão
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 90,
    marginTop: 20,
    alignItems: 'center',
    position: 'static',
    top: 485,
  },
  buttonText: {
    color: '#ffffff', // Cor do texto
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogOffButton;
