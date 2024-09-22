import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface SettingsCardProps {
  onOptionPress: (option: string) => void; // Função para quando qualquer opção for pressionada
}

const SettingsCard: React.FC<SettingsCardProps> = ({ onOptionPress }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleSwitch = () => setIsDarkMode(previousState => !previousState);

  // Isso aqui em específico está apenas temporariamente aqui para evitar a quebra do aplicativo e poder servir de placeholder nos botões de 'Notificação' e 'Placeholder' enquanto suas respectivas funções não foram codificadas
  const handlePress = (option: string) => {
    // Verifica se a função onOptionPress está definida antes de chamar
    if (onOptionPress) {
      onOptionPress(option);
    } else {
      console.log(`Placeholder para: ${option}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Principais Configurações</Text>
      <View style={styles.optionsContainer}>
        <View style={styles.optionContainer}>
          <Text style={styles.option}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleSwitch}
            trackColor={{ false: '#e0e0e0', true: '#000000' }} // Cor de fundo do switch
            thumbColor={isDarkMode ? '#ffffff' : '#888888'} // Cor do botão do switch (Se tiver dark mode implementado)
          />
        </View>
        <View style={styles.optionContainer}>
          <Text style={styles.option}>Notificação</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => handlePress('Notificação')}>
            <Icon name="bell" size={19} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.optionContainer}>
          <Text style={styles.option}>Placeholder</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => handlePress('Placeholder')}>
            <Icon name="arrow-right" size={19} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000', // Adiciona a cor dasombra para o efeito de elevação
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, // Serve para dar o efeito de elevação
    padding: 20,
    alignItems: 'center',
    position: 'absolute',
    top: '55%', // Centraliza verticalmente
    left: '50%', // Centraliza horizontalmente
    transform: [{ translateX: -150 }, { translateY: -160 }],
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  optionsContainer: {
    width: '100%',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  option: {
    fontSize: 18,
    flex: 1,
  },
  iconButton: {
    padding: 5,
  },
});

export default SettingsCard;
