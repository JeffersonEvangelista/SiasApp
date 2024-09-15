import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Text style={styles.title}>Login</Text>
      
      {/* Contêiner para os campos e botões */}
      <View style={styles.formContainer}>
        {/* Campo de Entrada para o Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        {/* Campo de Entrada para a Senha */}
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Switch Lembrar de Mim */}
        <View style={styles.rememberMeContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            thumbColor={rememberMe ? '#F07A26' : '#fff'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
          <Text style={styles.rememberMeText}>Lembre de mim</Text>
        </View>

        {/* Botão de Login */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log('Login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* Esqueceu a senha */}
        <TouchableOpacity
          onPress={() => console.log('Esqueceu a senha')}
        >
          <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        {/* Divider */}
        <Text style={styles.divider}>OU</Text>

        {/* Botão Google */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => console.log('Login com Google')}
        >
          <Text style={styles.buttonText}>Continuar com Google</Text>
        </TouchableOpacity>
        
        {/* Botão para ir para a tela de Cadastro */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Cadastro')}
        >
          <Text style={styles.buttonText}>Ir para Cadastro</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    padding: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#333',
    color: '#fff',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rememberMeText: {
    color: '#fff',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#F07A26',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButton: {
    marginTop: 20,
    backgroundColor: '#F07A26',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#ccc',
    marginBottom: 15,
  },
  divider: {
    color: '#fff',
    marginVertical: 15,
  },
});
