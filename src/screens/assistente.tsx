import { StatusBar } from "expo-status-bar";
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function assistente() {
  return (
    <View style={styles.container}>
      <Text>chatbot</Text>
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
