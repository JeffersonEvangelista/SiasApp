import 'react-native-get-random-values';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Image, Alert, Easing, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/FontAwesome';
import { v4 as uuidv4 } from 'uuid';
import Lottie from 'lottie-react-native';
import { getCurrentUserEmail } from '../services/Firebase';
import { getUserName, countChatbotInteractionsForUser, fetchCandidatoByEmail, fetchRecrutadorByEmail, processAndSaveBugReport } from '../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { handleMaisDetalhesSobreOpcoes, handleDuvidasDoSistema, handleDuvidasSobreConta, handleCriadoresDoSistema, handleProposito, handleFuncionalidades, handleEntrevistasMarcadas, handleQuantidadeSolicitacoes, handleTempoConosco } from './Chatbot/Opcoes';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { stylesAssistente } from './Styles/styles';
import Markdown from 'react-native-markdown-display';

import { useColorScheme } from 'nativewind';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState(["1. Dúvidas do Sistema", "2. Relatar algum Bug", "3. Dúvidas sobre sua conta", "4. Mais detalhes sobre as opções"]);
  const [interviewState, setInterviewState] = useState({
    introductionGiven: false,
    step: 0,
    userPosition: "",
    userExperienceLevel: "",
    userEducation: "",
    informationCollected: false,
    questionsAndAnswers: []
  });
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [areOptionsVisible, setAreOptionsVisible] = useState(false);
  const flatListRef = useRef(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const dot1Animation = useRef(new Animated.Value(0)).current;
  const dot2Animation = useRef(new Animated.Value(0)).current;
  const dot3Animation = useRef(new Animated.Value(0)).current;
  const [optionsTimeout, setOptionsTimeout] = useState(null);
  const [expectingNextMessage, setExpectingNextMessage] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isCandidato, setIsCandidato] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [chatbotCount, setChatbotCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const currentHour = new Date().getHours();
  let greeting = '';
  const [userType, setUserType] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);
  const [subOptions, setSubOptions] = useState([]);
  const [showAttachIcon, setShowAttachIcon] = useState(false);
  const [isImageUploadEnabled, setIsImageUploadEnabled] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [isBotSendingMessage, setIsBotSendingMessage] = useState(false);
  const [mensagensMostradas, setMensagensMostradas] = useState([]);
  const messageCount = 0;
  const bugReport = { description: '', image: null };
  const [description, setDescription] = useState('');
  const [isReportingBug, setIsReportingBug] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [isDescriptionRequired, setIsDescriptionRequired] = useState(false);
  const [isReadyToSend, setIsReadyToSend] = useState(false);
 
  const trainVariations = [
    'treinar', 'Treinar', 'quero treinar', 'Quero treinar', 'vamos treinar', 'Vamos treinar',
    'preciso de treino', 'Preciso de treino', 'me ajude a treinar', 'Me ajude a treinar', 
    'treino', 'Treino', 'quero começar a treinar', 'Quero começar a treinar', 
    'quero continuar o treinamento', 'Quero continuar o treinamento', 
    'quero um treino mais avançado', 'Quero um treino mais avançado', 
    'quero treinar esta habilidade', 'Quero treinar esta habilidade', 
    'quero fazer um exercício', 'Quero fazer um exercício', 
    'quero um tutorial', 'Quero um tutorial', 
    'quero treinar todos os dias', 'Quero treinar todos os dias', 
    'quero treinar por 30 minutos', 'Quero treinar por 30 minutos', 
    'quero um treino rápido', 'Quero um treino rápido', 
    'vamos começar o treino', 'Vamos começar o treino', 
    'como treinar', 'Como treinar', 'gostaria de treinar', 'Gostaria de treinar', 
    'pode me ajudar a treinar', 'Pode me ajudar a treinar', 
    'exercício de treino', 'Exercício de treino', 'quero melhorar meu treino', 
    'Quero melhorar meu treino', 'preciso de ajuda para treinar', 
    'Preciso de ajuda para treinar', 'dicas de treino', 'Dicas de treino', 
    'pronto para treinar', 'Pronto para treinar', 'vou treinar', 'Vou treinar'
];

  const [isTrainingMode, setIsTrainingMode] = useState(false);
  // Mapeamento das subopções
  const subOptionsMapping = {
    "1. Dúvidas do Sistema": ["1. Criadores do Sistema", "2. Propósito", "3. Funcionalidades"],
    "2. Relatar algum Bug": ["1. Home", "2. Agenda", "3. Nessa tela (BOT)", "4. Chat", "5. Configurações"],
    "3. Dúvidas sobre sua conta": ["1. Entrevistas Marcadas", "2. Quantidade de Solicitações", "3. Tempo Conosco"],
    "4. Mais detalhes sobre as opções": ["1. Dúvidas do Sistema", "2. Relatar algum Bug", "3. Dúvidas sobre sua conta", "4. Mais detalhes sobre as opções"],
  } as const;

  let globalUserId = null;
  let globalUserType = '';

  // Effects
  useEffect(() => {
    flatListRef.current.scrollToEnd({ animated: true });
    return () => {
      clearTimeout(optionsTimeout);
    };
  }, [messages]);

  useEffect(() => {
    if (!isBotTyping) {
      stopTypingAnimation();
    }
  }, [isBotTyping]);

  useEffect(() => {
    const lastMessage = getLastMessage();
  }, [messages]);
  useEffect(() => {
    if (messages.length === 1) {
      setShowAnimation(false);
    }
    const initializeApp = async () => {
      try {
        // Solicitar permissões da galeria
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissões para acessar sua galeria.');
            return;
          }
        }

        // Buscar email do usuário
        const email = await getCurrentUserEmail();
        if (email) {
          setEmail(email);

          // Buscar nome do usuário
          const name = await getUserName();
          setUserName(name);
          console.log('Nome do usuário:', name);

          // Buscar dados de candidato ou recrutador
          const candidato = await fetchCandidatoByEmail(email);
          if (candidato) {
            setUserId(candidato.id);
            setIsCandidato(true);
            setUserType('candidato');
            console.log(`Candidato encontrado: ${candidato.nome}`);

            // Salvar os dados em variáveis globais
            globalUserId = candidato.id;
            globalUserType = 'candidato';
          } else {
            const recrutador = await fetchRecrutadorByEmail(email);
            if (recrutador) {
              setUserId(recrutador.id);
              setIsCandidato(false);
              setUserType('recrutador'); // Define o tipo de usuário como 'recrutador'
              console.log(`Recrutador encontrado: ${recrutador.nome}`);

              // Salvar os dados em variáveis globais
              globalUserId = recrutador.id;
              globalUserType = 'recrutador';
            } else {
              throw new Error('Usuário não encontrado em nenhuma das tabelas');
            }
          }

          // Exibir as variáveis globais no console para verificar
          console.log(`User ID global: ${globalUserId}`);
          console.log(`User Type global: ${globalUserType}`);
        }
      } catch (error) {
        console.error('Erro durante a inicialização da aplicação:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const fetchChatbotCount = async () => {
      if (userId && isCandidato !== null) {
        try {
          const count = await countChatbotInteractionsForUser(userId, isCandidato);
          setChatbotCount(count > 0 ? count : 1);
          console.log(`Quantidade de interações de chatbot: ${count}`);
        } catch (error) {
          console.error('Erro ao buscar a contagem de interações do chatbot:', error);
        }
      }
    };

    fetchChatbotCount();
  }, [userId, isCandidato]);


  // Tipo para as opções disponíveis
  const sendMessage = async (text: any, imageUri = null) => {
    // Registra a mensagem do usuário
    let userMessage = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
    };

    if (imageUri) {
      userMessage = {
        id: Date.now().toString(),
        text: '',
        imageUri: imageUri,
        sender: 'user',
      };
    }
    // Adicionar a mensagem do usuário ao array de mensagens
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (imageUri) {
      setIsDescriptionRequired(true); // Seta um estado para solicitar a descrição
    }

    console.log(`Mensagem enviada: ${text}`);

    // Adicionar a mensagem às mensagens mostradas para evitar duplicação
    if (text.trim()) {
      setMensagensMostradas((prevMensagens) => [...prevMensagens, text.trim()]);
    }

    // Chama as funções para lidar com a primeira mensagem do usuário e a resposta do bot
    if (isReportingBug) {
      handleFirstMessage();
    } else {
      handleUserMessage();
      setShowAnimation(false);
    }

    // Limpar o campo de entrada após o envio
    setInput('');
    setTimeout(() => {
      setIsBotSendingMessage(false);
    }, 1000);
  };

  // Função para iniciar a animação de digitação
  const startTypingAnimation = () => {
    // Inicia a animação de digitação para cada ponto
    [dot1Animation, dot2Animation, dot3Animation].forEach((dotAnimation, index) => {
      dotAnimation.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnimation, {
            toValue: 1,
            duration: 500,
            delay: index * 200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimation, {
            toValue: 0,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start();
    });
  };

  // Função para parar a animação de digitação
  const stopTypingAnimation = () => {
    // Para a animação de digitação para cada ponto
    [dot1Animation, dot2Animation, dot3Animation].forEach(dotAnimation => {
      dotAnimation.setValue(0);
    });
  };

  const typingTranslateY = (dotAnimation: any) => {
    // Cria a animação de digitação para cada ponto
    return dotAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5],
    });
  };

  // Função para iniciar a animação de digitação antes de uma resposta do bot
  const startTypingAnimationBeforeResponse = () => {
    setIsBotTyping(true);
    startTypingAnimation();
    setTimeout(() => {
      setIsBotTyping(false);
      stopTypingAnimation();
    }, 500);
  };

  // Função para resetar o chat
  const resetChat = () => {
    console.log("Chat resetado.");
    setMessages([]);
    setMensagensMostradas([]);
    setIsImageUploadEnabled(false);
    setInput('');
    setIsBotTyping(false);
    setIsBotSendingMessage(false);
    setIsTrainingMode(false);
    setInterviewState({});
    setIsReportingBug(false);
    setDescription('');
    setImageUri(null);
    setIsDescriptionRequired(false);
    setIsReadyToSend(false);
    setShowAnimation(true);
    setShowIntro(true);
    setAreOptionsVisible(false);
    setButtonsVisible(false);
    setSelectedOption(null);
    setSubOptions([]);
    setOptionsTimeout(null);
    setExpectingNextMessage(false);
  };

  // Função para lidar com a primeira mensagem do usuário
  const handleFirstMessage = () => {
    if (messages.length === 0) {
      setShowAnimation(false);
    }

    // Cria a mensagem do usuário
    const userMessage: Message = { id: uuidv4(), text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');

    // Verifica se é a primeira mensagem do usuário
    if (messages.length === 1) {
      handleGreetingMessage();
    }
  };

  // Função para lidar com a saudação do bot
  const handleGreetingMessage = () => {
    // Cria a saudação do bot
    const greeting = handleGreeting(new Date().getHours());
    const greetingMessage = { id: uuidv4(), text: greeting, sender: 'bot' };
    setMessages(prevMessages => [...prevMessages, greetingMessage]);

    // Cria as mensagens do bot
    const botMessages = [
      { id: uuidv4(), text: "Como posso ajudá-lo hoje?", sender: 'bot' },
      { id: uuidv4(), text: "Posso te responder questões do sistema, basta escrever 'Opções'.", sender: 'bot' },
      { id: uuidv4(), text: "Ou até mesmo treinar para respostas de entrevista, basta escrever 'Treinar'.", sender: 'bot' },
    ];

    // Chama a função para enviar as mensagens do bot
    sendBotMessages(botMessages);
  };

  // Função para enviar as mensagens do bot
  const sendBotMessages = (botMessages: string) => {
    // Enviar as mensagens do bot uma a uma
    botMessages.forEach((msg, index) => {
      setTimeout(() => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }, 100 * (index + 1));
    });
  };

  // Função para verificar se o usuário pediu opções
  const isOptionsRequest = (message: string) => {
    // Verifica se a mensagem do usuário contém uma palavra-chave para opções
    const optionsVariations = [
      'opções', 'opcoes', 'mostrar opções', 'exibir opções',
      'quero as opções', 'me mostre as opções', 'qual a opção?', 'opção',
      'alternativas', ' escolhas', 'possibilidades',
      'disponibilizar as opções', 'apresentar as opções',
      'o que posso fazer?', 'quais são minhas opções?', 'como posso continuar?',
      'me dá as opções', 'mostra o que tem', 'qual é a parada?',
      'opções de pagamento', 'opções de configuração', 'opções de menu'
    ];

    return optionsVariations.some(variation => message.toLowerCase().includes(variation));
  };

  // Função para lidar com a solicitação de opções
  const handleOptionsRequest = () => {
    if (isBotSendingMessage) return;
    console.log("Exibindo opções...");
    setAreOptionsVisible(true);

    setTimeout(() => {
      // Inicia a animação de digitação antes da resposta do bot
      startTypingAnimationBeforeResponse();

      const optionsText = options.map(option => `- ${option}`).join('\n');
      const botMessage = { id: uuidv4(), text: `As opções são:\n${optionsText}`, sender: 'bot' };
      console.log("Bot respondeu com opções.");
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsBotTyping(false);
      stopTypingAnimation();

      // Display buttons after options message is displayed
      setTimeout(() => {
        setButtonsVisible(true);
      }, 1000);

      const timeout = setTimeout(() => {
        setAreOptionsVisible(false);
      }, 15000);
      setOptionsTimeout(timeout);
    }, 1000);
  };
  // Função para lidar com a mensagem do usuário
  const handleUserMessage = () => {
    if (isTrainingMode) {
      handleTrainMessage(input);
    } else if (isTrainRequest(input)) {
      handleTrainRequest(input);
    } else if (isOptionsRequest(input)) {
      handleOptionsRequest();
    } else {
      handleDefaultResponse();
    }
  };

  // Função para lidar com as mensagens do usuário no modo treino
  const handleTrainMessage = async (message: string) => {

    handleTrainRequest(message);
  };

  // Função para verificar se o usuário pediu treinamento
  const isTrainRequest = (message: string) => {
    // Verifica se a mensagem do usuário contém uma palavra-chave para treinamento
    const trainVariations = [
      'treinar', 'Treinar', 'quero treinar', 'Quero treinar', 'vamos treinar', 'Vamos treinar',
      'preciso de treino', 'Preciso de treino', 'me ajude a treinar', 'Me ajude a treinar', 
      'treino', 'Treino', 'quero começar a treinar', 'Quero começar a treinar', 
      'quero continuar o treinamento', 'Quero continuar o treinamento', 
      'quero um treino mais avançado', 'Quero um treino mais avançado', 
      'quero treinar esta habilidade', 'Quero treinar esta habilidade', 
      'quero fazer um exercício', 'Quero fazer um exercício', 
      'quero um tutorial', 'Quero um tutorial', 
      'quero treinar todos os dias', 'Quero treinar todos os dias', 
      'quero treinar por 30 minutos', 'Quero treinar por 30 minutos', 
      'quero um treino rápido', 'Quero um treino rápido', 
      'vamos começar o treino', 'Vamos começar o treino', 
      'como treinar', 'Como treinar', 'gostaria de treinar', 'Gostaria de treinar', 
      'pode me ajudar a treinar', 'Pode me ajudar a treinar', 
      'exercício de treino', 'Exercício de treino', 'quero melhorar meu treino', 
      'Quero melhorar meu treino', 'preciso de ajuda para treinar', 
      'Preciso de ajuda para treinar', 'dicas de treino', 'Dicas de treino', 
      'pronto para treinar', 'Pronto para treinar', 'vou treinar', 'Vou treinar'
  ];
  
    return trainVariations.some(variation => message.toLowerCase().includes(variation));
  };

  const [askedQuestions, setAskedQuestions] = useState([]);

  const generateInterviewQuestionPrompt = (interviewState, askedQuestions) => {
    console.log("Gerando prompt de pergunta de entrevista...");

    let prompt = '';

    // Verifica o tipo de usuário (candidato ou recrutador)
    if (interviewState.userType === "candidato") {
      prompt = `
        Você é um entrevistador experiente que está conduzindo uma entrevista para a posição de ${interviewState.userPosition}.
        O candidato tem ${interviewState.userExperienceLevel} anos de experiência e formação em ${interviewState.userEducation}.
        Me gere apenas uma pergunta de cada vez, sem a necessidade de explicar o motivo. 
        Evite repetir as perguntas já feitas: ${askedQuestions.join(", ")}.
        As perguntas devem estar alinhadas com o nível do candidato e a vaga desejada.
      `;
    } else {
      console.log("Gerando prompt de pergunta de entrevista RH...");
      prompt = `
        Você deve atuar como um entrevistador de RH para uma posição de recrutador ${interviewState.userExperienceLevel} com foco em ${interviewState.userPosition}.
        Gere uma pergunta que avalie a capacidade do candidato em ${interviewState.userExperienceLevel} e que esteja alinhada com os valores da empresa, que são: inovação, colaboração e resultado.
        Evite repetir as perguntas já feitas: ${askedQuestions.join(", ")}.
        Porém, não precisa de título, e nem da explicação da pergunta, apenas a pergunta em si.
      `;
    }

    console.log("Prompt de pergunta de entrevista gerado:", prompt);

    return prompt;
  };


  // Função para gerar o prompt de feedback com base no desempenho
  const generateFeedbackPrompt = (interviewState: any) => {
    setLoading(true);
    // Ativa a animação de digitação
    startTypingAnimation();

    console.log("Gerando prompt de feedback...");

    // Formatação das perguntas e respostas
    const questionsAnswersText = interviewState.questionsAndAnswers
      .map((q) => `Pergunta: ${q.question}\nResposta: ${q.answer || "Resposta não fornecida"}`)
      .join("\n\n");

    // Gerar o prompt de feedback com base no tipo de usuário (candidato ou recrutador)
    let feedbackPrompt = '';

    if (interviewState.userType === "recrutador") {
      feedbackPrompt = `
    Você é um entrevistador experiente que acabou de conduzir uma entrevista com base nas seguintes informações:
    - Posição: ${interviewState.userPosition}
    - Nível de experiência: ${interviewState.userExperienceLevel} anos em recrutamento
    - Formação: ${interviewState.userEducation}
    - Perguntas e Respostas:
    ${questionsAnswersText}

    Avalie o desempenho do recrutador considerando os detalhes fornecidos.
    Informe os pontos fortes, as áreas a melhorar, e uma avaliação geral de como o recrutador lidaria com o processo de seleção e gestão de candidatos.
    Use um tom construtivo e oriente se você recomendaria o recrutador para a vaga.
    `;
    } else {
      feedbackPrompt = `
    Você é um entrevistador experiente que acabou de conduzir uma entrevista com base nas seguintes informações:
    - Posição: ${interviewState.userPosition}
    - Nível de experiência: ${interviewState.userExperienceLevel} anos
    - Formação: ${interviewState.userEducation}
    - Perguntas e Respostas:
    ${questionsAnswersText}

    Avalie o desempenho do candidato considerando os detalhes fornecidos.
    Informe os pontos fortes, as áreas a melhorar, erros cometidos durante a entrevista, e gere uma nota final para o desempenho do candidato (de 0 a 10).
    Estruture o feedback em três partes:
    1. **Pontos Fortes**
    2. **Pontos a Melhorar**
    3. **Nota Final**

    Use um tom construtivo e, por fim, informe se você contrataria esse candidato ou não.
    `;
    }
    try {
      console.log("Prompt de feedback gerado:", feedbackPrompt);
      return feedbackPrompt;

    } catch (error) {
      console.error("Erro durante o treinamento:", error);
    } finally {
      setIsBotTyping(false);
      setLoading(false);

    }
  };

  // Função para processar as mensagens e avançar nas etapas
  const handleTrainRequest = async (message: string) => {
    console.log("Iniciando treinamento...");
    setIsTrainingMode(true);
    setLoading(true);

    startTypingAnimation();

    try {
      // Inicializa a instância do GoogleGenerativeAI
      const API_KEY = 'AIzaSyAipfv2TKBNwxjDyCbW8iol0PgBFYB9LYY';
      const genAI = new GoogleGenerativeAI(API_KEY);

      if (message.toLowerCase().includes("encerrar") || message.toLowerCase().includes("terminar")) {
        await handleInterviewEnd(genAI, messages);
        setIsTrainingMode(false);
        return;
      }

      if (!interviewState.introductionGiven) {
        // Cria a introdução inicial apenas uma vez
        const introText = await generateIntroduction(genAI);
        const introMessage = {
          id: uuidv4(),
          text: introText,
          sender: 'bot',
        };
        setMessages((prevMessages) => [...prevMessages, introMessage]);
        setInterviewState({ ...interviewState, introductionGiven: true });
        stopTypingAnimation();
      } else {
        // Coleta informações do usuário
        const collectMessage = getCollectInfoMessage(message);
        if (collectMessage) {
          setMessages((prevMessages) => [...prevMessages, collectMessage]);
        }

        // Gera perguntas de entrevista se todas as informações forem coletadas
        if (interviewState.informationCollected) {
          const prompt = generateInterviewQuestionPrompt(interviewState, askedQuestions);
          const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(prompt);
          const questionText = result?.response?.text?.();
          const questionMessage = {
            id: uuidv4(),
            text: questionText,
            sender: 'bot',
          };
          setMessages((prevMessages) => [...prevMessages, questionMessage]);

          // Atualiza o estado com a pergunta gerada e a resposta do usuário
          setInterviewState((prev) => ({
            ...prev,
            questionsAndAnswers: [
              ...prev.questionsAndAnswers,
              { question: questionText, answer: message },
            ],
          }));
          setAskedQuestions((prev) => [...prev, questionText]);
        }
      }
    } catch (error) {
      console.error("Erro durante o treinamento:", error);
    } finally {
      setIsBotTyping(false);
      setLoading(false);
    }
  };


  // Função para gerar uma introdução amigável
  const generateIntroduction = async (genAI: any) => {
    setLoading(true);
    const introPrompt = `
    Crie uma mensagem de boas-vindas para iniciar uma entrevista de emprego.
        O tom deve ser amigável e profissional.
        A mensagem deve incluir os seguintes elementos:
        1. Um nome fictício para o entrevistador, seguido de uma breve apresentação. Sendo do cargo de RH da empresa.
        2. Me gere um nome para essa empresa também, caso não tenha nenhuma ideia use a empresa "Sias".
        3. Uma expressão de entusiasmo para conhecer o candidato, porém não precisa falar o nome dele.
        A mensagem deve ser acolhedora e incentivar o candidato a se sentir à vontade durante a entrevista.
    `;
    try {
      const introResult = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(introPrompt);
      const introText = introResult?.response?.text?.();

      const trainingMessage = "Lembre-se, isso é apenas um treino.\nNão significa nada.\nQuando quiser terminar o treino, basta escrever 'Encerrar'.";

      return `${introText}\n\n${trainingMessage}`;
    } catch (error) {
      console.error('Erro ao gerar introdução:', error);
    } finally {
      setLoading(false);
    }
  };



  // Função para coletar informações do usuário durante a entrevista
  const getCollectInfoMessage = (message: string) => {
    console.log('Função getCollectInfoMessage chamada com a mensagem:', message);

    // Utilizar a lógica baseada na etapa atual
    if (interviewState.step === 0) {
      console.log('Definindo tipo de usuário e passo 1');
      const userType = message.toLowerCase() === "recrutador" ? "recrutador" : "candidato";
      setInterviewState((prev) => ({ ...prev, userType, step: 1 }));
      console.log('Retornando mensagem para o passo 1');
      if (userType === "recrutador") {
        return {
          id: uuidv4(),
          text: "A empresa cujo você quer se candidatar tem qual temática?",
          sender: "bot"
        };
      } else {
        return {
          id: uuidv4(),
          text: "Para qual posição você está se candidatando?",
          sender: "bot"
        };
      }
    } else if (interviewState.step === 1) {
      console.log('Definindo posição do usuário e passo 2');
      setInterviewState((prev) => ({ ...prev, userPosition: message, step: 2 }));
      console.log('Retornando mensagem para o passo 2');
      return { id: uuidv4(), text: "Qual é o seu nível de experiência para essa posição?", sender: "bot" };
    } else if (interviewState.step === 2) {
      console.log('Definindo nível de experiência do usuário e passo 3');
      setInterviewState((prev) => ({ ...prev, userExperienceLevel: message, step: 3 }));
      console.log('Retornando mensagem para o passo 3');
      return { id: uuidv4(), text: "Qual é a sua formação?", sender: "bot" };
    } else if (interviewState.step === 3 && !interviewState.informationCollected) {
      console.log('Definindo formação do usuário e informações coletadas');
      setInterviewState((prev) => ({ ...prev, userEducation: message, informationCollected: true }));
      console.log('Retornando mensagem para informações coletadas');
      return { id: uuidv4(), text: "Agora que tenho suas informações, vamos começar a sua entrevista, ok?", sender: "bot" };
    }
    console.log('Retornando null');
    return null;
  };


  const handleInterviewEnd = async (genAI: any, prevMessages: any) => {
    console.log("Entrou na função handleInterviewEnd");
    try {
      console.log("Gerando prompt de feedback...");
      const feedbackPrompt = generateFeedbackPrompt(interviewState);
      console.log("Prompt de feedback gerado:", feedbackPrompt);

      console.log("Gerando feedback usando GoogleGenerativeAI...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const feedbackResult = await model.generateContent(feedbackPrompt);
      console.log("Resultado do feedback:", feedbackResult);

      const feedbackText = feedbackResult?.response?.text?.();
      console.log("Texto do feedback:", feedbackText);

      if (!feedbackText) {
        console.log("Erro: não foi possível gerar o feedback.");
        throw new Error("Não foi possível gerar o feedback.");
      }

      const botMessage = {
        id: uuidv4(),
        text: `## Seu feedback é:\n\n${feedbackText}`,
        sender: "bot",
      };
      console.log("Mensagem do bot:", botMessage);

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      console.log("Mensagens atualizadas:", prevMessages);

      console.log("Resetando estado da entrevista...");
      setIsTrainingMode(false);
      setInterviewState({});
    } catch (error) {
      console.log("Erro ao gerar feedback:", error);
      const errorMessage = error.message || "Erro desconhecido.";
      Alert.alert("Erro", `Não foi possível gerar o feedback. Detalhes: ${errorMessage}`);
      console.error(error);
    }
  };


  // Função para lidar com a resposta padrão
  const handleDefaultResponse = () => {
    setTimeout(() => {
      // Inicia a animação de digitação antes da resposta do bot
      startTypingAnimationBeforeResponse();

      const botMessages = [
        { id: uuidv4(), text: `Estou aqui para te ajudar a treinar`, sender: 'bot' },
        { id: uuidv4(), text: `Responder duvidas do sistema`, sender: 'bot' },
        { id: uuidv4(), text: `Mas posso fazer muito mais do que isso`, sender: 'bot' },
        { id: uuidv4(), text: `Basta escrever:`, sender: 'bot' },
        { id: uuidv4(), text: ` - "Opcoes"`, sender: 'bot' },
        { id: uuidv4(), text: `Ou `, sender: 'bot' },
        { id: uuidv4(), text: `"Treinar"`, sender: 'bot' },
        { id: uuidv4(), text: `a qualquer momento`, sender: 'bot' },

      ];

      sendBotMessages(botMessages);
    }, 0);
  };

  // Função para gerenciar saudações
  const handleGreeting = (userName: any) => {
    let greeting = '';
    if (currentHour < 5) {
      greeting = `Boa madrugada, ${userName}!`;
    } else if (currentHour < 12) {
      greeting = `Bom dia, ${userName}!`;
    } else if (currentHour < 18) {
      greeting = `Boa tarde, ${userName}!`;
    } else {
      greeting = `Boa noite, ${userName}!`;
    }
    return greeting;
  };

  // Função para lidar com a seleção de Opcoes
  const handleOptionSelect = (option: any) => {
    console.log(`Opção selecionada: ${option}`);
    const userMessage = { id: uuidv4(), text: `Selecionado: ${option}`, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    clearTimeout(optionsTimeout);
    setAreOptionsVisible(false);
    setIsBotTyping(true);
    startTypingAnimation();

    // Se a opção tem subopções, exibe as subopções
    if (subOptionsMapping[option]) {
      setSelectedOption(option);
      setSubOptions(subOptionsMapping[option]);
      setTimeout(() => {
        const botMessage = { id: uuidv4(), text: `Você escolheu: ${option}.`, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);

        subOptionsMapping[option].forEach((subOption, index) => {
          setTimeout(() => {
            const subOptionMessage = { id: uuidv4(), text: `- ${subOption}`, sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, subOptionMessage]);
          }, 250 * (index + 1));
        });

        setTimeout(() => {
          setIsBotTyping(false);
          stopTypingAnimation();
        }, 250 * subOptionsMapping[option].length + 1000);
      }, 1000);
      return;
    }

    // Se não houver subopções, apenas responde com a escolha
    setTimeout(() => {
      console.log("Bot respondeu com opção escolhida.");
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsBotTyping(false);
      stopTypingAnimation();
    }, 1000);
  };

  // Função para lidar com a seleção de subopções
  const handleSubOptionSelect = (subOption: any) => {
    console.log(`Subopção selecionada: ${subOption}`);
    const userMessage = { id: uuidv4(), text: `Selecionado: ${subOption}`, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Chamar função específica para a subopção selecionada
    switch (subOption) {
      case "1. Criadores do Sistema":
        handleCriadoresDoSistema(setIsBotTyping, setMessages);
        break;
      case "2. Propósito":
        handleProposito(setIsBotTyping, setMessages);
        break;
      case "3. Funcionalidades":
        handleFuncionalidades(setIsBotTyping, setMessages);
        break;
      case "1. Home":
      case "2. Agenda":
      case "3. Nessa tela (BOT)":
      case "4. Chat":
      case "5. Configurações":
        setIsReportingBug(true);
        enableImageUpload();
        setDescription('');
        setImageUri(null);
        break;
      case "1. Entrevistas Marcadas":
        handleEntrevistasMarcadas(setIsBotTyping, setMessages, userId, userName);
        break;
      case "2. Quantidade de Solicitações":
        handleQuantidadeSolicitacoes(setIsBotTyping, setMessages, userId, userName);
        break;
      case "3. Tempo Conosco":
        handleTempoConosco(setIsBotTyping, setMessages, userId, userName);
        break;
      case "4. Mais detalhes sobre as opções":
        handleMaisDetalhesSobreOpcoes(setIsBotTyping, setMessages);
        break;
      case "1. Dúvidas do Sistema":
        handleDuvidasDoSistema(setIsBotTyping, setMessages);
        break;
      case "2. Relatar algum Bug":
        sendBugReport();
        break;
      case "3. Dúvidas sobre sua conta":
        handleDuvidasSobreConta(setIsBotTyping, setMessages);
        break;
      default:
        console.log("Subopção sem função associada");
    }

    setIsBotTyping(true);
    startTypingAnimation();

    setSubOptions([]);
    setSelectedOption(null);
  };


  useEffect(() => {
    if (description && imageUri) {
      setIsReadyToSend(true);
    } else {
      setIsReadyToSend(false);
    }
  }, [description, imageUri]);

  const getLastMessage = () => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage) {
      //console.log(`Última mensagem enviada: ${lastMessage.text}`);
    } else {
      console.log('Nenhuma mensagem foi enviada ainda.');
    }

    return lastMessage;
  };

  const enableImageUpload = () => {
    const userMessage = { id: uuidv4(), text: `Mande uma imagem e uma descrição para dar continuidade`, sender: 'bot' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    selectImage();
    setIsImageUploadEnabled(true);
  };


  const sendBugReport = (imageUri, description) => {
    console.log('userId:', userId);
    if (!userId) {
      console.error('User id não está definido! Verifique a inicialização do usuário.');
      return;
    }

    console.log('Imagem URI:', imageUri);
    console.log('Descrição:', description);

    processAndSaveBugReport(userId, userType, description, imageUri)
      .then((success) => {
        if (success) {
          const userMessage = {
            id: Date.now().toString(),
            text: 'Obrigado  por nos ajudar a melhorar!',
            sender: 'bot',
          };

          setMessages((prevMessages) => [...prevMessages, userMessage]);
          setIsImageUploadEnabled(false);
        } else {
          const userMessage = {
            id: Date.now().toString(),
            text: 'Poxa, alguma coisa deu errado tente novamente',
            sender: 'bot',
          };

          setMessages((prevMessages) => [...prevMessages, userMessage]);
        }
      })
      .catch((error) => {
        console.error('Erro ao enviar bug report:', error);
        const userMessage = {
          id: Date.now().toString(),
          text: 'Erro ao enviar bug report. Tente novamente!',
          sender: 'bot',
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);
      });
  };

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setIsDescriptionRequired(true);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
    }
  };

  const sendImage = () => {
    if (description && imageUri) {
      const userMessage = {
        id: Date.now().toString(),
        text: description,
        imageUri: imageUri,
        sender: 'user',
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);

      console.log(`Mensagem enviada: ${description}`);

      setIsImageUploadEnabled(false);

      if (isReportingBug) {
        handleFirstMessage();
      } else {
        handleFirstMessage();
        handleUserMessage();
      }
      sendBugReport(imageUri, description);

      setDescription('');
      setImageUri(null);
      setInput('');
      setIsDescriptionRequired(false);
    }
  };


  const setImageModalVisible = (visible, uri) => {
    setIsImageModalVisible(visible);
    setSelectedImageUri(uri);
  };

  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <KeyboardAvoidingView
      style={[stylesAssistente.container, colorScheme === 'dark' && { backgroundColor: '#212121' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >

      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor="#ff8c00"
      />


      {showAnimation && (
        <View style={stylesAssistente.introContainer}>
          <Lottie
            source={{ uri: 'https://lottie.host/12b6782f-edfc-4b2c-91ad-fdc9419466b1/MttHHyP7Zv.json' }}
            autoPlay
            loop
            style={stylesAssistente.lottieAnimation}
          />
          <Text style={[stylesAssistente.introText, colorScheme === 'dark' && { color: '#fff' }]}>Olá! Sou o Assistente do Sias, me chamo Botly</Text>
          <Text style={[stylesAssistente.introText, colorScheme === 'dark' && { color: '#fff' }]}>Escreva alguma coisa para começarmos</Text>
        </View>
      )}

      <View style={[stylesAssistente.messagesContainer, colorScheme === 'dark' && { backgroundColor: '#212121' }]}>
        {messages.length > 0 && (
          <View style={[stylesAssistente.headerContainer, colorScheme === 'dark' && { backgroundColor: '#212121' }]}>
            <Text style={[stylesAssistente.chatIdText, colorScheme === 'dark' && { backgroundColor: 'transparent', color: '#fff' }]}>Chat #{chatbotCount + 1}</Text>
            <TouchableOpacity style={stylesAssistente.resetButtonTop} onPress={resetChat}>
              <FontAwesome name="refresh" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={[
            ...messages,
            isBotTyping ? { id: 'typing', text: '...', sender: 'bot' } : null
          ].filter(Boolean)}
          renderItem={({ item }) => (
            <View
              style={[
                stylesAssistente.message,
                item.sender === 'user' ? stylesAssistente.userMessage : stylesAssistente.botMessage,
                item.isBugMessage && stylesAssistente.bugMessageContainer,
              ]}
            >
              <View style={stylesAssistente.messageContent}>
                {item.sender === 'bot' && item.text === '...' ? (
                  // Animação de digitação
                  <View style={stylesAssistente.typingContainer}>
                    <Animated.Text style={[stylesAssistente.botText, { transform: [{ translateY: typingTranslateY(dot1Animation) }] }]}>.</Animated.Text>
                    <Animated.Text style={[stylesAssistente.botText, { transform: [{ translateY: typingTranslateY(dot2Animation) }] }]}>.</Animated.Text>
                    <Animated.Text style={[stylesAssistente.botText, { transform: [{ translateY: typingTranslateY(dot3Animation) }] }]}>.</Animated.Text>
                  </View>
                ) : item.imageUri ? (
                  <TouchableOpacity onPress={() => setImageModalVisible(true, item.imageUri)}>
                    <View>
                      <Image source={{ uri: item.imageUri }} style={{ width: 100, height: 100 }} />
                      <Text style={stylesAssistente.imageDescription}>{item.text}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  item.sender === 'bot' && item.text.includes("##") ? (
                    <Markdown style={markdownStyles}>{item.text}</Markdown>
                  ) : (
                    <Text style={{ color: item.sender === 'user' ? 'white' : 'black' }}>
                      {item.text}
                    </Text>
                  )
                )}
              </View>
            </View>
          )}
          keyExtractor={item => item.id}
          style={stylesAssistente.messages}
        />


        {isImageModalVisible && (
          <Modal
            visible={isImageModalVisible}
            transparent={true}
            onRequestClose={() => setImageModalVisible(false, null)}
          >
            <View style={stylesAssistente.modalBackground}>
              <Image source={{ uri: selectedImageUri }} style={stylesAssistente.modalImage} />
            </View>
          </Modal>
        )}


        {isImageModalVisible && (
          <Modal
            visible={isImageModalVisible}
            transparent={true}
            onRequestClose={() => setImageModalVisible(false, null)}
          >
            <View style={stylesAssistente.modalBackground}>
              <Image source={{ uri: selectedImageUri }} style={stylesAssistente.modalImage} />
            </View>
          </Modal>
        )}

        {areOptionsVisible && (
          <ScrollView
            horizontal={true}
            contentContainerStyle={stylesAssistente.scrollContainer}
            showsHorizontalScrollIndicator={false}
            style={stylesAssistente.scrollView}
          >
            <View style={stylesAssistente.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={stylesAssistente.optionButton}
                  onPress={() => handleOptionSelect(option)}
                >
                  <Text style={stylesAssistente.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {selectedOption && subOptionsMapping[selectedOption] && (
          <ScrollView
            horizontal={true}
            contentContainerStyle={stylesAssistente.scrollContainer}
            showsHorizontalScrollIndicator={false}
            style={stylesAssistente.scrollView}
          >
            <View style={stylesAssistente.subOptionsContainer}>
              {subOptionsMapping[selectedOption].map((subOption, index) => (
                <TouchableOpacity
                  key={index}
                  style={stylesAssistente.subOptionButton}
                  onPress={() => handleSubOptionSelect(subOption)}
                >
                  <Text style={stylesAssistente.subOptionButtonText}>{subOption}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>



      <View style={[stylesAssistente.inputArea, colorScheme === 'dark' && { backgroundColor: '#212121' }]}>
        {isImageUploadEnabled && (
          <TouchableOpacity onPress={selectImage} style={stylesAssistente.clipIconContainer}>
            <Icon name="paperclip" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {isDescriptionRequired && (
          <View>
            <Image source={{ uri: imageUri }} style={{ width: 100, height: 100 }} />
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                style={stylesAssistente.inputDescription}
                placeholder="Digite uma descrição para a imagem"
                value={description}
                onChangeText={(text) => setDescription(text)}
                onSubmitEditing={() => {
                  if (description.trim()) {
                    sendImage();
                  }
                }}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={() => {
                  if (description.trim()) {
                    sendImage();
                  }
                }}
                style={stylesAssistente.sendButton}
              >
                <Icon name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!isDescriptionRequired && (
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              style={[stylesAssistente.input, colorScheme === 'dark' && { backgroundColor: '#fff' }]}
              placeholder="Digite sua mensagem"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => {
                if (input.trim()) {
                  sendMessage(input);
                }
              }}
              returnKeyType="send"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => {
                if (input.trim()) {
                  sendMessage(input);
                }
              }}
              style={[
                stylesAssistente.sendButton,
                loading && { backgroundColor: '#aaa' },
              ]}
              disabled={loading}
            >
              <Icon name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

    </KeyboardAvoidingView>
  );
};
const markdownStyles = StyleSheet.create({
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
  },
  list_item: {
    marginVertical: 4,
  },
});