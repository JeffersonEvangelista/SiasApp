import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../Styles/CustomButton';
import { styles } from '../Styles/styles';
import { useNavigation } from '@react-navigation/native'; 
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { checkEmailVerificationAndNotifyLogin } from '../../Notificacao/notifications';
const logo = require('./../../../assets/logo.png');

interface FormErrors {
  email?: string;
  Nome?: string;
  senha?: string;
  error?: string;
}

export default function Login() {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [Nome, setNome] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation(); 

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

  useEffect(() => {
    // Carregar e-mail e senha armazenados se "Lembre-se de mim" estiver ativado
    const loadCredentials = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        const storedSenha = await AsyncStorage.getItem('senha');
        const storedRememberMe = await AsyncStorage.getItem('rememberMe');

        console.log('Stored Email:', storedEmail); // Verifica se o email foi carregado
        console.log('Stored Senha:', storedSenha); // Verifica se a senha foi carregada
        console.log('Stored RememberMe:', storedRememberMe); // Verifica se "Lembre-se de mim" foi ativado
        
        if (storedEmail && storedSenha && storedRememberMe === 'true') {
          setEmail(storedEmail);
          setSenha(storedSenha);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
      }
    };

    loadCredentials();
  }, []);

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: FormErrors = {}; 

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      newErrors.email = 'O e-mail fornecido não é válido.';
    }

    if (!senha) {
      newErrors.senha = 'A senha fornecida não é válida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com o login
  const handleLogin = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email.trim(), senha);
        console.log('Login bem-sucedido!');
        
        if (rememberMe) {
          // Salvar credenciais no AsyncStorage
          await AsyncStorage.setItem('email', email.trim());
          await AsyncStorage.setItem('senha', senha);
          await AsyncStorage.setItem('rememberMe', 'true');
          console.log('Credenciais salvas:', { email, senha, rememberMe }); // Verifica se as credenciais foram salvas
        } else {
          // Remover credenciais se "Lembre-se de mim" não estiver ativado
          await AsyncStorage.removeItem('email');
          await AsyncStorage.removeItem('senha');
          await AsyncStorage.setItem('rememberMe', 'false');
          console.log('Credenciais removidas, rememberMe:', rememberMe); // Verifica se as credenciais foram removidas
        }
        checkEmailVerificationAndNotifyLogin();
        navigation.navigate('Home'); 
      } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        setErrors({ 
          senha: 'Credenciais inválidas. Verifique seu e-mail e senha',
          email: 'Credenciais inválidas. Verifique seu e-mail e senha',
        });        
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = () => {
    handleLogin(); 
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0D0D1B', '#000']}
          style={styles.background}
        >
          <View style={styles.gridContainer}>
            {Array.from({ length: Math.floor(height / 30) }).map((_, i) => (
              <View
                key={`horizontal-${i}`}
                style={[styles.line, {
                  top: i * 33,
                  width: width,
                  borderColor: 'rgba(224, 224, 224, 0.3)',
                }]} />
            ))}
            {Array.from({ length: Math.floor(width / 30) }).map((_, i) => (
              <View
                key={`vertical-${i}`}
                style={[styles.line, {
                  left: i * 36,
                  height: height,
                  borderColor: 'rgba(224, 224, 224, 0.3)',
                  borderLeftWidth: 1,
                  borderTopWidth: 0,
                }]} />
            ))}
          </View>
          {randomPoints.map((point, index) => (
            <View
              key={index}
              style={[styles.point, { left: point.x, top: point.y }]} />
          ))}
        </LinearGradient>

        <View style={styles.frameLayout}>
          <View style={styles.row}>
            <Image
              source={logo}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sias</Text>
          </View>
        </View>

        <Text style={styles.header}>Comece Agora</Text>
        <Text style={styles.subHeader}>Acesse sua conta e descubra tudo o que nosso aplicativo oferece</Text>

        <View style={styles.transitionContainer}>
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
              label="Senha"
              style={styles.textInput}
              mode="outlined"
              activeOutlineColor="#F07A26"
              outlineColor="#CCCCCC"
              secureTextEntry={!showPassword}
              right={
                <PaperTextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              value={senha}
              onChangeText={setSenha}
              error={!!errors.senha}
            />
            <HelperText type="error" visible={!!errors.senha}>
              {errors.senha}
            </HelperText>

            <View style={styles.rowContainer}>
              <View style={styles.checkboxContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#767577', true: '#0D0D1B' }} 
                  thumbColor={rememberMe ? '#F07A26' : '#f4f3f4'}
                  style={styles.switch}
                />
                <Text style={styles.checkboxLabel}>Lembre-se de mim</Text>
              </View>

              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => navigation.navigate('EsqueciSenha')}>
                <Text style={styles.forgotPassword}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#F07A26" />
            ) : (
              <CustomButton title="Login" onPress={handleSubmit} />
            )}

            <View style={styles.containeer}>
              <View style={styles.linee} />
              <Text style={styles.orText}>OU</Text>
              <View style={styles.linee} />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.BtnCadastro}>Cadastro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
