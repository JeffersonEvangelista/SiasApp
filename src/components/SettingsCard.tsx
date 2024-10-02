import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsCardProps {
  onOptionPress: (option: string) => void; // Função para quando qualquer opção for pressionada
}

const SettingsCard: React.FC<SettingsCardProps> = ({ onOptionPress }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true); // TODO: Persistir estado do botão de notoficação

  const toggleDarkMode = () => setIsDarkMode(prevState => !prevState);
  const toggleNotification = () => setIsNotificationEnabled(prevState => !prevState);

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>

        {/* Título de Configurações de Conta */}
        <Text style={styles.accountSettingsTitle}>Configurações de Conta</Text>

        {/* Opção de Editar Dados */}
        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => {}} // Função onPress vazia
        >
          <View style={styles.optionContent}>
            <Text style={styles.option}>Editar Dados</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        </TouchableOpacity>

        {/* Opção de Editar Senha */}
        <TouchableOpacity style={styles.optionContainer} onPress={() => onOptionPress('Editar senha')}>
          <View style={styles.optionContent}>
            <Text style={styles.option}>Editar senha</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        </TouchableOpacity>

        {/* Opção de Dark Mode */}
        <View style={styles.optionContainer}>
          <Text style={styles.option}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#e0e0e0', true: '#000000' }}
            thumbColor={isDarkMode ? '#ffffff' : '#888888'}
          />
        </View>

        {/* Opção de Notificação */}
        <View style={styles.optionContainer}>
          <Text style={styles.option}>Notificações</Text>
          <Switch
            value={isNotificationEnabled}
            onValueChange={toggleNotification}
            trackColor={{ false: '#e0e0e0', true: '#000000' }}
            thumbColor={isNotificationEnabled ? '#ffffff' : '#888888'}
          />
        </View>

        {/* Espaço em branco abaixo da notificação */}
        <View style={styles.whiteSpace} />

        {/* Opção "Mais opções" acinzentado */}
        <Text style={styles.moreOptionsText}>Mais opções</Text>

        {/* Opção "Sobre nós" com seta */}
        <TouchableOpacity style={styles.optionContainer} onPress={() => onOptionPress('Sobre nós')}>
          <View style={styles.optionContent}>
            <Text style={styles.option}>Sobre nós</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    top: '20%', // Originalmente 10%
    left: '37%',
    transform: [{ translateX: -150 }, { translateY: -140 }],
    height: 720, // Reduz a altura total do container
  },
  optionsContainer: {
    width: '100%',
    marginTop: 10, // Ajustar espaço superior para o título
  },
  accountSettingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888', // Cor acinzentada
    marginBottom: 100, // Espaço abaixo do título
    top: 90,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Diminuído para compactar as opções
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  option: {
    fontSize: 18,
    flex: 1,
  },
  whiteSpace: {
    height: 35, // Espaço em branco abaixo da notificação
  },
  moreOptionsContainer: {
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  moreOptionsText: {
    fontSize: 16,
    color: '#888', // Cor acinzentada
  },
});

export default SettingsCard;
