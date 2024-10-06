import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Alert } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import CustomButton from '../Styles/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore imports
import { db } from '../../services/Firebase'; // Importar o db corretamente

interface FormErrors {
  email?: string;
  error?: string;
}

export default function EsqueciSenha() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  
  const { width, height } = Dimensions.get('window');

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const checkIfEmailExists = async (trimmedEmail: string) => {
    // Fazer a consulta no Firestore para verificar se o email existe
    const usersCollection = collection(db, 'users'); // Certifique-se de que a coleção esteja correta
    const q = query(usersCollection, where('email', '==', trimmedEmail)); // Comparação exata do e-mail
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty; // Retorna true se o email existir
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();

    if (!validateEmail(trimmedEmail)) {
      setErrors({ email: 'O e-mail fornecido não é válido.' });
      return;
    }

    try {
      setLoading(true);

      // Verificar se o e-mail existe no banco de dados
      const emailExists = await checkIfEmailExists(trimmedEmail);
      if (!emailExists) {
        setErrors({ email: 'O e-mail fornecido não existe. Verifique o e-mail informado.' });
        setLoading(false);
        return;
      }

      const auth = getAuth();
      await sendPasswordResetEmail(auth, trimmedEmail); // Enviar o e-mail exatamente como foi digitado

      // Exibir mensagem de sucesso e redirecionar para o Login
      Alert.alert(
        'Sucesso',
        'Um e-mail para redefinir sua senha foi enviado!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('Erro ao enviar o e-mail de redefinição:', error.message);
      setErrors({ error: 'Erro ao enviar o e-mail de redefinição de senha. Verifique o e-mail informado.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <LinearGradient colors={['#0D0D1B', '#000']} style={styles.background}>
          <View style={styles.gridContainer}>
            {Array.from({ length: Math.floor(height / 30) }).map((_, i) => (
              <View
                key={`horizontal-${i}`}
                style={[styles.line, { top: i * 33, width: width, borderColor: 'rgba(224, 224, 224, 0.3)' }]}
              />
            ))}
            {Array.from({ length: Math.floor(width / 30) }).map((_, i) => (
              <View
                key={`vertical-${i}`}
                style={[styles.line, { left: i * 36, height: height, borderColor: 'rgba(224, 224, 224, 0.3)', borderLeftWidth: 1, borderTopWidth: 0 }]}
              />
            ))}
          </View>

          <View style={styles.transitionContainer}>
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

            {loading ? (
              <ActivityIndicator size="large" color="#F07A26" />
            ) : (
              <CustomButton title="Enviar Link de Redefinição" onPress={handlePasswordReset} />
            )}

            <View>
              <Text style={styles.btn}> OU </Text>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerButtonText}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

// Estilos (mantidos do seu código original)
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 0,
    margin: 0,
  },
  header: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  btn: {
    textAlign: 'center',
    color: 'black',
    marginTop: 15,
  },
  textInput: {
    marginBottom: 10,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerButton: {
    backgroundColor: '#F07A26',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  line: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(224, 224, 224, 0.3)',
  },
  transitionContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: '56%',
    paddingBottom: 16,
    borderRadius: 20,
    padding: 16,
  },
});
