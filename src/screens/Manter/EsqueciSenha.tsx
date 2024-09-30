import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
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

const logo = require('./../../../assets/logo.png');

export default function EsqueciSenha() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [novaSenha, setNovaSenha] = useState<string>(''); // Campo para nova senha
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailValido, setEmailValido] = useState<boolean>(false); // Flag para validar email

  
  const { width, height } = Dimensions.get('window');


  // Gerar os pontos aleatórios uma única vez e memorizar o valor.
  const randomPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      points.push({ x, y });
    }
    return points;
  }, [width, height]);
  
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
          colors={['#f5fffa', '#f5fffa']} // Gradiente como fundo
          style={styles.background}
        >
          <View style={styles.formContainer}>
            <Text style={styles.header}>Redefinir Senha</Text>
          
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

          <View>
            <Text style={styles.btn}> OU </Text>
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
    backgroundColor: 'black', // Fundo preto
  },
  container: {
    flex: 1,
    backgroundColor: 'black', // Fundo preto
  },
  background: {
    flex: 1,
  backgroundColor: 'white', // Fundo branco para os campos
  borderRadius: 20,
  padding: 20,
  width: '90%', // Definindo a largura como 90% da tela
  maxWidth: 400, // Tamanho máximo para a View
  height: 300, // Ajuste a altura conforme necessário (diminuída)
  alignSelf: 'center', // Centraliza a View horizontalmente
  marginTop: 100, // Aumente a margem superior para afastar do topo
  marginBottom: 200, // Reduza a margem inferior para não ficar tão próximo do fundo
  },
  header: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Cor do texto para contraste
    marginBottom: 20,
  },
  btn: {
    textAlign: 'center',
    color: 'black', // Cor do texto "OU" para contraste
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
