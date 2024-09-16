import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, Dimensions, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './Styles/styles';
import { validateIdentifier } from './Dados/validationUtils';
import CustomButton from './Styles/CustomButton';
import { registerUser } from '../../services/Firebase';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { saveUserToSupabase } from '../../services/userService';
import { sendNotificationNow } from '../../Notificacao/notifications';

const logo = require('./../../../assets/logo.png');

interface FormErrors {
  email?: string;
  error?: string;
  Nome?: string;
  identificador?: string;
  senha?: string;
  confirmarSenha?: string;
}

const CadastroScreen = () => {
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [email, setEmail] = useState<string>('');
  const [Nome, setNome] = useState<string>('');
  const [identificador, setIdentificador] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      newErrors.email = 'O e-mail fornecido não é válido.';
    }
    if (!Nome) {
      newErrors.Nome = "O nome é obrigatório."
    }
    if (!identificador) {
      newErrors.identificador = 'O identificador (CPF ou CNPJ) é obrigatório.';
    } else {
      const identifierError = validateIdentifier(identificador);
      if (identifierError) {
        newErrors.identificador = identifierError;
      }
    }

    if (!senha) {
      newErrors.senha = 'A senha é obrigatória.';
    } else if (senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('Iniciando validação do formulário...');
    if (validateForm()) {
      console.log('Formulário válido! Enviando...');
      setLoading(true);
      try {
        const trimmedEmail = email.trim();
        await registerUser(trimmedEmail, senha);

        await saveUserToSupabase({
          nome: Nome,
          email: trimmedEmail,
          identificador: identificador,
          tipo_identificador: determineIdentifierType(identificador),
        });

        await sendNotificationNow(
          'Cadastro Completo',
          'Seu cadastro foi realizado com sucesso!'
        );

        navigation.navigate('Home');
      } catch (error) {
        console.error('Erro ao cadastrar usuário:', error.message);
        setErrors({ error: 'Erro ao cadastrar usuário. Tente novamente.' });
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Formulário inválido. Verifique os erros:', errors);
    }
  };

  const determineIdentifierType = (identificador: string): 'CPF' | 'CNPJ' => {
    const digitsOnly = identificador.replace(/\D/g, '');
    return digitsOnly.length === 11 ? 'CPF' : 'CNPJ';
  };

  const generateRandomPoints = () => {
    const points = [];
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      points.push({ x, y });
    }
    return points;
  };

  const randomPoints = generateRandomPoints();

  useEffect(() => {
    if (!isFocused) {
      setEmail('');
      setNome('');
      setIdentificador('');
      setSenha('');
      setConfirmarSenha('');
      setErrors({});
    }
  }, [isFocused]);

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

        <Text style={styles.header}>Inscreva-se Agora</Text>
        <Text style={styles.subHeader}>Crie sua conta e descubra tudo o que nosso aplicativo oferece</Text>

        <View style={styles.transitionContainer}>
          <View style={styles.formContainer}>
            <PaperTextInput
              label="Digite o seu nome completo"
              style={styles.textInput}
              mode="outlined"
              activeOutlineColor="#F07A26"
              outlineColor="#CCCCCC"
              left={<PaperTextInput.Icon icon="account" />}
              value={Nome}
              onChangeText={setNome}
              error={!!errors.Nome}
            />
            <HelperText type="error" visible={!!errors.Nome}>
              {errors.Nome}
            </HelperText>

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
              label="Digite seu CPF ou CNPJ"
              style={styles.textInput}
              mode="outlined"
              activeOutlineColor="#F07A26"
              outlineColor="#CCCCCC"
              keyboardType="numeric"
              left={<PaperTextInput.Icon icon="badge-account-horizontal-outline" />}
              value={identificador}
              onChangeText={setIdentificador}
              error={!!errors.identificador}
            />
            <HelperText type="error" visible={!!errors.identificador}>
              {errors.identificador}
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

            <PaperTextInput
              label="Confirmar Senha"
              style={[styles.textInput, errors.confirmarSenha && { borderColor: 'red', borderWidth: 1 }]}
              mode="outlined"
              activeOutlineColor="#F07A26"
              outlineColor="#CCCCCC"
              secureTextEntry={!showConfirmPassword}
              right={
                <PaperTextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              error={!!errors.confirmarSenha}
            />
            <HelperText type="error" visible={!!errors.confirmarSenha}>
              {errors.confirmarSenha}
            </HelperText>

            <Text style={styles.termsText}>Ao continuar, você concorda com os</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.terms}> termos</Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color="#F07A26" />
            ) : (
              <CustomButton title="Cadastrar" onPress={handleSubmit} />
            )}

            <View style={styles.containeer}>
              <View style={styles.linee} />
              <Text style={styles.orText}>OU</Text>
              <View style={styles.linee} />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.footerButtonText}>Cadastro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Termos e Condições</Text>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalText}>
                Mil vezes melhor do que o Java, mas tem que mudar isso depois porem fds
              </Text>
            </ScrollView>
            <Button title="Fechar" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CadastroScreen;
