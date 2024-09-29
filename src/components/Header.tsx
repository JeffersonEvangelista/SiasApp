import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Configurações</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 16,
    paddingVertical: 110, // Aumenta o padding vertical para dar mais espaço
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    marginBottom: 40, // Adiciona margem abaixo do cabeçalho para separar dos outros elementos
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24, // Aumenta o tamanho da fonte do título para mais destaque
    fontWeight: 'bold',
    color: '#fff', // Muda a cor do texto para branco para melhor contraste
  },
});

export default Header;
