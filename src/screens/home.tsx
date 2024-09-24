// Importações necessárias
import { StatusBar } from "expo-status-bar";
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCurrentUserData } from "../services/Firebase"; 

export default function Home() {
  const userData = getCurrentUserData();
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      {userData ? ( 
        <>
          <Text>Usuário Logado:</Text>
          <Text>Email: {userData.email}</Text>
          <Text>ID: {userData.id}</Text>
        </>
      ) : (
        <Text>Nenhum usuário logado.</Text>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
