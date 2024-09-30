import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import CustomButton from '../Styles/CustomButton'; // Se não for mais necessário, pode ser removido
import { useNavigation } from '@react-navigation/native';

interface FormErrors {
  email?: string;
  senha?: string;
  novaSenha?: string;
  error?: string;
}

export default function EsqueciSenha() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [novaSenha, setNovaSenha] = useState<string>(''); // Campo para nova senha
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailValido, setEmailValido] = useState<boolean>(false); // Flag para validar email

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!validateEmail(trimmedEmail)) {
      setErrors({ email: 'O e-mail fornecido não é válido.' });
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, trimmedEmail, senha);
      setEmailValido(true); // Define o e-mail como válido após a autenticação
    } catch (error) {
      console.error('Erro ao verificar email:', error.message);
      setErrors({ ...errors, error: 'E-mail ou senha incorretos.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNovaSenhaSubmit = async () => {
    if (!novaSenha) {
      setErrors({ novaSenha: 'A nova senha é obrigatória.' });
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await updatePassword(user, novaSenha);
        console.log('Senha atualizada com sucesso!');
      } else {
        setErrors({ error: 'Usuário não autenticado.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar a senha:', error.message);
      setErrors({ error: 'Erro ao atualizar a senha.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0D0D1B', '#000']} // Mesmo estilo de fundo da tela de login
          style={styles.background}
        >
          <View style={{ marginTop: 50 }}>
            <Text style={styles.header}>Redefinir Senha</Text>
          
            <View style={styles.formContainer}>
              <PaperTextInput
                label="Email"
                style={styles.textInput}
                mode="outlined"
                activeOutlineColor="#F07A26"
                outlineColor="#CCCCCC"
                left={<PaperTextInput.Icon icon="email" />}
                value={email}
                onChangeText={setEmail}
                error={!!errors.email}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              <PaperTextInput
                label="Senha Atual"
                style={styles.textInput}
                mode="outlined"
                activeOutlineColor="#F07A26"
                outlineColor="#CCCCCC"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                error={!!errors.senha}
              />
              <HelperText type="error" visible={!!errors.senha}>
                {errors.senha}
              </HelperText>

              {loading ? (
                <ActivityIndicator size="large" color="#F07A26" />
              ) : (
                !emailValido ? (
                  <CustomButton title="Verificar Email" onPress={handleEmailSubmit} />
                ) : (
                  <>
                    <PaperTextInput
                      label="Nova Senha"
                      style={styles.textInput}
                      mode="outlined"
                      activeOutlineColor="#F07A26"
                      outlineColor="#CCCCCC"
                      secureTextEntry
                      value={novaSenha}
                      onChangeText={setNovaSenha}
                      error={!!errors.novaSenha}
                    />
                    <HelperText type="error" visible={!!errors.novaSenha}>
                      {errors.novaSenha}
                    </HelperText>

                    <CustomButton title="Atualizar Senha" onPress={handleNovaSenhaSubmit} />
                  </>
                )
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    borderRadius: 10,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  textInput: {
    marginBottom: 10,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerButton: {
    backgroundColor: '#F07A26', // Cor do botão de login
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Para que o botão ocupe toda a largura
  },
  footerButtonText: {
    color: '#FFFFFF', // Cor do texto do botão
    fontSize: 16,
  },
});
