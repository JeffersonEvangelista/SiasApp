import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Modal, FlatList, Animated, PanResponder, Image, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { ScrollView } from "react-native-gesture-handler";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUserNameAndId, supabase, countSolicitacoes } from "../services/userService";
import { styles } from "./Styles/stylesAgenda";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import AppState from '../components/globalVars';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import LottieView from "lottie-react-native";
import NetInfo from '@react-native-community/netinfo';
import { sendPushNotification } from "../components/Notificacao";
import { TextInput } from "react-native";

import { useColorScheme } from 'nativewind';
import colors from "./Styles/colors";

export default function Agenda() {
  const { colorScheme, toggleColorScheme } = useColorScheme(); // Para o Dark Mode
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation();
  const [showNoConnection, setShowNoConnection] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [showLegend, setShowLegend] = useState(false);
  const [interviewDetails, setInterviewDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState<string | null>(null);
  LocaleConfig.locales['pt'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
  };
  LocaleConfig.defaultLocale = 'pt';
  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setError('Sem conexão com a internet. Verifique sua conexão.');
        setShowNoConnection(true);
      } else {
        setError(null);
        setShowNoConnection(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getUserLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const userLocation = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
      } else {
        console.log('Permissão de localização não concedida');
      }
    };

    getUserLocation();
    fetchProfile();
  }, [userType]);

  useEffect(() => {
    fetchProfile();
  }, [userType]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setModalVisible(false); // Redefine o modal ao voltar para a tela
    });

    // Limpa o listener ao desmontar
    return unsubscribe;
  }, [navigation]);

  // Função que carrega os dados do usuário
  const fetchProfile = useCallback(async () => {
    setLoading(true); // Começa o carregamento
    try {
      const { id: userId } = await getUserNameAndId();
      setUserId(userId);

      const { data: recruiterData } = await supabase
        .from('recrutadores')
        .select('id')
        .eq('id', userId)
        .single();

      if (recruiterData) {
        setUserType('recrutador');
        handleRecruiterProfile(recruiterData.id);
      } else {
        const { data: candidateData } = await supabase
          .from('candidatos')
          .select('id')
          .eq('id', userId)
          .single();

        if (candidateData) {
          setUserType('candidato');
          handleCandidateProfile(candidateData.id);
        }
      }

      // Contar solicitações após determinar o tipo de usuário
      const solicitacoesCount = await countSolicitacoes(userId) || 0;
      AppState.solicitacoesCount = solicitacoesCount;

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  }, []);

  // Função para lidar com o perfil do recrutador e buscar entrevistas relacionadas
  const handleRecruiterProfile = async (recruiterId) => {
    try {
      // Buscar as entrevistas associadas ao recrutador
      const { data: interviewRequests, error } = await supabase
        .from('solicitacoes_entrevista')
        .select(`
      id,
      id_candidato,
      data_entrevista,
      horario,
      local,
      status,
      candidatos (
        id,
        nome,
        email,
        foto_perfil
      ),
      vagas (
        id,
        titulo
      )
    `)
        .eq('id_recrutador', recruiterId);

      console.log('Dados de entrevistas do recrutador:', interviewRequests);

      if (error) {
        throw error;
      }

      // Certificar que interviewRequests é um array antes de acessar o length
      const marked = {};
      const details = [];

      // Filtrar entrevistas por status
      const statuses = ['pendente', 'aceita', 'recusada'];
      const filteredInterviews = Array.isArray(interviewRequests)
        ? interviewRequests.filter(request => statuses.includes(request.status.toLowerCase()))
        : [];

      const today = new Date(); // Data atual

      if (filteredInterviews.length > 0) {
        console.log('Entrevistas encontradas para o recrutador:', filteredInterviews);

        for (const request of filteredInterviews) {
          const interviewDate = new Date(request.data_entrevista);

          // Verifica se a data da entrevista já passou
          if (interviewDate < today) {
            // Chama a função para lidar com entrevistas expiradas
            await handleExpiredInterview(request, request.id_candidato);
            continue; // Continua para a próxima entrevista
          }

          const dateString = request.data_entrevista;
          const dotStyle = getDotStyle(request.status);

          // Adiciona marcação ao calendário
          marked[dateString] = {
            marked: true,
            dotColor: dotStyle.color,
            dotStyle: {
              borderColor: dotStyle.borderColor,
              borderWidth: dotStyle.borderWidth,
              width: dotStyle.width,
              height: dotStyle.height,
            },
            selected: true,
            selectedColor: dotStyle.color,
          };

          // Adiciona detalhes da entrevista ao array
          details.push({
            id: request.id,
            title: request.vagas.titulo,
            candidate: request.candidatos.nome,
            candidateEmail: request.candidatos.email,
            candidateId: request.candidatos.id,
            profileImg: request.candidatos.foto_perfil,
            date: request.data_entrevista,
            time: request.horario,
            location: request.local,
            status: request.status,
          });
          console.log(
            'Detalhes da Entrevista do Recrutador Formatados:',
            JSON.stringify(details, null, 2)
          );
        }

        setInterviewDetails(details);
        setMarkedDates(marked);
      } else {
        console.log('Nenhuma entrevista encontrada para este recrutador.');
      }
    } catch (error) {
      console.error('Erro ao buscar entrevistas do recrutador:', error);
    } finally {
      setLoading(false);
    }
  };


  // Função para lidar com o perfil do candidato e marcar as datas no calendário
  const handleCandidateProfile = async (candidateId) => {
    try {
      // Buscar solicitações de entrevista para o candidato
      const { data: interviewRequests, error } = await supabase
        .from('solicitacoes_entrevista')
        .select(`
        id,
        data_entrevista,
        horario,
        local,
        status,
        vagas (
          id,
          titulo,
          recrutadores (
            id,
            nome,
            email,
            foto_perfil
          )
        )
      `)
        .eq('id_candidato', candidateId);

      console.log('Dados de solicitações de entrevista:', interviewRequests);

      if (error) {
        throw error;
      }

      const marked = {};
      const details = [];

      if (interviewRequests.length > 0) {
        console.log('Solicitações de entrevista encontradas:', interviewRequests);

        const today = new Date();

        for (const request of interviewRequests) {
          const interviewDate = new Date(request.data_entrevista);
          const dateString = request.data_entrevista;
          const dotStyle = getDotStyle(request.status);


          if (request.status.toLowerCase() === 'pendente' && interviewDate < today) {
            handleExpiredInterview(request, candidateId);
          }

          // Adiciona marcação ao calendário
          marked[dateString] = {
            marked: true,
            dotColor: dotStyle.color,
            dotStyle: {
              borderColor: dotStyle.borderColor,
              borderWidth: dotStyle.borderWidth,
              width: dotStyle.width,
              height: dotStyle.height,
            },
            selected: true,
            selectedColor: dotStyle.color,
          };

          // Obter coordenadas do local
          const coordinates = await getCoordinatesFromLocationName(request.local);
          const recruiterEmail = request.vagas.recrutadores.email;

          // Chama a função para obter o ID do recrutador no Firebase
          const firebaseRecruiterId = await getRecruiterIdByEmail(recruiterEmail);
          // Adiciona detalhes da entrevista ao array
          details.push({
            id: request.id,
            title: request.vagas.titulo,
            recruiter: request.vagas.recrutadores.nome,
            recruiterEmail: request.vagas.recrutadores.email,
            recruiterId: request.vagas.recrutadores.id,
            recruiterFirebaseId: firebaseRecruiterId,
            profileImg: request.vagas.recrutadores.foto_perfil,
            date: request.data_entrevista,
            time: request.horario,
            location: request.local,
            status: request.status,
            coordinates: coordinates,
          });
          console.log(
            'Detalhes da Entrevista Formatados:',
            JSON.stringify(details, null, 2)
          );
        }

        setInterviewDetails(details); // Atualiza o estado com os detalhes das entrevistas
        setMarkedDates(marked);
      } else {
        console.log('Nenhuma solicitação de entrevista encontrada para este candidato.');
      }

    } catch (error) {
      console.error('Erro ao buscar solicitações de entrevista:', error);
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };


  const getRecruiterIdByEmail = async (recruiterEmail) => {
    try {
      // Log do email que está sendo buscado
      console.log(`Buscando ID do recrutador para o email: ${recruiterEmail}`);

      // Referência à coleção "recruiters" no Firestore
      const usersRef = collection(db, "users");

      // Criação da query para encontrar um documento com o campo "email" igual ao email fornecido
      const q = query(usersRef, where("email", "==", recruiterEmail));

      // Executa a consulta e obtém os documentos
      const querySnapshot = await getDocs(q);

      // Verifica se encontrou algum documento
      if (!querySnapshot.empty) {
        const recruiterDoc = querySnapshot.docs[0];
        const recruiterId = recruiterDoc.id;

        console.log(`ID do recrutador encontrado no Firebase: ${recruiterId}`);
        return recruiterId;
      } else {
        console.log("Nenhum recrutador encontrado com esse email.");
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar ID do recrutador no Firebase:", error);
      return null;
    }
  };

  // Função para dar animação na questão da entrevista
  const createPanResponderForInterview = useCallback((animatedValue, interview, userId) => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        animatedValue.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          handleAcceptCandidate(interview, userId);
          Animated.spring(animatedValue, {
            toValue: 500,
            useNativeDriver: true,
          }).start(() => {
            animatedValue.setValue(0);
          });
        } else if (gestureState.dx < -120) {
          handleRecusar(interview, userId);
          Animated.spring(animatedValue, {
            toValue: -500,
            useNativeDriver: true,
          }).start(() => {
            animatedValue.setValue(0);
          });
        } else {
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            animatedValue.setValue(0);
          });
        }
      },
    });
  }, []);

  // Função para aceitar a entrevista
  const handleAcceptCandidate = async (interview, userId) => {
    updateInterviewStatus(interview.id, 'aceita'); // Atualiza o estado localmente

    try {
      // Chamada ao banco de dados
      const { error: updateError } = await supabase
        .from('solicitacoes_entrevista')
        .update({ status: 'aceita' })
        .eq('id', interview.id);

      if (updateError) {
        console.error('Erro ao atualizar status da entrevista:', updateError);
        updateInterviewStatus(interview.id, 'pendente'); // Reverte a atualização local
        return;
      }

      console.log('Status da entrevista atualizado para "aceita"');

      // Verificar se já existe uma resposta para a solicitação e candidato
      const { data: existingResponse, error: fetchError } = await supabase
        .from('respostas_candidatos')
        .select('*')
        .eq('id_solicitacao', interview.id)
        .eq('id_candidato', userId);

      if (fetchError) {
        console.error('Erro ao buscar resposta existente:', fetchError);
        return;
      }

      console.log('Resposta existente:', existingResponse); // Log da resposta existente

      // Se não houver resposta existente, insira uma nova
      if (existingResponse.length === 0) {
        const { data, error: insertError } = await supabase
          .from('respostas_candidatos')
          .insert({
            id_solicitacao: interview.id,
            id_candidato: userId,
            resposta: 'aceita',
          });

        if (insertError) {
          console.error('Erro ao inserir resposta do candidato:', insertError);
        } else {
          console.log('Resposta do candidato inserida com sucesso:', data);
          fetchProfile();
        }
      } else {
        console.log('Já existe uma resposta para essa solicitação e candidato.');
      }

      // Buscar informações do recrutador responsável pela solicitação
      const { data: recruiterInfo, error: recruiterError } = await supabase
        .from('solicitacoes_entrevista')
        .select('*, recrutadores(*)') // Seleciona a tabela de recrutadores relacionada
        .eq('id', interview.id)
        .single(); // Usa .single() para obter apenas um registro

      if (recruiterError) {
        console.error('Erro ao buscar informações do recrutador:', recruiterError);
        return;
      }

      if (recruiterInfo) {
        console.log('Informações do recrutador:', recruiterInfo.recrutadores); // Log das informações do recrutador

        // Obter o ID do recrutador
        const recruiterId = recruiterInfo.id_recrutador;
        console.log('ID do recrutador:', recruiterId); // Log do ID do recrutador

        // 1. Buscar o token do recrutador
        const { data: recrutadorTokenData, error: tokenError } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('user_id', recruiterId)
          .single();

        if (tokenError || !recrutadorTokenData) {
          console.warn('Token do recrutador não encontrado ou erro ao buscar:', tokenError);
          return; // Se não houver token, não envia notificação
        }

        const recrutadorToken = recrutadorTokenData.token;
        console.log('Token do recrutador:', recrutadorToken); // Log do token do recrutador

        // 2. Enviar a notificação apenas se o token existir
        if (recrutadorToken) {
          const notificationTitle = 'Boas Notícias!';
          const notificationBody = 'Um candidato aceitou participar do seu processo seletivo. Confira os detalhes em seu aplicativo.';

          // Log antes de enviar a notificação
          console.log('Enviando notificação para o recrutador:', recrutadorToken);

          // Enviar a notificação e esperar pela resposta
          const notificationResponse = await sendPushNotification(recrutadorToken, notificationTitle, notificationBody);

          // Log após o envio
          console.log('Resposta da notificação enviada:', notificationResponse);
        } else {
          console.warn('Recrutador optou por não receber notificações.');
        }
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      updateInterviewStatus(interview.id, 'pendente'); // Reverte a atualização local em caso de erro
    }
  };


  // Função para recusar a entrevista
  const handleRecusar = async (interview, userId) => {
    console.log('Candidate ID:', userId);
    console.log('Entrevista recebida:', interview); // Log dos dados da entrevista

    try {
      console.log(`Candidato recursado:`, interview);

      // Atualizar o status da solicitação de entrevista
      const { error: updateError } = await supabase
        .from('solicitacoes_entrevista')
        .update({ status: 'recusada' })
        .eq('id', interview.id);

      if (updateError) {
        console.error('Erro ao atualizar status da entrevista:', updateError);
        return;
      }

      console.log('Status da entrevista atualizado para "recusada"');

      // Verificar se já existe uma resposta para a solicitação e candidato
      const { data: existingResponse, error: fetchError } = await supabase
        .from('respostas_candidatos')
        .select('*')
        .eq('id_solicitacao', interview.id)
        .eq('id_candidato', userId);

      if (fetchError) {
        console.error('Erro ao buscar resposta existente:', fetchError);
        return;
      }

      console.log('Resposta existente:', existingResponse); // Log da resposta existente

      // Se não houver resposta existente, insira uma nova
      if (existingResponse.length === 0) {
        const { data, error: insertError } = await supabase
          .from('respostas_candidatos')
          .insert({
            id_solicitacao: interview.id,
            id_candidato: userId,
            resposta: 'recusada',
          });

        if (insertError) {
          console.error('Erro ao inserir resposta do candidato:', insertError);
        } else {
          console.log('Resposta do candidato inserida com sucesso:', data);
          fetchProfile();
        }
      } else {
        console.log('Já existe uma resposta para essa solicitação e candidato.');
      }

      // Buscar informações do recrutador responsável pela solicitação
      const { data: recruiterInfo, error: recruiterError } = await supabase
        .from('solicitacoes_entrevista')
        .select('*, recrutadores(*)') // Seleciona a tabela de recrutadores relacionada
        .eq('id', interview.id)
        .single(); // Usa .single() para obter apenas um registro

      if (recruiterError) {
        console.error('Erro ao buscar informações do recrutador:', recruiterError);
        return;
      }

      if (recruiterInfo) {
        console.log('Informações do recrutador:', recruiterInfo.recrutadores); // Log das informações do recrutador

        // Obter o ID do recrutador
        const recruiterId = recruiterInfo.id_recrutador;
        console.log('ID do recrutador:', recruiterId); // Log do ID do recrutador

        // 1. Buscar o token do recrutador
        const { data: recrutadorTokenData, error: tokenError } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('user_id', recruiterId)
          .single();

        if (tokenError || !recrutadorTokenData) {
          console.warn('Token do recrutador não encontrado ou erro ao buscar:', tokenError);
          return; // Se não houver token, não envia notificação
        }

        const recrutadorToken = recrutadorTokenData.token;
        console.log('Token do recrutador:', recrutadorToken); // Log do token do recrutador

        // 2. Enviar a notificação apenas se o token existir
        if (recrutadorToken) {
          const notificationTitle = 'Atualização de Entrevista!';
          const notificationBody = 'Um candidato recusou participar do seu processo seletivo. Confira os detalhes em seu aplicativo';

          // Log antes de enviar a notificação
          console.log('Enviando notificação para o recrutador:', recrutadorToken);

          // Enviar a notificação e esperar pela resposta
          const notificationResponse = await sendPushNotification(recrutadorToken, notificationTitle, notificationBody);

          // Log após o envio
          console.log('Resposta da notificação enviada:', notificationResponse);
        } else {
          console.warn('Recrutador optou por não receber notificações.');
        }
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };
  // Função para lidar com entrevistas pendentes cujo prazo já passou
  const handleExpiredInterview = async (interview, candidateId) => {
    console.log('Entrevista pendente com data já passada:', interview);

    try {
      // Atualizar o status da solicitação de entrevista
      const { error: updateError } = await supabase
        .from('solicitacoes_entrevista')
        .update({ status: 'recusada' })
        .eq('id', interview.id);

      if (updateError) {
        console.error('Erro ao atualizar status da entrevista:', updateError);
        return;
      }

      console.log('Status da entrevista atualizado para "recusada"');

      // Verificar se já existe uma resposta para essa solicitação e candidato
      const { data: existingResponse, error: fetchError } = await supabase
        .from('respostas_candidatos')
        .select('*')
        .eq('id_solicitacao', interview.id)
        .eq('id_candidato', candidateId);

      if (fetchError) {
        console.error('Erro ao buscar resposta existente:', fetchError);
        return;
      }

      // Se não houver resposta existente, insira uma nova
      if (existingResponse.length === 0) {
        const { data, error: insertError } = await supabase
          .from('respostas_candidatos')
          .insert({
            id_solicitacao: interview.id,
            id_candidato: candidateId, // Usa o ID do candidato passado
            resposta: 'recusada',
          });

        if (insertError) {
          console.error('Erro ao inserir resposta do candidato:', insertError);
        } else {
          console.log('Resposta do candidato inserida com sucesso:', data);
        }
      } else {
        console.log('Já existe uma resposta para essa solicitação e candidato.');
      }

      // Obter o ID do recrutador
      const recruiterId = interview.id_recrutador; // Assume que o ID do recrutador está na entrevista
      console.log('ID do recrutador:', recruiterId); // Log do ID do recrutador

      // 1. Buscar o token do recrutador
      const { data: recrutadorTokenData, error: tokenError } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', recruiterId)
        .single();

      if (tokenError || !recrutadorTokenData) {
        console.warn('Token do recrutador não encontrado ou erro ao buscar:', tokenError);
        return; // Se não houver token, não envia notificação
      }

      const recrutadorToken = recrutadorTokenData.token;
      console.log('Token do recrutador:', recrutadorToken); // Log do token do recrutador

      // 2. Enviar a notificação apenas se o token existir
      if (recrutadorToken) {
        const notificationTitle = 'Atualização de Entrevista';
        const notificationBody = 'Um candidato recusou participar do seu processo seletivo devido ao prazo já ter passado. Confira os detalhes em seu aplicativo.';

        // Log antes de enviar a notificação
        console.log('Enviando notificação para o recrutador:', recrutadorToken);

        // Enviar a notificação e esperar pela resposta
        const notificationResponse = await sendPushNotification(recrutadorToken, notificationTitle, notificationBody);

        // Log após o envio
        console.log('Resposta da notificação enviada:', notificationResponse);
      } else {
        console.warn('Recrutador optou por não receber notificações.');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  // Função para obter coordenadas a partir do nome do local
  const getCoordinatesFromLocationName = async (locationName) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'siasapp/1.0',
          'Accept-Language': 'pt-BR',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.length > 0) {
        const coordinates = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };

        // Adicionando console.log para mostrar as coordenadas
        console.log(`Coordenadas para ${locationName}:`, coordinates);

        return coordinates;
      }
    } catch (error) {
      console.error('Erro ao obter as coordenadas:', error);
    }
    return null;
  };


  // Função para determinar a cor e o estilo do ponto com base no status
  const getDotStyle = (status) => {
    switch (status) {
      case 'pendente':
        return { color: '#ff8c00', borderColor: 'black', borderWidth: 1, borderRadius: 5, width: 12, height: 12 };
      case 'aceita':
        return { color: '#009e23', borderColor: 'black', borderWidth: 1, borderRadius: 5, width: 12, height: 12 };
      case 'recusada':
        return { color: '#a30000', borderColor: 'black', borderWidth: 1, borderRadius: 5, width: 12, height: 12 };
      default:
        return { color: 'gray', borderColor: 'black', borderWidth: 1, borderRadius: 5, width: 12, height: 12 };
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    console.log('Atualizando dados...');

    await fetchProfile();
    setRefreshing(false);
  };


  // Função que retorna o componente Calendar
  const renderCalendar = () => {
    return (
      <Calendar
                style={{ flex: 1 }}
                theme={{
                  backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                  calendarBackground: colorScheme === 'dark' ? '#000000' : '#ffffff',
                  textSectionTitleColor: colorScheme === 'dark' ? '#e0e0e0' : '#b6c1cd',
                  selectedDayTextColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                  todayTextColor: colorScheme === 'dark' ? '#f57c00' : '#00adf5', // Laranja no dark mode
                  dayTextColor: colorScheme === 'dark' ? '#ffffff' : '#2d4150',
                  textDisabledColor: colorScheme === 'dark' ? '#555555' : '#d77906',
                  arrowColor: colorScheme === 'dark' ? '#f57c00' : '#d77906', // Setas laranjas no dark mode
                }}
        markedDates={markedDates}
        onDayPress={(day) => {
          console.log('Selected day', day);
        }}
      />
    );
  };

  const openModal = (interview) => {
    setSelectedInterview(interview);
    if (userLocation && interview.coordinates) {
      const distance = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: interview.coordinates.latitude, longitude: interview.coordinates.longitude }
      );
      setDistance(distance); // Distância em metros
    }
    setModalVisible(true);
  };

  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };

  // Função para atualizar o estado local
  const updateInterviewStatus = (interviewId, newStatus) => {
    setInterviewDetails(prevDetails =>
      prevDetails.map(interview =>
        interview.id === interviewId ? { ...interview, status: newStatus } : interview
      )
    );
  };

  const [suggestions, setSuggestions] = useState<Candidate[]>([]);
  const [isSearchEmpty, setIsSearchEmpty] = useState(true);


  // Função para filtrar entrevistas
  const filterInterviews = (interviews) => {
    return interviews.filter(interview => {
      const matchesSearchTerm = searchTerm ?
        interview.candidate.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesStatus = selectedStatus ? interview.status.toLowerCase() === selectedStatus : true;
      const matchesCandidate = selectedCandidateId ? interview.candidateId === selectedCandidateId : true;
      const matchesDate = (!startDate || new Date(interview.date) >= new Date(startDate)) &&
        (!endDate || new Date(interview.date) <= new Date(endDate));

      return matchesSearchTerm && matchesStatus && matchesCandidate && matchesDate;
    });
  };

  // Função para buscar candidatos com base na pesquisa
  const searchCandidates = async (query: any) => {
    try {
      if (!query.trim()) {
        setSuggestions([]);
        setIsSearchEmpty(true);
        return;
      }

      setIsSearchEmpty(false);

      const { data: enrolledCandidates, error: enrollmentError } = await supabase
        .from('inscricoes_vagas')
        .select('id_candidato');

      if (enrollmentError) throw enrollmentError;

      const candidateIds = enrolledCandidates.map((enrollment) => enrollment.id_candidato);

      const { data: candidates, error } = await supabase
        .from('candidatos')
        .select('id, nome, email, foto_perfil')
        .ilike('nome', `%${query}%`)
        .in('id', candidateIds)
        .limit(5);

      if (error) throw error;

      setSuggestions(candidates);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
    }
  };

  useEffect(() => {
    handleRecruiterProfile(userId);
  }, [userId]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const filteredInterviews = interviewDetails.filter((interview: Interview) => {
    const matchesSearchTerm = interview.candidate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus ? interview.status.toLowerCase() === selectedStatus : true;
    const matchesDate = (!startDate || new Date(interview.date) >= new Date(startDate)) &&
      (!endDate || new Date(interview.date) <= new Date(endDate));

    return matchesSearchTerm && matchesStatus && matchesDate;
  });

  const buttons = [
    { title: 'Todas', status: '', color: '#007BFF' },
    { title: 'Pendentes', status: 'pendente', color: '#ff8c00' },
    { title: 'Aceitas', status: 'aceita', color: '#009e23' },
    { title: 'Recusadas', status: 'recusada', color: '#a30000' },
  ];


  // Renderização da Home para ambos os tipos de usuário
  if (userType === 'recrutador') {
    return (
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff' }}>
        {loading ? (
          <ActivityIndicator size="large" color="#ff8c00" />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>Agenda</Text>
            </View>
            <StatusBar backgroundColor="#ff8c00" />

            <View style={{ flex: 1, padding: 20 }}>
              {/* Botões de filtro */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                {buttons.map((button) => (
                  <TouchableOpacity
                    key={button.status}
                    onPress={() => setSelectedStatus(button.status)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 5,
                      backgroundColor: selectedStatus === button.status
                        ? colorScheme === 'dark' ? '#ff8c00' : button.color // Laranja no dark mode
                        : '#E0E0E0',
                      marginHorizontal: 5,
                    }}
                  >
                    <Text style={{ color: selectedStatus === button.status ? '#FFFFFF' : '#000000' }}>
                      {button.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtros */}
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  style={[styles.inputName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}
                  placeholder="Buscar Candidatos"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    searchCandidates(text);
                    if (text.trim() === '') {
                      setSelectedCandidateId(null);
                    }
                  }}
                />

                {/* Lista de sugestões */}
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery(item.nome);
                        setSelectedCandidateId(item.id);
                        setSuggestions([]);
                      }}
                    >
                      <View style={{ padding: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' }}>
                        {item.foto_perfil ? (
                          <Image source={{ uri: item.foto_perfil }} style={styles.photo} />
                        ) : (
                          <Image source={require('../../assets/perfil.png')} style={styles.photo} />
                        )}
                        <View style={{ marginLeft: 10 }}>
                          <Text>{item.nome}</Text>
                          <Text>{item.email}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Componente de calendário */}
              <View style={{
                flex: 1,
                borderRadius: 10,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Calendar
                  style={{ flex: 1 }}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#00adf5',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d77906',
                    arrowColor: '#d77906',
                  }}
                  markedDates={markedDates}
                  hideExtraDays={true}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.toggleButton} onPress={toggleLegend}>
              <Ionicons
                name={showLegend ? 'eye-off' : 'eye'}
                size={20}
                color="white"
              />
              <Text style={styles.toggleButtonText}>
                {showLegend ? ' Ocultar' : ' Legendas'}
              </Text>
            </TouchableOpacity>
            {showLegend && (
              <View style={[
                styles.legendContainer,
                { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' } // Fundo preto no dark mode
              ]}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#ff8c00' }]} />
                  <Text style={[ styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' } ]}>Pendente</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#009e23' }]} />
                  <Text style={[ styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' } ]}>Aceita</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#a30000' }]} />
                  <Text style={[ styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' } ]}>Recusada</Text>
                </View>
              </View>
            )}

            <View style={styles.interviewListContainer}>
              {/* Seção para entrevistas pendentes */}
              {filterInterviews(interviewDetails).filter(interview => interview.status.toLowerCase() === 'pendente').length > 0 ? (
                <FlatList
                  data={filterInterviews(interviewDetails).filter(interview => interview.status.toLowerCase() === 'pendente')}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.interviewItemPedentes}>
                      <View style={styles.dateContainer}>
                        <View style={styles.dateBar} />
                        <View style={styles.dateTextContainer}>
                          <Text style={styles.interviewDateDay}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonth}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailsContainer}>
                        <Text style={styles.interviewTitle}>
                          {truncateText(item.title, 20)} {/* Limite de 20 caracteres */}
                        </Text>
                        <Text style={styles.interviewRecruiter}>
                          Candidato: {truncateText(item.candidate, 20)}
                        </Text>
                        <Text style={styles.interviewLocation}>
                          Local: {truncateText(item.location, 20)}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <Text>Nenhuma entrevista pendente.</Text>
              )}

              {/* Seção para entrevistas aceitas */}
              <Text style={[styles.monthTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Entrevistas Aceitas</Text>
              {filterInterviews(interviewDetails).filter(interview => interview.status.toLowerCase() === 'aceita').length > 0 ? (
                <FlatList
                  data={filterInterviews(interviewDetails).filter(interview => interview.status.toLowerCase() === 'aceita')}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.interviewItem}>
                      <View style={styles.dateContainer}>
                        <View style={styles.dateBarAceita} />
                        <View style={styles.dateTextContainer}>
                          <Text style={styles.interviewDateDayAceita}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonthAceita}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailsContainer}>
                        <Text style={styles.interviewTitleAceita}>
                          {truncateText(item.title, 20)} {/* Limite de 20 caracteres */}
                        </Text>
                        <Text style={styles.interviewRecruiter}>
                          Candidato: {truncateText(item.candidate, 20)}
                        </Text>
                        <Text style={styles.interviewLocation}>
                          Local: {truncateText(item.location, 20)}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>Nenhuma entrevista aceita.</Text>
              )}

              {/* Seção para entrevistas recusadas */}
              <Text style={[styles.monthTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Entrevistas Recusadas</Text>
              {filterInterviews(interviewDetails).filter(interview => interview.status.toLowerCase() === 'recusada').length > 0 ? (
                <FlatList
                  data={filterInterviews(interviewDetails).filter(interview => interview.status.toLowerCase() === 'recusada')}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.interviewItem}>
                      <View style={styles.dateContainer}>
                        <View style={styles.dateBarRecursada} />
                        <View style={styles.dateTextContainer}>
                          <Text style={styles.interviewDateDayRecursada}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonthRecursada}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailsContainer}>
                        <Text style={styles.interviewTitleRecursada}>
                          {truncateText(item.title, 20)} {/* Limite de 20 caracteres */}
                        </Text>
                        <Text style={styles.interviewRecruiter}>
                          Candidato: {truncateText(item.candidate, 20)}
                        </Text>
                        <Text style={styles.interviewLocation}>
                          Local: {truncateText(item.location, 20)}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>Nenhuma entrevista recusada.</Text>
              )}
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
                  onPress={() => {
                    setShowNoConnection(false);

                    fetchProfile(); // Tenta recarregar os dados
                  }}
                >
                  <Text style={styles.buttonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </ScrollView>
        )}
      </View>
    );
  } else {
    return (
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff' }}>
        {loading ? (
          <ActivityIndicator size="large" color="#ff8c00" />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>Agenda</Text>
            </View>
            {/* Necessário arrumar essa questão pois o calendário esta afetando o reload da pagina
          */}
            <View style={{
              flex: 1,
              borderRadius: 10,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
              <Calendar
                  style={{ flex: 1 }}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#00adf5',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d77906',
                    arrowColor: '#d77906',
                  }}
                  markedDates={markedDates}
                  hideExtraDays={true}
                />
            </View>



            <TouchableOpacity style={styles.toggleButton} onPress={toggleLegend}>
              <Ionicons
                name={showLegend ? 'eye-off' : 'eye'}
                size={20}
                color="white"
                style={styles.icon}
              />
              <Text style={styles.toggleButtonText}>
                {showLegend ? ' Ocultar' : ' Legendas'}
              </Text>
            </TouchableOpacity>

            {showLegend && (
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#ff8c00' }]} />
                  <Text style={[ styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' } ]}>Pendente</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#009e23' }]} />
                  <Text style={[ styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' } ]}>Aceita</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#a30000' }]} />
                  <Text style={[ styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' } ]}>Recusada</Text>
                </View>
              </View>
            )}
            <View style={styles.interviewListContainer}>
              {/* Seção para entrevistas pendentes */}
              <Text style={[styles.monthTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Entrevistas a serem confirmadas</Text>
              {interviewDetails.filter(interview => interview.status.toLowerCase() === 'pendente').length > 0 ? (
                <FlatList
                  data={interviewDetails.filter(interview => interview.status.toLowerCase() === 'pendente')}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => {
                    const animatedValue = new Animated.Value(0);
                    // Passando o userId para a função panResponder
                    const panResponder = createPanResponderForInterview(animatedValue, item, userId);

                    const backgroundColor = animatedValue.interpolate({
                      inputRange: [-500, 0, 500],
                      outputRange: ['lightcoral', '#ffffff', 'lightgreen'],
                      extrapolate: 'clamp',
                    });

                    return (
                      <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX: animatedValue }] }}>
                        <TouchableOpacity onPress={() => openModal(item)}>
                          <Animated.View style={[styles.interviewItemPedentes, { backgroundColor }]}>
                            <View style={styles.dateContainer}>
                              <View style={styles.dateBar} />
                              <View style={styles.dateTextContainer}>
                                <Text style={styles.interviewDateDay}>
                                  {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                                </Text>
                                <Text style={styles.interviewDateMonth}>
                                  {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.detailsContainer}>
                              <Text style={styles.interviewTitle}>
                                {truncateText(item.title, 20)}  {/* Limite de 20 caracteres */}
                              </Text>
                              <Text style={styles.interviewRecruiter}>
                                Empresa: {truncateText(item.recruiter, 20)}
                              </Text>
                              <Text style={styles.interviewLocation}>
                                Local: {truncateText(item.location, 20)}
                              </Text>
                            </View>
                          </Animated.View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }}
                />
              ) : (
                <Text style={[styles.noInterviewsMessage, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Nenhuma entrevista pendente.</Text>
              )}
              {/* Seção para entrevistas aceitas */}
              <Text style={[styles.monthTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Entrevistas aceitas</Text>
              {interviewDetails.filter(interview => interview.status.toLowerCase() === 'aceita').length > 0 ? (
                <FlatList
                  data={interviewDetails.filter(interview => interview.status.toLowerCase() === 'aceita')}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openModal(item)}>

                      <View style={styles.interviewItem}>
                        <View style={styles.dateContainer}>
                          <View style={styles.dateBarAceita} />
                          <View style={styles.dateTextAceita}>
                            <Text style={styles.interviewDateDayAceita}>
                              {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </Text>
                            <Text style={styles.interviewDateMonthAceita}>
                              {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.interviewTitleAceita}>
                            {truncateText(item.title, 20)}  {/* Limite de 20 caracteres */}
                          </Text>
                          <Text style={styles.interviewRecruiter}>
                            Empresa: {truncateText(item.recruiter, 20)}
                          </Text>
                          <Text style={styles.interviewLocation}>
                            Local: {truncateText(item.location, 20)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={[styles.noInterviewsMessage, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Nenhuma entrevista aceita.</Text>
              )}

              {/* Seção para entrevistas recusadas */}
              <Text style={[styles.monthTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Entrevistas recusadas</Text>
              {interviewDetails.filter(interview => interview.status.toLowerCase() === 'recusada').length > 0 ? (
                <FlatList
                  data={interviewDetails.filter(interview => interview.status.toLowerCase() === 'recusada')}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.interviewItem}>
                      <View style={styles.dateContainer}>
                        <View style={styles.dateBarRecursada} />
                        <View style={styles.dateTextContainer}>
                          <Text style={styles.interviewDateDayRecursada}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonthRecursada}>
                            {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailsContainer}>
                        <Text style={styles.interviewTitleRecursada}>
                          {truncateText(item.title, 20)}  {/* Limite de 20 caracteres */}
                        </Text>
                        <Text style={styles.interviewRecruiter}>
                          Empresa: {truncateText(item.recruiter, 20)}
                        </Text>
                        <Text style={styles.interviewLocation}>
                          Local: {truncateText(item.location, 20)}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <Text style={[styles.noInterviewsMessage, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Nenhuma entrevista recusada.</Text>
              )}
            </View>


            {selectedInterview && (
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalView}>
                    <Image
                      source={selectedInterview.profileImg ? { uri: selectedInterview.profileImg } : require('../../assets/perfil.png')}
                      style={styles.profileImage}
                    />

                    <Text style={styles.modalTitle}>Detalhes da Entrevista</Text>

                    <TouchableOpacity
                      style={styles.buttonContact}
                      onPress={() => {
                        navigation.navigate('chatRoom', {
                          item: {
                            userId: selectedInterview.recruiterFirebaseId,
                            username: selectedInterview.recruiter,
                            profileImg: selectedInterview.profileImg
                          }
                        });
                      }}
                    >
                      <View style={styles.buttonContent}>
                        <Ionicons name="chatbubble-outline" size={20} color="#ff8c00" />
                        <Text style={styles.buttonText}>Conversar com RH</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.infoRow}>
                      <Ionicons name="briefcase-outline" size={24} color="#ff8c00" />
                      <Text style={styles.modalText}>Empresa: {selectedInterview.recruiter}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={24} color="#ff8c00" />
                      <Text style={styles.modalText}>Data: {new Date(selectedInterview.date).toLocaleDateString('pt-BR')}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={24} color="#ff8c00" />
                      <Text style={styles.modalText}>Horário: {selectedInterview.time}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#ff8c00" />
                      <Text style={styles.modalText}>Status: {selectedInterview.status}</Text>
                    </View>

                    {selectedInterview.coordinates ? (
                      <MapView
                        style={styles.map}
                        initialRegion={{
                          latitude: selectedInterview.coordinates.latitude,
                          longitude: selectedInterview.coordinates.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: selectedInterview.coordinates.latitude,
                            longitude: selectedInterview.coordinates.longitude,
                          }}
                          title={selectedInterview.recruiter} // Nome da empresa
                          description={`Entrevista: ${selectedInterview.title}\nDescrição: ${selectedInterview.description || 'Sem descrição disponível.'}`} // Descrição adicional
                        />
                      </MapView>
                    ) : (
                      <Text style={styles.modalText}>Localização não disponível.</Text>
                    )}

                    <Text style={styles.distanceText}>
                      Distância da vaga: {distance !== undefined ? (distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance / 1000).toFixed(2)} km`) : 'Indisponível'}
                    </Text>

                    <TouchableOpacity
                      style={styles.buttonClose}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.buttonTextclosd}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
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
                  onPress={() => {
                    setShowNoConnection(false);
                    // Você pode adicionar lógica aqui para tentar recarregar os dados
                    fetchProfile(); // Tenta recarregar os dados
                  }}
                >
                  <Text style={styles.buttonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </ScrollView>
        )}
      </View>
    );
  }
}