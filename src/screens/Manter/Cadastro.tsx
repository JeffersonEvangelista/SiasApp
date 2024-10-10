import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Button, Dimensions, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../Styles/styles';
import { validateIdentifier } from './Dados/validationUtils';
import CustomButton from '../Styles/CustomButton';
import { registerUser } from '../../services/Firebase';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { saveRecrutadorToSupabase, saveCandidatoToSupabase } from '../../services/userService';
import { sendNotificationNow, checkEmailVerificationAndNotify } from '../../Notificacao/notifications';
import NetInfo from '@react-native-community/netinfo';
import LottieView from 'lottie-react-native';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/Firebase';
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
  const [showNoConnection, setShowNoConnection] = useState(false);


  // Função para formatar CPF ou CNPJ
  const formatCPFOrCNPJ = (value: any) => {
    const cleanedValue = value.replace(/\D/g, ''); // Remove caracteres não numéricos
    let formattedValue = '';

    if (cleanedValue.length <= 11) {
      // Formatação de CPF: XXX.XXX.XXX-XX
      formattedValue = cleanedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleanedValue.length <= 14) {
      // Formatação de CNPJ: XX.XXX.XXX/XXXX-XX
      formattedValue = cleanedValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      formattedValue = value; // Caso passe dos limites, mantém o valor sem formatação
    }

    return formattedValue;
  };

  // Função para tratar a mudança de texto
  const handleChangeText = (value: any) => {
    setIdentificador(formatCPFOrCNPJ(value));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      newErrors.email = 'O e-mail fornecido não é válido.';
    }
    if (!Nome) {
      newErrors.Nome = "O nome é obrigatório.";
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
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);

    if (!isConnected) {
      setLoading(false);
      setShowNoConnection(true);
      return;
    }
    console.log('Iniciando validação do formulário...');

    // Seu código de registro com modificação para exclusão no caso de erro
    if (validateForm()) {
      console.log('Formulário válido! Enviando...');
      setLoading(true);

      let userIdFirebase: string | null = null; // Variável para armazenar o ID do usuário no Firebase

      try {
        const profileImg = '';
        const trimmedEmail = email.trim();
        const identifierLength = identificador.replace(/\D/g, '').length;

        // Tentativa de registro no Firebase e envio de e-mail
        const registerResponse = await registerUser(trimmedEmail, senha, Nome, identificador, profileImg);

        if (!registerResponse?.success) {
          throw new Error('O registro no Firebase falhou.');
        }
        userIdFirebase = registerResponse.data.uid; // Armazena o userId retornado
        console.log('Usuário registrado e e-mail de verificação enviado com sucesso.');

        // Criação do objeto de usuário para o Supabase
        const user = {
          nome: Nome,
          email: trimmedEmail,
          cpf: identificador,
        };

        // Salvamento no Supabase com base no tipo de identificador
        if (identifierLength === 11) { // CPF
          await saveCandidatoToSupabase(user);
          console.log('Candidato salvo com sucesso no Supabase.');
        } else if (identifierLength === 14) { // CNPJ
          const recrutador = {
            nome: Nome,
            email: trimmedEmail,
            cnpj: identificador,
          };
          await saveRecrutadorToSupabase(recrutador);
          console.log('Recrutador salvo com sucesso no Supabase.');
        } else {
          throw new Error('Identificador inválido. Deve ter 11 dígitos para CPF ou 14 dígitos para CNPJ.');
        }

        // Primeiro, navega para a Home
        navigation.navigate('Home');

        // Depois de garantir que a navegação ocorreu, enviar notificações
        await sendNotificationNow('Cadastro Completo', 'Seu cadastro foi realizado com sucesso!');
        await checkEmailVerificationAndNotify();
      } catch (error: any) {
        console.error('Erro ao cadastrar usuário:', error.message);

        if (userIdFirebase) {
          // Se um erro ocorrer e o registro foi feito no Firebase, exclua o usuário
          console.log(`Excluindo o usuário ${userIdFirebase} no Firebase devido a um erro.`);
          await deleteFirebaseUser(userIdFirebase);
        }

        if (error.message.includes('Firebase')) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            email: 'Esse e-mail já se encontra no nosso banco de dados, utilize outro por favor.',
          }));
        } else if (error.message.includes('duplicate key value violates unique constraint')) {
          if (error.message.includes('candidatos_cpf_key')) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              identificador: 'Esse CPF já se encontra no nosso banco de dados, utilize outro por favor.',
            }));
          } else if (error.message.includes('recrutadores_cnpj_key')) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              identificador: 'Esse CNPJ já se encontra no nosso banco de dados, utilize outro por favor.',
            }));
          }
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            error: 'Erro ao cadastrar usuário. Tente novamente.',
          }));
        }
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Formulário inválido. Verifique os erros:', errors);
    }
  }


  const deleteFirebaseUser = async (userId: string) => {
    try {
      // Deletar o documento do usuário no Firestore
      await deleteDoc(doc(db, 'users', userId));
      console.log(`Usuário com ID ${userId} excluído do Firestore.`);
    } catch (error) {
      console.error('Erro ao excluir usuário no Firestore:', error);
    }
  };


  const determineIdentifierType = (identificador: string): 'CPF' | 'CNPJ' => {
    const digitsOnly = identificador.replace(/\D/g, '');
    return digitsOnly.length === 11 ? 'CPF' : 'CNPJ';
  };

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
              style={[styles.textInput, errors.email ? { borderColor: 'red', borderWidth: 1 } : {}]}
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
              style={[styles.textInput, errors.identificador ? { borderColor: 'red', borderWidth: 1 } : {}]}
              mode="outlined"
              activeOutlineColor="#F07A26"
              outlineColor="#CCCCCC"
              keyboardType="numeric"
              left={<PaperTextInput.Icon icon="badge-account-horizontal-outline" />}
              value={identificador}
              onChangeText={handleChangeText}
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
              style={[styles.textInput, errors.confirmarSenha ? { borderColor: 'red', borderWidth: 1 } : {}]}
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
              <View style={styles.linee} />
            </View>
          </View>


        </View>
      </View>
      {/* Animação de Conexão (Modal) */}
      <Modal transparent={true} visible={showNoConnection}>
        <View style={styles.modalBackground}>
          <LottieView
            source={{ uri: 'https://lottie.host/d563187e-e622-429e-9b48-7e5115da94aa/2ggDhkaD52.json' }}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          <TouchableOpacity
            style={styles.customButton}
            onPress={() => setShowNoConnection(false)}
          >
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam ipsum molestiae impedit sequi explicabo accusamus hic dolorum ullam illum dignissimos, assumenda expedita repellat tempore perspiciatis quo officiis odio, laudantium suscipit!
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CadastroScreen;