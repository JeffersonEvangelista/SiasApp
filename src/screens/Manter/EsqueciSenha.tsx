import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import CustomButton from '../Styles/CustomButton'; // Se não for mais necessário, pode ser removido
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';


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


       // Exibir mensagem de sucesso e redirecionar para a Home
       Alert.alert(
        'Ops!!',
        'E-mail ou senha incorreto! Tente Novamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Redireciona para a Home
              navigation.navigate('EsqueciSenha');
            }
          }
        ],
        { cancelable: false }
      );

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
        
        // Exibir mensagem de sucesso e redirecionar para a Home
        Alert.alert(
          'Sucesso',
          'Sua senha foi atualizada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redireciona para a Home
                navigation.navigate('Home');
              }
            }
          ],
          { cancelable: false }
        );
        
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
        <LinearGradient colors={['#0D0D1B', '#000']} style={styles.background}>
          <View style={styles.gridContainer}>
            {Array.from({ length: Math.floor(height / 30) }).map((_, i) => (
              <View
                key={`horizontal-${i}`}
                style={[
                  styles.line,
                  {
                    top: i * 33,
                    width: width,
                    borderColor: 'rgba(224, 224, 224, 0.3)',
                  },
                ]}
              />
            ))}
            {Array.from({ length: Math.floor(width / 30) }).map((_, i) => (
              <View
                key={`vertical-${i}`}
                style={[
                  styles.line,
                  {
                    left: i * 36,
                    height: height,
                    borderColor: 'rgba(224, 224, 224, 0.3)',
                    borderLeftWidth: 1,
                    borderTopWidth: 0,
                  },
                ]}
              />
            ))}
          </View>
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
            ) : !emailValido ? (
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

};

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
    color: '#000', // Cor do texto para contraste
    marginBottom: 20,
  },
  btn: {
    textAlign: 'center',
    color: 'black',
    marginTop:15,
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
    width: 4,
    height: 4,
    backgroundColor: '#F07A26',
    borderRadius: 2,
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
