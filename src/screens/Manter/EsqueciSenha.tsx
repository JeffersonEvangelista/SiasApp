import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Alert } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import CustomButton from '../Styles/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/Firebase';

interface FormErrors {
  email?: string;
  error?: string;
}

export default function EsqueciSenha() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [randomPoints, setRandomPoints] = useState<{ x: number, y: number }[]>([]);

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const generateRandomPoints = () => {
      const points = Array.from({ length: 30 }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
      }));
      setRandomPoints(points);
    };

    generateRandomPoints();
  }, [width, height]);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const checkIfEmailExists = async (trimmedEmail: string) => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', trimmedEmail));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();

    if (!validateEmail(trimmedEmail)) {
      setErrors({ email: 'O e-mail fornecido não é válido.' });
      return;
    }

    try {
      setLoading(true);

      const emailExists = await checkIfEmailExists(trimmedEmail);
      if (!emailExists) {
        setErrors({ email: 'O e-mail fornecido não existe. Verifique o e-mail informado.' });
        setLoading(false);
        return;
      }

      const auth = getAuth();
      await sendPasswordResetEmail(auth, trimmedEmail);

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
          
          {/* Renderização dos pontos laranjas */}
          {randomPoints.map((point, index) => (
            <View key={index} style={[styles.point, { left: point.x, top: point.y }]} />
          ))}

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

// Estilos
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
  point: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#F07A26', // Cor laranja
    borderRadius: 5,
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
