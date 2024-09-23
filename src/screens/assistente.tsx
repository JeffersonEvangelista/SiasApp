import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Modal, Platform, Pressable, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Lottie from 'lottie-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { getCurrentUserEmail } from '../services/Firebase';
import InputArea from '../components/InputArea';
import { stylesAssistente } from './Styles/styles';
import { getUserName, countChatbotInteractionsForUser, fetchCandidatoByEmail, buscarDataCriacaoUsuario, fetchRecrutadorByEmail, contarEntrevistasPorUsuario, buscarEntrevistasPorUsuario, buscarEntrevistasPorRecrutador, processAndSaveBugReport } from '../services/userService';

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- Definindo o tipo da mensagem e outras respostas =-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
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
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==--=-=-=-=-=-=-=-=-=-=-==-=--=-=-=-=-==--=-=-=-=-=-=-=-=-=

export default function Assistente() {
  const [email, setEmail] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showAnimation, setShowAnimation] = useState<boolean>(true);
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
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [hasAskedForNameChange, setHasAskedForNameChange] = useState(false);
  const [complemento, setComplemento] = useState<string>('');
  const [bugImage, setBugImage] = useState(null);
  const [input, setInput] = useState('');
  const [reportingBug, setReportingBug] = useState(false);
  const [bugReport, setBugReport] = useState({ description: '', image: null });
  const [messageCount, setMessageCount] = useState(0);
  const [bugMedia, setBugMedia] = useState<string | null>(null);
  const [userType, setUserType] = useState(''); // Adicione esta linha

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--= Buscas automatizadas referente  a informacoes do usuario =-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Solicitar permissões da galeria
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissões para acessar sua galeria.');
            return; // Se não houver permissão, interrompa a execução
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
            setUserType('candidato'); // Define o tipo de usuário como 'candidato'
            console.log(`Candidato encontrado: ${candidato.nome}`);
          } else {
            const recrutador = await fetchRecrutadorByEmail(email);
            if (recrutador) {
              setUserId(recrutador.id);
              setIsCandidato(false);
              setUserType('recrutador'); // Define o tipo de usuário como 'recrutador'

              console.log(`Recrutador encontrado: ${recrutador.nome}`);
            } else {
              throw new Error('Usuário não encontrado em nenhuma das tabelas');
            }
          }
        }

        // Após obter o ID do usuário, buscar contagem de interações do chatbot
        if (userId && isCandidato !== null) {
          const count = await countChatbotInteractionsForUser(userId, isCandidato);
          setChatbotCount(count > 0 ? count : 1);
          console.log(`Quantidade de interações de chatbot: ${count}`);
        }

      } catch (error) {
        console.error('Erro durante a inicialização da aplicação:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [userId, isCandidato]);
  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==--=-=-=-=-=-=-=-=-=-=-==-=--=-=-=-=-==--=-=-=-=-=-=-=-=-=


  // ================================================================== Logiccas do chatbot, nao mexer nessa parte pois vai dar ruim ======================================== 
  const sendBugReport = (description: string) => {
    console.log('Descrição recebida:', description);
    console.log('Imagem recebida:', setBugImage);

    // Atualiza a descrição
    if (description.trim()) {
      setBugReport(prev => ({ ...prev, description }));
      const userMessageId = `user-${Date.now()}-${messageCount}`;
      setMessages(prevMessages => [
        ...prevMessages,
        { id: userMessageId, text: description, sender: 'user' },
      ]);
      setMessageCount(prev => prev + 1);
    }
    bugImage == setBugImage
    // Atualiza a imagem
    if (bugImage) {
      setBugReport(prev => ({ ...prev, image: bugImage }));
      const botImageMessageId = `bot-${Date.now()}-${messageCount}`;
      setMessages(prevMessages => [
        ...prevMessages,
        { id: botImageMessageId, text: 'Recebemos a imagem. Agora, por favor, descreva o erro que ocorreu.', sender: 'bot' },
      ]);
      setMessageCount(prev => prev + 1);
    }

    // Chame a função para salvar o bug no banco de dados apenas quando ambas as informações estiverem disponíveis
    if (description.trim() && bugImage) {
      console.log('Enviando bug com descrição e imagem:', description, bugImage);
      Salvamentodebug(userId, userType, description, bugImage); // Envia a imagem armazenada no estado
      setBugReport({ description: '', image: null });
    } else if (description.trim() && !bugImage) {
      const botMessageId = `bot-${Date.now()}-${messageCount}`;
      setMessages(prevMessages => [
        ...prevMessages,
        { id: botMessageId, text: 'Agora, por favor, envie uma imagem.', sender: 'bot' },
      ]);
    } else if (!description.trim() && bugImage) {
      const botMessageId = `bot-${Date.now()}-${messageCount}`;
      setMessages(prevMessages => [
        ...prevMessages,
        { id: botMessageId, text: 'Por favor, descreva o erro que ocorreu.', sender: 'bot' },
      ]);
    }
  };

  const Salvamentodebug = async (userId, userType, description, image) => {
    const explanations = [
      { text: `Obrigado por relatar o que aconteceu` },
      { text: `Iremos arrumar esses erros o mais rápido possível....` },
      { text: `Espere um pouco enquanto salvamos essas informações no banco de dados.` },
    ];

    setIsTyping(true);

    const sendMessageRecursively = async (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 2000);
      } else {
        const success = await processAndSaveBugReport(userId, userType, description, image);
        setIsTyping(false);
        if (success) {
          setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: 'Seu relatório foi salvo com sucesso!', sender: 'bot' },
          ]);
        } else {
          setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: 'Ocorreu um erro ao salvar seu relatório. Tente novamente.', sender: 'bot' },
          ]);
        }
      }
    };

    sendMessageRecursively(0); // Inicia o envio das mensagens
  };


  // Função para enviar mensagens
  const sendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, userMessage];
        console.log('Última mensagem enviada:', userMessage);
        return updatedMessages;
      });

      setIsTyping(true);

      setTimeout(() => {
        const botResponses = generateResponse();
        botResponses.forEach((response, index) => {
          setTimeout(() => {
            const botMessage: Message = {
              id: (Date.now() + index + 1).toString(),
              text: response,
              sender: 'bot',
            };

            setMessages(prevMessages => {
              const updatedMessages = [...prevMessages, botMessage];
              console.log('Última mensagem do bot enviada:', botMessage);
              return updatedMessages;
            });
          }, index * 100);
        });

        setIsTyping(false);
      }, 500);

      setInput('');
      setShowIntro(false);
      setReportingBug(false);
    }
  };

  // Função para gerar respostas do bot
  const generateResponse = () => {
    const currentHour = new Date().getHours();
    let responses = [];

    if (!hasAskedForNameChange) {
      if (currentHour < 5) {
        responses.push(`Boa madrugada, ${userName}!`);
      } else if (currentHour < 12) {
        responses.push(`Bom dia, ${userName}!`);
      } else if (currentHour < 18) {
        responses.push(`Boa tarde, ${userName}!`);
      } else {
        responses.push(`Boa noite, ${userName}!`);
      }

      responses.push(`Gostaria que eu te chamasse de outra forma?`);
      setWaitingForNameChange(true);
      setHasAskedForNameChange(true);
    } else {
      responses.push(`Se precisar de algo, aqui estão as opções:`);
      setOptions(['1. Dúvidas do Sistema', '2. Relatar algum Bug', '3. Dúvidas sobre sua conta', '4. Mais detalhes sobre as opções']);
    }
    console.log('Respostas geradas:', responses);
    return responses;
  };

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
        console.log('Lógica para a Dúvida do Sistema');
        DuvidasdoSistema(userName);
        break;
      case '2. Relatar algum Bug':
        console.log('Lógica para Relatar Bug');
        relatosdeBugs();
        break;
      case '3. Dúvidas sobre sua conta':
        console.log('Lógica para Dúvidas sobre Conta');
        Duvidasdaconta();
        break;
      case '4. Mais detalhes sobre as opções':
        console.log('Chamando explicação das opções');
        explicacaodasopcoes();
        break;

      // Dúvidas da conta
      case '1. Entrevistas Marcadas':
        console.log('Entrevistas selecionadas');
        EntrevistasMarcadas(userId, userName);
        break;
      case '2. Quantidade de Solicitações':
        console.log('Chamando explicação das opções');
        mostrarQuantidadeEntrevistas(userId, userName);
        break;
      case '3. Tempo Conosco':
        console.log('Chamando explicação das opções');
        TempoConosco(userId, userName);
        break;

      // Duvida do sistema
      case '1. Criadores do Sistema':
        console.log('Chamando explicação das opções');
        Criadores(userId, userName);
        break;
      case '2. Propósito':
        console.log('Chamando explicação das opções');
        Proposito(userId, userName);
        break;
      case '3. Funcionalidades':
        console.log('Chamando explicação das opções');
        Funcionalidades(userId, userName);
        break;

      // Relatos de bugs
      case '1. Home':
        console.log('Chamando explicação das opções');
        setComplemento('Home');
        RelatosBug(userId, userName, 'Home');
        break;
      case '2. Agenda':
        console.log('Chamando explicação das opções');
        setComplemento('Agenda');
        RelatosBug(userId, userName, 'Agenda');
        break;
      case '3. Nessa tela (BOT)':
        console.log('Chamando explicação das opções');
        setComplemento('Nessa tela (BOT)');
        RelatosBug(userId, userName, 'Nessa tela (BOT)');
        break;
      case '4. Chat':
        console.log('Chamando explicação das opções');
        setComplemento('Chat');
        RelatosBug(userId, userName, 'Chat');
        break;
      case '5. Configurações':
        console.log('Chamando explicação das opções');
        setComplemento('Configurações');
        RelatosBug(userId, userName, 'Configurações');
        break;
      default:
        console.log('Opção não reconhecida');
        break;
    }

    // Limpar opções imediatamente após a seleção
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
        setOptions(['1. Entrevistas Marcadas', '2. Quantidade de Solicitações', '3. Tempo Conosco']);
      }
    };
    sendMessageRecursively(0);
  };
  const relatosdeBugs = () => {
    const explanations = [
      { text: `😢 Lamentamos muito que você tenha encontrado um bug!` },
      { text: `Saiba que estamos comprometidos em resolver isso o mais rápido possível.` },
      { text: `Para nos ajudar, por favor, informe em qual tela você encontrou o bug:` },
    ];

    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 500);
      } else {
        setIsTyping(false);
        setOptions(['1. Home', '2. Agenda', '3. Nessa tela (BOT)', '4. Chat', '5. Configurações']);
      }
    };

    sendMessageRecursively(0);
  };

  const DuvidasdoSistema = (userName: string) => {
    const explanations = [
      { text: `Estou feliz que você, ${userName}, queira saber mais sobre mim!` },
      { text: `Posso compartilhar quatro curiosidades principais sobre o sistema:` },
      { text: `1. Criadores do Sistema: Vou contar sobre as pessoas que me desenvolveram.` },
      { text: `2. Propósito: Vou explicar por que eles decidiram me criar.` },
      { text: `3. Funcionalidades: Falo sobre tudo o que posso fazer para te ajudar.` },
      { text: `Qual dessas opções você gostaria de explorar primeiro?` },
    ];

    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 500);
      } else {
        setIsTyping(false);
        setOptions(['1. Criadores do Sistema', '2. Propósito', '3. Funcionalidades']);
      }
    };

    sendMessageRecursively(0);
  };


  const EntrevistasMarcadas = async (userId: string, userName: string) => {
    setIsTyping(true);

    const explanations = [
      { text: `Claro, vamos verificar as entrevistas!` },
      { text: `Um momento, por favor...` },
      { text: `Estou conferindo suas entrevistas...` },
    ];

    sendMessagesRecursively(explanations, 0);

    try {
      console.log(`Buscando entrevistas para o usuário: ${userName}`);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Buscando entrevistas para o usuário: ${userName}`, sender: 'bot' },
      ]);

      const entrevistas = isCandidato
        ? await buscarEntrevistasPorUsuario(userId)
        : await buscarEntrevistasPorRecrutador(userId);

      console.log('Entrevistas encontradas:', entrevistas);

      // Mensagem sobre a quantidade de entrevistas
      const resultMessages = [
        { text: `Você tem ${entrevistas.aceitas.length} entrevistas aceitas ✅.`, icon: 'check-circle' },
        { text: `Você tem ${entrevistas.pendentes.length} entrevistas pendentes ⏳.`, icon: 'clock' },
      ];

      setOptions(['1. Entrevistas Marcadas', '2. Quantidade de Solicitações', '3. Tempo Conosco']);
      sendMessagesRecursively(resultMessages, 0);

      // Exibir detalhes das entrevistas aceitas
      if (entrevistas.aceitas.length > 0) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: `Aqui estão os detalhes das suas entrevistas aceitas:`, sender: 'bot' },
        ]);
        for (const entrevista of entrevistas.aceitas) {
          const detalhes = `✅ Entrevista com ${entrevista.empresa} na data ${entrevista.data} às ${entrevista.hora}, local: ${entrevista.local}.`;
          setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: detalhes, sender: 'bot' },
          ]);
        }
      }

      // Exibir detalhes das entrevistas pendentes
      if (entrevistas.pendentes.length > 0) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: `Aqui estão os detalhes das suas entrevistas pendentes:`, sender: 'bot' },
        ]);
        for (const entrevista of entrevistas.pendentes) {
          const detalhes = `⏳ Entrevista pendente com **${entrevista.empresa}** na data **${entrevista.data_entrevista}** às **${entrevista.horario}**, local: **${entrevista.local}**.`;
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

  const mostrarQuantidadeEntrevistas = async (userId: string, userName: string) => {
    try {
      console.log(`Contando entrevistas para o usuário: ${userName}`);
      const totalEntrevistas = await contarEntrevistasPorUsuario(userId);

      console.log(`Total de entrevistas encontradas: ${totalEntrevistas}`);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `Contando o numero de entrevistas para o usuário: ${userName}`, sender: 'bot' },
      ]);
      // Enviar mensagem com a quantidade total de solicitações
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          text: `📋 Você possui um total de ${totalEntrevistas} solicitações de entrevista.`,
          sender: 'bot'
        },
      ]);

      // Oferecendo as opções com uma mensagem amigável
      setOptions([
        '1️⃣ Entrevistas Marcadas',
        '2️⃣ Quantidade de Solicitações',
        '3️⃣ Tempo Conosco',
        '4️⃣ Suas Configurações'
      ]);

    } catch (error) {
      console.error('Erro ao contar entrevistas:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          text: `⚠️ Desculpe, ocorreu um erro ao contar as entrevistas. Tente novamente mais tarde.`,
          sender: 'bot'
        },
      ]);
    }
  };

  const TempoConosco = async (userId: string, userName: string) => {
    try {
      console.log(`Calculando tempo no sistema para o usuário: ${userName}`);

      // Chama a função que busca a data de criação
      const dataCriacao = await buscarDataCriacaoUsuario(userId, userName);

      if (!dataCriacao) {
        throw new Error('Data de criação não encontrada');
      }

      const dataAtual = new Date();
      const dataInicio = new Date(dataCriacao);

      // Cálculo de anos, meses e dias
      const anos = dataAtual.getFullYear() - dataInicio.getFullYear();
      const meses = dataAtual.getMonth() - dataInicio.getMonth();
      const dias = dataAtual.getDate() - dataInicio.getDate();

      const mesesAjustados = meses < 0 ? meses + 12 : meses;
      const diasAjustados = dias < 0 ? dias + new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 0).getDate() : dias;

      // Mensagem formatada
      let mensagemTempo = `Uau 🤯 Você está conosco há `;
      if (anos > 0) mensagemTempo += `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
      if (mesesAjustados > 0) mensagemTempo += `, ${mesesAjustados} ${mesesAjustados === 1 ? 'mês' : 'meses'}`;
      if (diasAjustados > 0) mensagemTempo += ` e ${diasAjustados} ${diasAjustados === 1 ? 'dia' : 'dias'}`;
      mensagemTempo += '.';

      // Enviar mensagem ao usuário
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: mensagemTempo, sender: 'bot' },
      ]);

      // Mensagem para mostrar as opções após o tempo
      setOptions(['1. Dúvidas do Sistema', '2. Relatar algum Bug', '3. Dúvidas sobre sua conta', '4. Mais detalhes sobre as opções']);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: 'Aqui estão suas opções:', sender: 'bot' },
      ]);

    } catch (error) {
      console.error('Erro ao calcular o tempo no sistema:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), text: `⚠️ Desculpe, ocorreu um erro ao calcular o tempo no sistema.`, sender: 'bot' },
      ]);
    }
  };
  const Criadores = (userId: string, userName: string) => {
    const explanations = [
      { text: `Claro, ficarei feliz em falar dos meus criadores!` },
      { text: `👤 DAVI DE BRITO JUNIOR: LÍDER -   DESENVOLVEDOR FULL` },
      { text: `GitHub: https://github.com/DaveBrito` },
      { text: `👤 ERIC PENERES CARNEIRO: DESENVOLVEDOR FULL` },
      { text: `GitHub:https://github.com/EricW900` },
      { text: `👤 JEFFERSON MOREIRA EVANGELISTA: DESENVOLVEDOR FULL` },
      { text: `GitHub: https://github.com/JeffersonEvangelista` },
      { text: `👤 PEDRO BORGES DE JESUS: DESENVOLVEDOR FULL` },
      { text: `GitHub: https://github.com/B0rga` },
      { text: `👤 Wesley Silva dos Santos :LÍDER -   DESENVOLVEDOR FULL` },
      { text: `GitHub: https://github.com/WesleyS08` },
    ];
    // Ativar o indicador de digitação
    setIsTyping(true);
    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 0);
      } else {
        setIsTyping(false);
        setOptions(['1. Criadores do Sistema', '2. Propósito', '3. Funcionalidades']);
      }
    };
    sendMessageRecursively(0);
  };
  const Proposito = (userId: string, userName: string) => {
    const explanations = [
      { text: `Estou feliz em compartilhar o propósito do SIAS App!` },
      { text: `💡 O SIAS é projetado para otimizar a gestão de entrevistas no setor de Recursos Humanos.` },
      { text: `📋 **Objetivo Principal:** Facilitar a comunicação e o agendamento de entrevistas.` },
      { text: `👥 **Para o RH:**` },
      { text: `- Envio de Solicitações: O RH pode enviar solicitações detalhadas para candidatos qualificados.` },
      { text: `- Detalhes das Solicitações: Inclui data, horário e local da entrevista.` },
      { text: `🎓 **Para os Candidatos:**` },
      { text: `- Gerenciamento de Solicitações: Visualização e gerenciamento das solicitações recebidas.` },
      { text: `- Respostas: Aceitar ou recusar solicitações.` },
      { text: `✅ **Benefícios:**` },
      { text: `- Facilita o agendamento de entrevistas e melhora a comunicação.` },
      { text: `Se tiver mais perguntas, estou aqui para ajudar! 😊` },
    ];
    // Ativar o indicador de digitação
    setIsTyping(true);
    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 0);
      } else {
        setIsTyping(false);
        setOptions(['1. Criadores do Sistema', '2. Propósito', '3. Funcionalidades']);
      }
    };
    sendMessageRecursively(0);
  };
  const Funcionalidades = (userId: string, userName: string) => {
    const explanations = [
      { text: `Aqui estão as principais funcionalidades do SIAS App!` },
      { text: `📋 **Funcionalidades para o RH:**` },
      { text: `- **Envio de Solicitações:** Permite ao RH enviar solicitações detalhadas para candidatos qualificados.` },
      { text: `- **Detalhes das Solicitações:** Inclui informações como data, horário e local da entrevista.` },
      { text: `🎓 **Funcionalidades para os Candidatos:**` },
      { text: `- **Gerenciamento de Solicitações:** Acesso à aba de gerenciamento para visualizar e gerenciar solicitações recebidas.` },
      { text: `- **Respostas:** Possibilidade de aceitar ou recusar as solicitações recebidas de uma determinada empresa.` },
      { text: `✅ **Benefícios:**` },
      { text: `- Facilita o processo de agendamento de entrevistas e melhora a comunicação entre RH e candidatos.` },
      { text: `Se precisar de mais informações, estou aqui para ajudar! 😊` },
    ];

    // Ativar o indicador de digitação
    setIsTyping(true);
    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 0);
      } else {
        setIsTyping(false);
        setOptions(['1. Criadores do Sistema', '2. Propósito', '3. Funcionalidades']);
      }
    };
    sendMessageRecursively(0);
  };

  const RelatosBug = (userId: string, userName: string, complemento: string) => {
    const explanations = [
      { text: `Desculpe por qualquer inconveniente` },
      { text: `Você pode falar sobre o bug da tela: ${complemento}.` },
      { text: `Selecione uma foto ou vídeo que mostra o bug:` },
    ];

    // Ativar o indicador de digitação
    setIsTyping(true);

    const sendMessageRecursively = (index) => {
      if (index < explanations.length) {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
        ]);
        setTimeout(() => sendMessageRecursively(index + 1), 500);
      } else {
        setIsTyping(false);
        // Habilitar modo de relatório de bug
        setReportingBug(true);

      }
    };

    sendMessageRecursively(0);
  };

  const sendMessagesRecursively = (messages, index) => {
    if (index < messages.length) {
      console.log(`Enviando mensagem: ${messages[index].text}`);
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString(), ...messages[index], sender: 'bot' },
      ]);
      setTimeout(() => sendMessagesRecursively(messages, index + 1), 0);
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

        setBugImage(uri); // Armazena a mídia no estado `bugImage`

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
            <Text style={stylesAssistente.chatIdText}>Chat #{chatbotCount + 1}</Text>
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
        sendBugReport={sendBugReport} // Passa a função como prop

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
