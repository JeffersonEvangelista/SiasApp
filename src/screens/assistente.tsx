import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Modal, Platform, Pressable, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Lottie from 'lottie-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { getCurrentUserEmail } from '../services/Firebase';
import { stylesAssistente } from './Styles/styles';
import { getUserName, countChatbotInteractionsForUser, fetchCandidatoByEmail, fetchRecrutadorByEmail,contarEntrevistasPorUsuario, buscarEntrevistasPorUsuario, buscarEntrevistasPorRecrutador } from '../services/userService';

// Definindo o tipo da mensagem
type Message = {
  id: string;
  text?: string;
  sender: 'user' | 'bot';
  imageUri?: string;
  videoUri?: string;
};
interface ResponseType {
  status: string;
  data: any;
}
interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  handleSelectMedia: () => void;
  reportingBug?: boolean;
}

export default function Assistente() {
  const [email, setEmail] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showAnimation, setShowAnimation] = useState<boolean>(true);
  const [reportingBug, setReportingBug] = useState<boolean>(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [chatbotCount, setChatbotCount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [isCandidato, setIsCandidato] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const [waitingForNameChange, setWaitingForNameChange] = useState(false);
  const [waitingForNewName, setWaitingForNewName] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false); // Adicione isso

  useEffect(() => {
    const getPermissions = async () => {
      try {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissões para acessar sua galeria.');
          }
        }
      } catch (error) {
        console.error('Erro ao solicitar permissões:', error);
      }
    };
    getPermissions();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = await getCurrentUserEmail();
        if (email) {
          setEmail(email);
          const name = await getUserName();
          setUserName(name);
          console.log('Nome do usuário:', name);

          const candidato = await fetchCandidatoByEmail(email);
          if (candidato) {
            setUserId(candidato.id);
            setIsCandidato(true);
            console.log(`Candidato encontrado: ${candidato.nome}`);
          } else {
            const recrutador = await fetchRecrutadorByEmail(email);
            if (recrutador) {
              setUserId(recrutador.id);
              setIsCandidato(false);
              console.log(`Recrutador encontrado: ${recrutador.nome}`);
            } else {
              throw new Error('Usuário não encontrado em nenhuma das tabelas');
            }
          }
        }
      } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchChatbotCount = async () => {
      try {
        if (userId && isCandidato !== null) {
          const count = await countChatbotInteractionsForUser(userId, isCandidato);
          setChatbotCount(count > 0 ? count : 1);
          console.log(`Quantidade de interações de chatbot: ${count}`);
        }
      } catch (error) {
        console.error('Erro ao obter contagem de interações do chatbot:', error);
      }
    };

    fetchChatbotCount();
  }, [userId, isCandidato]);


  // ================================================================== Logiccas do chatbot, nao mexer nessa parte pois vai dar ruim ======================================== 
  // Função para enviar mensagens
  const sendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      setIsTyping(true); // Inicie o efeito de digitação

      setTimeout(() => {
        const botResponses = generateResponse();

        botResponses.forEach((response, index) => {
          setTimeout(() => {
            const botMessage: Message = {
              id: (Date.now() + index + 1).toString(),
              text: response,
              sender: 'bot',
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          }, index * 100);
        });

        setIsTyping(false);
      }, 500); // Tempo de atraso antes do bot começar a responder

      setInput('');
      setShowIntro(false);
      setReportingBug(false);
    }
  };

  // Função para gerar respostas do bot
  const generateResponse = () => {
    const currentHour = new Date().getHours();
    let responses = [];

    if (currentHour < 5) {
      responses.push(`Boa madrugada, ${userName}!`);
      responses.push(`Gostaria que eu te chamasse de outra forma?`);
      setWaitingForNameChange(true);
    } else if (currentHour < 12) {
      responses.push(`Bom dia, ${userName}!`);
      responses.push(`Gostaria que eu te chamasse de outra forma?`);
      setWaitingForNameChange(true);
    } else if (currentHour < 18) {
      responses.push(`Boa tarde, ${userName}!`);
      responses.push(`Gostaria que eu te chamasse de outra forma?`);
      setWaitingForNameChange(true);
    } else {
      responses.push(`Boa noite, ${userName}!`);
      responses.push(`Gostaria que eu te chamasse de outra forma?`);
      setWaitingForNameChange(true);
    }

    console.log('Respostas geradas:', responses);
    return responses;
  };

  // Função para lidar com a seleção das opções
  const handleOptionSelect = (selectedOption: string) => {
    const trimmedOption = selectedOption.trim();
    console.log(`Opção selecionada: ${trimmedOption}`);

    setMessages(prevMessages => [
      ...prevMessages,
      { id: Date.now().toString(), text: trimmedOption, sender: 'user' },
    ]);

    // Lógica para cada opção
    switch (trimmedOption) {
      case '1. Dúvidas do Sistema':
        console.log('Lógica para a Dúvida do Sistema'); // Log para a opção 1
        DuvidasdoSistema();
        break;
      case '2. Relatar algum Bug':
        console.log('Lógica para Relatar Bug'); // Log para a opção 2
        relatosdeBugs();
        break;
      case '3. Duvidas sobre sua conta':
        console.log('Lógica para Dúvidas sobre Conta'); // Log para a opção 3
        Duvidasdaconta();

        break;
      case '4. Mais detalhes sobre as opcoes':
        console.log('Chamando explicação das opções');
        explicacaodasopcoes();
        break;
      // ========================================== Duvidas da conta =========================================================================== 
      case '1. Entrevistas Marcadas':
        console.log('Etrevistas selecionadas');
        EntrevistasMarcadas(userId);
        break;
      case '2. Quantidade de Solicitações':
        console.log('Chamando explicação das opções');
        mostrarQuantidadeEntrevistas (userId);
        break;
      case '3. Tempo Conosco':
        console.log('Chamando explicação das opções');
        break;
      case '4. Suas Configurações':
        console.log('Chamando explicação das opções');
        explicacaodasopcoes();
        break;
      default:
        console.log('Opção não reconhecida');
        break;
    }

    // Limpar opções após a seleção
    setOptions([]);
  };


  const explicacaodasopcoes = () => {
    const explanations = [
      { text: `Claro, eu adoraria te ajudar!` },
      { text: `Minhas principais funções podem ser definidas em 4 tópicos diferentes.` },
      { text: `1. Dúvidas do Sistema: Você pode perguntar sobre como o sistema funciona e suas principais funcionalidades, e eu estarei aqui para explicar.` },
      { text: `2. Relatar algum Bug: Apesar de fazermos o possível para que isso não aconteça, às vezes pequenos erros podem passar.` },
      { text: `Se você encontrou um erro ou um problema no sistema, descreva o que aconteceu e vamos resolver juntos.` },
      { text: `3. Dúvidas sobre sua conta: Se tiver questões sobre sua conta, como acesso ou se possui agendamento de entrevista e até mesmo configurações, estou pronto para ajudar.` },
      { text: `4. Mais detalhes sobre as opções: E finalmente a opção que você está experimentando agora.` },
    ];


    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot', icon: explanations[index] },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 500);
      } else {
        setIsTyping(false);
        setOptions(['1. Duvidas do Sistema', '2. Relatar algum Bug', '3. Duvidas sobre sua conta', '4. Mais detalhes sobre as opcoes']);
      }
    };
    sendMessageRecursively(0);
  };
  const Duvidasdaconta = () => {
    const explanations = [
      { text: `Claro, ficarei feliz em ajudar!` },
      { text: `Infelizmente, ainda estou em "crescimento", então não posso ajudar com muitas questões.` },
      { text: `Por enquanto, posso ajudar apenas com questões simples.` },
      { text: `1. Você tem alguma entrevista marcada ou pendente?` },
      { text: `2. Quantas solicitações de entrevista você já enviou ou recebeu?` },
      { text: `3. Há quanto tempo você possui essa conta?` },
      { text: `4. Quais são suas configurações atuais?` },
      { text: `Por ora, isso é tudo que posso oferecer.` },
    ];

    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot', icon: explanations[index] },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 0);
      } else {
        setIsTyping(false);
        setOptions(['1. Entrevistas Marcadas', '2. Quantidade de Solicitações', '3. Tempo Conosco', '4. Suas Configurações']);
      }
    };
    sendMessageRecursively(0);
  };

  const relatosdeBugs = () => {
    const explanations = [
      { text: `Claro, eu adoraria te ajudar!` },
      { text: `Minhas principais funções podem ser definidas em 4 tópicos diferentes.` },
      { text: `1. Dúvidas do Sistema: Você pode perguntar sobre como o sistema funciona e suas principais funcionalidades, e eu estarei aqui para explicar.` },
      { text: `2. Relatar algum Bug: Apesar de fazermos o possível para que isso não aconteça, às vezes pequenos erros podem passar.` },
      { text: `Se você encontrou um erro ou um problema no sistema, descreva o que aconteceu e vamos resolver juntos.` },
      { text: `3. Dúvidas sobre sua conta: Se tiver questões sobre sua conta, como acesso ou se possui agendamento de entrevista e até mesmo configurações, estou pronto para ajudar.` },
      { text: `4. Mais detalhes sobre as opções: E finalmente a opção que você está experimentando agora.` },
    ];

    setOptions(['1. Duvidas do Sistema', '2. Relatar algum Bug', '3. Duvidas sobre sua conta', '4. Mais detalhes sobre as opcoes']);

    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot', icon: explanations[index].icon },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 500);
      } else {
        setIsTyping(false);
      }
    };
    setOptions(['1. Duvidas do Sistema', '2. Relatar algum Bug', '3. Duvidas sobre sua conta', '4. Mais detalhes sobre as opcoes']);

    sendMessageRecursively(0);
  };
  const DuvidasdoSistema = () => {
    const explanations = [
      { text: `Claro, eu adoraria te ajudar!` },
      { text: `Minhas principais funções podem ser definidas em 4 tópicos diferentes.` },
      { text: `1. Dúvidas do Sistema: Você pode perguntar sobre como o sistema funciona e suas principais funcionalidades, e eu estarei aqui para explicar.` },
      { text: `2. Relatar algum Bug: Apesar de fazermos o possível para que isso não aconteça, às vezes pequenos erros podem passar.` },
      { text: `Se você encontrou um erro ou um problema no sistema, descreva o que aconteceu e vamos resolver juntos.` },
      { text: `3. Dúvidas sobre sua conta: Se tiver questões sobre sua conta, como acesso ou se possui agendamento de entrevista e até mesmo configurações, estou pronto para ajudar.` },
      { text: `4. Mais detalhes sobre as opções: E finalmente a opção que você está experimentando agora.` },
    ];

    setOptions(['1. Duvidas do Sistema', '2. Relatar algum Bug', '3. Duvidas sobre sua conta', '4. Mais detalhes sobre as opcoes']);

    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot', icon: explanations[index] },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 500);
      } else {
        setIsTyping(false);
      }
    };
    setOptions(['1. Duvidas do Sistema', '2. Relatar algum Bug', '3. Duvidas sobre sua conta', '4. Mais detalhes sobre as opcoes']);

    sendMessageRecursively(0);
  };

  const EntrevistasMarcadas = async (userId) => {
    setIsTyping(true);
  
    const explanations = [
      { text: `Claro, vamos verificar as entrevistas!` },
      { text: `Um momento, por favor...` },
      { text: `Estou conferindo as entrevistas...` },
    ];
  
    sendMessagesRecursively(explanations, 0);
  
    try {
      console.log(`Buscando entrevistas para o usuário: ${userId}`);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Buscando entrevistas para o usuário: ${userId}`, sender: 'bot' },
      ]);
  
      const entrevistas = isCandidato
        ? await buscarEntrevistasPorUsuario(userId)
        : await buscarEntrevistasPorRecrutador(userId);
  
      console.log('Entrevistas encontradas:', entrevistas);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Entrevistas encontradas: ${JSON.stringify(entrevistas)}`, sender: 'bot' },
      ]);
  
      // Mensagens sobre a quantidade de entrevistas
      const resultMessages = [
        { text: `Você possui ${entrevistas.aceitas.length} entrevistas aceitas.`, icon: 'check-circle' },
        { text: `Você possui ${entrevistas.pendentes.length} entrevistas pendentes.`, icon: 'clock' },
      ];
  
      setOptions(['1. Entrevistas Marcadas', '2. Quantidade de Solicitações', '3. Tempo Conosco', '4. Suas Configurações']);
      sendMessagesRecursively(resultMessages, 0);
  
      // Exibir detalhes das entrevistas aceitas
      if (entrevistas.aceitas.length > 0) {
        for (const entrevista of entrevistas.aceitas) {
          const detalhes = `Entrevista com ${entrevista.empresa} na data ${entrevista.data} às ${entrevista.hora}.`;
          setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: detalhes, sender: 'bot' },
          ]);
        }
      }
  
      // Exibir detalhes das entrevistas pendentes
      if (entrevistas.pendentes.length > 0) {
        for (const entrevista of entrevistas.pendentes) {
          const detalhes = `Entrevista pendente com ${entrevista.empresa} na data ${entrevista.data} às ${entrevista.hora}.`;
          setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: detalhes, sender: 'bot' },
          ]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar entrevistas:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Desculpe, ocorreu um erro ao buscar as entrevistas.`, sender: 'bot' },
      ]);
    } finally {
      setIsTyping(false);
      console.log('Processo de busca de entrevistas finalizado.');
    }
  };
  
  const mostrarQuantidadeEntrevistas = async (userId) => {
    try {
      console.log(`Contando entrevistas para o usuário: ${userId}`);
      const totalEntrevistas = await contarEntrevistasPorUsuario(userId);
  
      console.log(`Total de entrevistas encontradas: ${totalEntrevistas}`);
  
      // Enviar mensagem com a quantidade total de solicitações
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Você possui um total de ${totalEntrevistas} solicitações.`, sender: 'bot' },
      ]);
      setOptions(['1. Entrevistas Marcadas', '2. Quantidade de Solicitações', '3. Tempo Conosco', '4. Suas Configurações']);
  
    } catch (error) {
      console.error('Erro ao contar entrevistas:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Desculpe, ocorreu um erro ao contar as entrevistas.`, sender: 'bot' },
      ]);
    }
  };
    

  const sendMessagesRecursively = (messages, index) => {
    if (index < messages.length) {
      console.log(`Enviando mensagem: ${messages[index].text}`);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), ...messages[index], sender: 'bot' },
      ]);
      setTimeout(() => sendMessagesRecursively(messages, index + 1),0 ); 
    } else {
      console.log('Todas as mensagens foram enviadas.');
    }
  };
  // Altere a função handleButtonClick para definir as opções
  const handleButtonClick = (response: ResponseType) => {
    setMessages(prevMessages => [
      ...prevMessages,
      { id: Date.now().toString(), text: response.data, sender: 'user' }
    ]);

    if (response.status === 'Sim') {
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: 'Como você gostaria de ser chamado?', sender: 'bot' }
      ]);
      setWaitingForNameChange(false);
      setWaitingForNewName(true);
    } else {
      setWaitingForNameChange(false);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: 'Como posso ajudar você hoje?', sender: 'bot' }
      ]);
    }

    // Defina as opções a serem exibidas
    setOptions(['1. Duvidas do Sistema', '2. Relatar algum Bug', '3. Duvidas sobre sua conta', '4. Mais detalhes sobre as opcoes']); // Customize as opções
  };

  // UseEffect para solicitar o novo nome
  useEffect(() => {
    if (waitingForNewName) {
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: 'Digite como você gostaria de ser chamado', sender: 'bot' }
      ]);
    }
  }, [waitingForNewName]);

  // Função para enviar o novo nome do usuário
  const handleNewUserNameSubmit = () => {
    if (newUserName && newUserName.trim()) {
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: newUserName.trim(), sender: 'user' }
      ]);
      setUserName(newUserName);
      setNewUserName('');
      setWaitingForNewName(false);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Ótimo, agora te chamarei de ${newUserName}! Como posso ajudar você hoje?`, sender: 'bot' }
      ]);
    }
  };

  //============================================ Funcoes que controlam o envio de midia para o bot===============================================
  // Função para selecionar mídia
  const handleSelectMedia = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const type = result.assets[0].type;

        let message = { id: Date.now().toString(), sender: 'user' };

        if (type.startsWith('image')) {
          message = { ...message, imageUri: uri };
        } else if (type.startsWith('video')) {
          message = { ...message, videoUri: uri };
        }

        console.log('Mídia selecionada:', message);
        setMessages(prevMessages => [...prevMessages, message]);
      }
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
    }
  };

  const handlePressMedia = (uri) => {
    console.log('Mídia pressionada:', uri);
    setSelectedMedia(uri);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    console.log('Modal fechado');
    setIsModalVisible(false);
    setSelectedMedia(null);
  };


  // ===================================================================== Reserta o chat ====================================================
  const resetChat = () => {
    setMessages([]);
    setInput('');
    setShowIntro(true);
    setShowAnimation(true);
    setReportingBug(false);
    console.log('Chat resetado');
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={stylesAssistente.container}>
      {showIntro && (
        <View style={stylesAssistente.introContainer}>
          {showAnimation && (
            <Lottie
              source={{ uri: 'https://lottie.host/12b6782f-edfc-4b2c-91ad-fdc9419466b1/MttHHyP7Zv.json' }}
              autoPlay
              loop
              style={stylesAssistente.lottieAnimation}
            />
          )}
          <Text style={stylesAssistente.introText}>Olá! Sou o Assistente do Sias, me chamo  Botly</Text>
          <Text style={stylesAssistente.introText}>Use os botões para ser mais rápido</Text>

        </View>
      )}
      <View style={stylesAssistente.messagesContainer}>
        {messages.length > 0 && (
          <View style={stylesAssistente.headerContainer}>
            <Text style={stylesAssistente.chatIdText}>Chat #{chatbotCount}</Text>
            <TouchableOpacity style={stylesAssistente.resetButtonTop} onPress={resetChat}>
              <Icon name="delete" size={24} color="#FF4D4D" />
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View
              style={[
                stylesAssistente.message,
                item.sender === 'user' ? stylesAssistente.userMessage : stylesAssistente.botMessage,
              ]}
            >
              <View style={stylesAssistente.messageContent}>
                {item.text && <Text>{item.text}</Text>}
              </View>
              {item.imageUri && (
                <TouchableOpacity onPress={() => handlePressMedia(item.imageUri)}>
                  <Image source={{ uri: item.imageUri }} style={stylesAssistente.image} />
                </TouchableOpacity>
              )}
              {item.videoUri && (
                <TouchableOpacity onPress={() => handlePressMedia(item.videoUri)}>
                  <Image source={{ uri: item.videoUri }} style={stylesAssistente.image} />
                </TouchableOpacity>
              )}
            </View>
          )}
          keyExtractor={item => item.id}
          style={stylesAssistente.messages}
        />

        {isTyping && (
          <View style={stylesAssistente.typingIndicator}>
            <Text>Botly está digitando...</Text>
          </View>
        )}


        {/* Botões para mudar o nome */}
        {waitingForNameChange && (
          <View style={stylesAssistente.buttonContainer}>
            <TouchableOpacity
              style={stylesAssistente.responseButton}
              onPress={() => handleButtonClick({ status: 'Sim', data: 'Sim' })}
            >
              <Text style={stylesAssistente.buttonText}>Sim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={stylesAssistente.responseButton}
              onPress={() => handleButtonClick({ status: 'Não', data: 'Não' })}
            >
              <Text style={stylesAssistente.buttonText}>Não</Text>
            </TouchableOpacity>
          </View>
        )}

        {waitingForNewName === false && options.length > 0 && (
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
        )}

        {/* Campo de entrada para novo nome */}
        {waitingForNewName && (
          <View style={stylesAssistente.inputContainer}>
            <TextInput
              style={stylesAssistente.input}
              onChangeText={setNewUserName}
              placeholder="Digite seu novo nome"
            />
            <TouchableOpacity style={stylesAssistente.sendButton} onPress={handleNewUserNameSubmit}>
              <Icon name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {options.length > 0 && (
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
        )}
      </View>

      <InputArea
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        handleSelectMedia={handleSelectMedia}
        reportingBug={reportingBug}
      />

      {selectedMedia && (
        <Modal
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <Pressable style={stylesAssistente.modalBackground} onPress={closeModal}>
            <View style={stylesAssistente.modalContainer}>
              {selectedMedia.endsWith('.mp4') ? (
                <Video
                  source={{ uri: selectedMedia }}
                  useNativeControls
                  resizeMode="contain"
                  style={stylesAssistente.modalVideo}
                  shouldPlay
                />
              ) : (
                <Image source={{ uri: selectedMedia }} style={stylesAssistente.modalImage} />
              )}
              <TouchableOpacity style={stylesAssistente.closeButton} onPress={closeModal}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const InputArea: React.FC<InputAreaProps> = ({
  input,
  setInput,
  sendMessage,
  handleSelectMedia,
  reportingBug,
}) => (
  <View style={stylesAssistente.inputContainer}>
    {reportingBug ? (
      <>
        <TouchableOpacity style={stylesAssistente.attachButton} onPress={handleSelectMedia}>
          <Icon name="attach-file" size={24} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={stylesAssistente.input}
          value={input}
          onChangeText={setInput}
          placeholder="Descreva o bug"
        />
        <TouchableOpacity style={stylesAssistente.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </>
    ) : (
      <>
        <TextInput
          style={stylesAssistente.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua mensagem"
        />
        <TouchableOpacity style={stylesAssistente.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </>
    )}
  </View>
);
