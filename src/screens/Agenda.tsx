import { StatusBar } from "expo-status-bar";
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Agenda() {
  return (
    <View style={styles.container}>
      <Text>Agenda</Text>
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
