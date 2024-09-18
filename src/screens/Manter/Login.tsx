import React, { useState } from 'react';
import { View, Text, Image, Dimensions, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Switch } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './Styles/styles';
import CustomButton from './Styles/CustomButton';
import { useNavigation } from '@react-navigation/native'; // Importar useNavigation corretamente

const logo = require('./../../../assets/logo.png');

interface FormErrors {
  email?: string;
  Nome?: string;
  senha?: string;
}

export default function Login() {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [Nome, setNome] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation(); // Inicializar o hook de navegação

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

  const handleSubmit = () => {
    // Implement form submission logic here
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

        <Text style={styles.header}>Inscreva-se Agora</Text>
        <Text style={styles.subHeader}>Crie sua conta e descubra tudo o que nosso aplicativo oferece</Text>

        <View style={styles.transitionContainer}>
          <View style={styles.formContainer}>
            <PaperTextInput
              label="Nome"
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
                  trackColor={{ false: '#767577', true: '#0D0D1B' }} // Cor do trilho
                  thumbColor={rememberMe ? '#F07A26' : '#f4f3f4'} // Cor do botão
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

            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.createAccount}>Criar Conta</Text>
            </TouchableOpacity>
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
    </ScrollView>
  );
}
