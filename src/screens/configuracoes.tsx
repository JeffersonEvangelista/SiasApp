import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../components/Header';
import SettingsCard from '../components/SettingsCard';

export default function Configuracoes() {
  const handleArrowPress = () => {
    // Lógica para quando o botão de seta for pressionado
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Configurações</Text>
        <SettingsCard onPress={handleArrowPress} />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2eeed', // Cor de fundo da tela
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
