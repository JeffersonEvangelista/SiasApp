import { StatusBar } from "expo-status-bar";
import { View, Text, Linking, Platform, RefreshControl, TouchableOpacity, ScrollView, Modal, FlatList, Animated, PanResponder, Image, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUserNameAndId, supabase, countSolicitacoes } from "../services/userService";
import { styles } from "./Styles/stylesAgenda";
import MapView, { Marker, Polyline } from 'react-native-maps';
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
import axios from 'axios';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';


export default function Agenda() {
  const [isFocused, setIsFocused] = useState(false);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation();
  const [showNoConnection, setShowNoConnection] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
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
      setModalVisible(false);
    });
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
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

      const solicitacoesCount = await countSolicitacoes(userId) || 0;
      AppState.solicitacoesCount = solicitacoesCount;

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  }, []);

  const handleRecruiterProfile = async (recruiterId) => {
    try {
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

      const marked = {};
      const details = [];

      const statuses = ['pendente', 'aceita', 'recusada'];
      const filteredInterviews = Array.isArray(interviewRequests)
        ? interviewRequests.filter(request => statuses.includes(request.status.toLowerCase()))
        : [];

      const today = new Date();

      if (filteredInterviews.length > 0) {
        console.log('Entrevistas encontradas para o recrutador:', filteredInterviews);

        for (const request of filteredInterviews) {
          // Cria a data da entrevista diretamente usando o formato salvo no banco (YYYY-MM-DD)
          const interviewDate = new Date(`${request.data_entrevista}T00:00:00`);

          // Verifica se a entrevista está expirada
          if (interviewDate < today) {
            await handleExpiredInterview(request, request.id_candidato);
            continue;
          }

          const dateString = request.data_entrevista; 
          const dotStyle = getDotStyle(request.status || '');

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
            date: dateString, 
            time: request.horario,
            location: request.local,
            status: request.status || '',
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



  const handleCandidateProfile = async (candidateId) => {
    try {
      const { data: interviewRequests, error } = await supabase
        .from('solicitacoes_entrevista')
        .select(`
          id,
          data_entrevista,
          horario,
          tipo_entrevista,
          local_nome,
          latitude,
          longitude,
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
      const statuses = ['pendente', 'aceita', 'recusada'];
  
      // Filtra entrevistas com status válido
      const filteredInterviews = Array.isArray(interviewRequests)
        ? interviewRequests.filter(request =>
          request.status && statuses.includes((request.status || '').toLowerCase())
        )
        : [];
  
      if (filteredInterviews.length > 0) {
        console.log('Entrevistas encontradas para o recrutador:', filteredInterviews);
  
        for (const request of filteredInterviews) {
          // Criação da data a partir da string usando a data salva no banco (YYYY-MM-DD)
          const interviewDate = new Date(`${request.data_entrevista}T00:00:00`); // Usando 00:00:00 para garantir que a data seja válida
          const dateString = request.data_entrevista; // A data no formato YYYY-MM-DD direto do banco
  
          const dotStyle = getDotStyle(request.status || '');
  
          // Marca as datas com status de entrevista
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
  
          const latitude = parseFloat(request.latitude);
          const longitude = parseFloat(request.longitude);
  
          // Verifica se as coordenadas são válidas antes de gerar a URL
          if (isNaN(latitude) || isNaN(longitude)) {
            console.log("Latitude ou longitude inválidas.");
            continue;
          }
  
          // Gera a URL do mapa
          const mapUrl = await generateMapUrl(latitude, longitude);
  
          // Obtém o recrutador relacionado
          const recruiter = request.vagas.recrutadores || {};
          const firebaseRecruiterId = await getRecruiterIdByEmail(recruiter.email);
  
          // Adiciona os detalhes da entrevista formatados
          details.push({
            id: request.id,
            title: request.vagas.titulo,
            recruiter: recruiter.nome || 'Nome não disponível',
            recruiterEmail: recruiter.email || 'Email não disponível',
            recruiterId: recruiter.id || 'ID não disponível',
            recruiterFirebaseId: firebaseRecruiterId,
            profileImg: recruiter.foto_perfil || 'URL não disponível',
            date: dateString, 
            time: request.horario,
            location: request.local,
            status: request.status || 'Status não disponível',
            latitude: request.latitude || '',
            longitude: request.longitude || '',
            interviewType: request.tipo_entrevista || 'Tipo não especificado',
            locationName: request.local_nome || 'Nome do local não disponível',
            mapUrl: mapUrl || 'URL não disponível',
          });
  
          console.log(
            'Detalhes da Entrevista Formatados:',
            JSON.stringify(details, null, 2)
          );
        }
  
        setInterviewDetails(details);
        setMarkedDates(marked);
      } else {
        console.log('Nenhuma entrevista encontrada para este recrutador.');
      }
  
    } catch (error) {
      console.error('Erro ao buscar solicitações de entrevista:', error);
    } finally {
      setLoading(false);
    }
  };
  

  // Função para obter as coordenadas e gerar a URL
  const generateMapUrl = async (latitude, longitude) => {
    if (isNaN(latitude) || isNaN(longitude)) {
      console.log('As coordenadas fornecidas não são válidas.');
      return '';
    }
    console.log(`Gerando URL para o local com latitude ${latitude} e longitude ${longitude}`);
    const zoom = 17;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.0001},${latitude - 0.0001},${longitude + 0.0001},${latitude + 0.0001}&layer=mapnik&marker=${latitude},${longitude}`;
    console.log(`URL gerada: ${url}`);
    return url;
  };

  const handleNavigateToMap = (latitude, longitude) => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      console.log('Coordenadas inválidas');
      return;
    }
    const destination = `${lat},${lon}`;

    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${destination}&daddr=${destination}`,
      android: `google.navigation:q=${destination}`,
    });

    // Tenta abrir a URL
    Linking.openURL(mapUrl).catch((err) => console.error('Erro ao abrir o mapa:', err));
  };

  // Função para decodificar a polyline
  const decodePolyline = (encoded) => {
    let len = encoded.length;
    let index = 0;
    let lat = 0;
    let lng = 0;
    const path = [];

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dLng;

      path.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }

    return path;
  };

  const getRouteFromOSRM = async (origin, destination) => {
    const url = `http://router.project-osrm.org/route/v1/car/${origin};${destination}?overview=full&geometries=polyline`;

    try {
      const response = await axios.get(url);
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0].geometry;
        const coordinates = decodePolyline(route);
        return coordinates;
      } else {
        console.error('Nenhuma rota encontrada na resposta da API');
        return null;
      }
    } catch (error) {
      console.error('Erro ao obter a rota do OSRM:', error);
      return null;
    }
  };


  // Função para obter a rota do usuário até a entrevista
  useEffect(() => {
    if (userLocation && selectedInterview && selectedInterview.coordinates) {
      const origin = `${userLocation.longitude},${userLocation.latitude}`;
      const destination = `${selectedInterview.coordinates.longitude},${selectedInterview.coordinates.latitude}`;

      const fetchRoute = async () => {
        const coordinates = await getRouteFromOSRM(origin, destination);
        if (coordinates) {
          setRouteCoordinates(coordinates);
        }
      };

      fetchRoute();
    }
  }, [userLocation, selectedInterview]);



  const getRecruiterIdByEmail = async (recruiterEmail) => {
    try {
      console.log(`Buscando ID do recrutador para o email: ${recruiterEmail}`);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", recruiterEmail));
      const querySnapshot = await getDocs(q);
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
    updateInterviewStatus(interview.id, 'aceita');

    try {
      // Chamada ao banco de dados
      const { error: updateError } = await supabase
        .from('solicitacoes_entrevista')
        .update({ status: 'aceita' })
        .eq('id', interview.id);

      if (updateError) {
        console.error('Erro ao atualizar status da entrevista:', updateError);
        updateInterviewStatus(interview.id, 'pendente');
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

      console.log('Resposta existente:', existingResponse);

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
        .select('*, recrutadores(*)')
        .eq('id', interview.id)
        .single();

      if (recruiterError) {
        console.error('Erro ao buscar informações do recrutador:', recruiterError);
        return;
      }

      if (recruiterInfo) {
        console.log('Informações do recrutador:', recruiterInfo.recrutadores);

        // Obter o ID do recrutador
        const recruiterId = recruiterInfo.id_recrutador;
        console.log('ID do recrutador:', recruiterId);

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
        console.log('Token do recrutador:', recrutadorToken);

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
      updateInterviewStatus(interview.id, 'pendente');
    }
  };


  // Função para recusar a entrevista
  const handleRecusar = async (interview, userId) => {
    console.log('Candidate ID:', userId);
    console.log('Entrevista recebida:', interview);

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

      console.log('Resposta existente:', existingResponse);

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
        .select('*, recrutadores(*)')
        .eq('id', interview.id)
        .single();

      if (recruiterError) {
        console.error('Erro ao buscar informações do recrutador:', recruiterError);
        return;
      }

      if (recruiterInfo) {
        console.log('Informações do recrutador:', recruiterInfo.recrutadores);

        // Obter o ID do recrutador
        const recruiterId = recruiterInfo.id_recrutador;
        console.log('ID do recrutador:', recruiterId);

        // 1. Buscar o token do recrutador
        const { data: recrutadorTokenData, error: tokenError } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('user_id', recruiterId)
          .single();

        if (tokenError || !recrutadorTokenData) {
          console.warn('Token do recrutador não encontrado ou erro ao buscar:', tokenError);
          return;
        }

        const recrutadorToken = recrutadorTokenData.token;
        console.log('Token do recrutador:', recrutadorToken);

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
            id_candidato: candidateId,
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
      const recruiterId = interview.id_recrutador;
      console.log('ID do recrutador:', recruiterId);

      // 1. Buscar o token do recrutador
      const { data: recrutadorTokenData, error: tokenError } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', recruiterId)
        .single();

      if (tokenError || !recrutadorTokenData) {
        console.warn('Token do recrutador não encontrado ou erro ao buscar:', tokenError);
        return;
      }

      const recrutadorToken = recrutadorTokenData.token;
      console.log('Token do recrutador:', recrutadorToken);

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



  const openModal = (interview) => {
    setSelectedInterview(interview);
    if (userLocation && interview.coordinates) {
      const distance = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: interview.coordinates.latitude, longitude: interview.coordinates.longitude }
      );
      setDistance(distance);
    }
    setModalVisible(true);
  };

  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };

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
    // Verificando se interview.candidate e searchTerm são válidos
    const matchesSearchTerm = interview.candidate && searchTerm
      ? interview.candidate.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Verificando se interview.status e selectedStatus são válidos
    const matchesStatus = selectedStatus
      ? interview.status?.toLowerCase() === selectedStatus.toLowerCase()
      : true;

    // Verificando se as datas são válidas
    const interviewDate = new Date(interview.date);
    const matchesDate = (!startDate || interviewDate >= new Date(startDate)) &&
      (!endDate || interviewDate <= new Date(endDate));

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
                        ? button.color
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
                  style={[
                    styles.inputName,
                    {
                      color: colorScheme === 'dark' ? '#ffffff' : '#000000',
                      textAlign: 'center'
                    }
                  ]}
                  placeholder="Buscar Candidatos"
                  placeholderTextColor={colorScheme === 'dark' ? '#ffffff' : '#797777FF'}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    searchCandidates(text);
                    if (text.trim() === '') {
                      setSelectedCandidateId(null);
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
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
                      <View
                        style={{
                          padding: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: '#d77906',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        {item.foto_perfil ? (
                          <Image source={{ uri: item.foto_perfil }} style={styles.photo} />
                        ) : (
                          <Image source={require('../../assets/perfil.png')} style={styles.photo} />
                        )}
                        <View style={{ marginLeft: 10 }}>
                          <Text style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}>
                            {item.nome}
                          </Text>
                          <Text style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}>
                            {item.email}
                          </Text>
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
                    todayTextColor: '#1E012E71',
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
                { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' }
              ]}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#ff8c00' }]} />
                  <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Pendente</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#009e23' }]} />
                  <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Aceita</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#a30000' }]} />
                  <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Recusada</Text>
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
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonth}>
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
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
                <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>Nenhuma entrevista pendente.</Text>
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
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonthAceita}>
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
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
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonthRecursada}>
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
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
                style={{ flex: 1, marginTop: '5%' }}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#51047A71',
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
                  <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Pendente</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#009e23' }]} />
                  <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Aceita</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#a30000' }]} />
                  <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Recusada</Text>
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
                                  {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}
                                </Text>
                                <Text style={styles.interviewDateMonth}>
                                  {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.detailsContainer}>
                              <View style={styles.rowContainer}>
                                <Icon name="touch-app" size={24} color="#F07A26" style={styles.icon} />
                                <Text style={styles.interviewTitle}>
                                  {truncateText(item.title, 20)}  {/* Limite de 20 caracteres */}
                                </Text>
                              </View>

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
                              {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </Text>
                            <Text style={styles.interviewDateMonthAceita}>
                              {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.detailsContainer}>
                          <View style={styles.rowContainer}>
                            <Icon name="touch-app" size={24} color="#F07A26" style={styles.icon} />
                            <Text style={styles.interviewTitle}>
                              {truncateText(item.title, 20)}  {/* Limite de 20 caracteres */}
                            </Text>
                          </View>
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
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </Text>
                          <Text style={styles.interviewDateMonthRecursada}>
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
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
                  <View style={{
                    width: '80%',
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
                    borderRadius: 15,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <Image
                      source={selectedInterview.profileImg ? { uri: selectedInterview.profileImg } : require('../../assets/perfil.png')}
                      style={styles.profileImage}
                    />

                    <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Detalhes da Entrevista</Text>

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
                      <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                        Empresa: {selectedInterview.recruiter}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={24} color="#ff8c00" />
                      <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                        Data: {selectedInterview.date ? new Date(selectedInterview.date).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={24} color="#ff8c00" />
                      <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                        Horário: {selectedInterview.time}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#ff8c00" />
                      <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                        Status: {selectedInterview.status || 'Status não disponível'}
                      </Text>
                    </View>
                    {
                      selectedInterview.interviewType === 'presencial' && (
                        <>
                          <View style={styles.infoRow}>
                            <Ionicons name="location" size={24} color="#ff8c00" />
                            <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                              Local: {selectedInterview.locationName || 'Não especificado'}
                            </Text>
                          </View>
                          {/* Botão "Como Chegar" */}
                          <TouchableOpacity
                            style={styles.button}
                            onPress={() => handleNavigateToMap(selectedInterview.latitude, selectedInterview.longitude)}
                          >
                            <Text style={styles.buttonTextMapa}>Como Chegar</Text>
                          </TouchableOpacity>
                          <View style={{ height: 300 }}>
                            {selectedInterview.mapUrl ? (
                              <WebView
                                source={{ uri: selectedInterview.mapUrl }}
                                style={{ flex: 1 }}
                                scrollEnabled={false}
                              />
                            ) : (
                              <Text style={styles.modalText}>Mapa não disponível</Text>
                            )}
                          </View>
                        </>
                      )}

                    {selectedInterview.interviewType === 'online' && (
                      <View style={styles.infoRow}>
                        <Ionicons name="location" size={24} color="#ff8c00" />
                        <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                          Plataforma: {selectedInterview.platform || 'Não especificado'}
                        </Text>
                      </View>
                    )}
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