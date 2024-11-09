// Importações do codigo
import React, { useEffect, useState, useRef } from 'react';
import { View, Alert, Animated, RefreshControl, Text, StatusBar, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Dimensions, PanResponder } from 'react-native';
import { getUserNameAndId, supabase, getJobInscriptions, countSolicitacoes } from '../services/userService';
import * as Animatable from 'react-native-animatable';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import LottieView from 'lottie-react-native';
import MapView, { UrlTile } from 'react-native-maps';
import { styles } from './Styles/stylesHome';
import AppState from '../components/globalVars';
import { getUserIdByEmailFirestore } from '../services/Firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { sendPushNotification } from '../components/Notificacao';
import { AbstractChartConfig } from 'react-native-chart-kit/dist/AbstractChart';
import { useColorScheme } from 'nativewind';
import PulsingDots from '../components/PulsingDots';
import { WebView } from 'react-native-webview';

interface Candidate {
  candidatos: any;
  id: string;
  nome: string;
  email: string;
  foto_perfil?: string;
  status: 'aceita' | 'recusada' | 'pendente';
  vagas: {
    id: string;
    nome: string;
  };
}
interface LocationSuggestion {
  display_name: string;
}
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean;
  }[];
}
interface InterviewCounts {
  days?: Record<string, number>;
  months?: Record<string, number>;
}
interface ExpandedJobs {
  [jobId: string]: boolean;
}
interface LineChartProps {
  chartConfig: AbstractChartConfig;
}
interface Inscricao {
  id_candidato: string;
}
interface Job {
  titulo: string;
  id: string;
  inscricoes_vagas: Inscricao[];
}
interface JobOffer {
  id: string;
  titulo: string;
  inscricoes_vagas: InscricaoVaga[];
}
interface InscricaoVaga {
  id_candidato: string;
  candidatos: any;
}
interface Props {
  jobOffersWithCandidates: Job[];
}
interface CustomChartConfig extends AbstractChartConfig {
  withVerticalLines?: boolean;
}
interface CustomError {
  message: string;
}

const App = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { colorScheme, toggleColorScheme } = useColorScheme(); // Para o Dark Mode
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [userData, setUserData] = useState<{ nome: string; cnpj: null }>({ nome: '', cnpj: null });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CustomError | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<ExpandedJobs>({});
  const [toggleExpandInfo, settoggleExpandInfo] = useState<ExpandedJobs>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleInfo, setModalVisibleInfo] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState({});
  const [interviewCounts, setInterviewCounts] = useState<InterviewCounts>({});
  const [inscriptions, setInscriptions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('days');
  const screenWidth = Dimensions.get('window').width;
  const [changingMonth, setChangingMonth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const currentMonth = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const [showNoConnection, setShowNoConnection] = useState(false);
  const [locationName, setLocationName] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [jobOffers, setJobOffers] = useState<Job[]>([]);
  const [jobOffersWithCandidates, setJobOffersWithCandidates] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [animatedValues, setAnimatedValues] = useState<{ [key: string]: any }>({});
  const [panResponders, setPanResponders] = useState<{ [key: string]: any }>({});
  const [feedbackVisibleByCandidate, setFeedbackVisibleByCandidate] = useState({});
  const [feedbackMessageByCandidate, setFeedbackMessageByCandidate] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [shakeCandidateIndex, setShakeCandidateIndex] = useState(0);
  const isCandidateAcceptedOrRejected = selectedCandidate?.status === 'aceita' || selectedCandidate?.status === 'recusada';
  const navigation = useNavigation();
  const [suggestions, setSuggestions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{
      label: '',
      data: [],
      borderColor: '',
      backgroundColor: '',
      borderWidth: 0,
      fill: false,
    }],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minInscritos, setMinInscritos] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  const increment = () => setMinInscritos(minInscritos + 1);
  const decrement = () => {
    if (minInscritos > 0) {
      setMinInscritos(minInscritos - 1);
    }
  };
  const [showOnlyWithCandidates, setShowOnlyWithCandidates] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  // Garante que jobOffersWithCandidates é um array, evitando erros se estiver indefinido
  const filteredJobOffers = (jobOffersWithCandidates || []).filter(job => {
    return showOnlyWithCandidates ? job.inscricoes_vagas && job.inscricoes_vagas.length > 0 : true;
  });
  const [isMapLoading, setIsMapLoading] = useState(true);
  const sortedJobOffers = filteredJobOffers.sort((a, b) => {
    const dateA = a.data_criacao ? new Date(a.data_criacao) : new Date(0);
    const dateB = b.data_criacao ? new Date(b.data_criacao) : new Date(0);

    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  const [mapLocation, setMapLocation] = useState(null);
  const mapRef = useRef(null);
  const [mapUrl, setMapUrl] = useState(null);


  useEffect(() => {
    const intervalId = setInterval(() => {
      setShakeCandidateIndex(prevIndex => (prevIndex === 0 ? 1 : 0));
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const newAnimatedValues: { [key: string]: any } = {};
    const newPanResponders: { [key: string]: any } = {};

    jobOffersWithCandidates.forEach((job) => {
      job.inscricoes_vagas.forEach((inscricao: any) => {
        const { id_candidato } = inscricao;
        const { animatedValue, panResponder } = createPanResponderForCandidate(job.id, id_candidato);

        newAnimatedValues[id_candidato] = animatedValue;
        newPanResponders[id_candidato] = panResponder;
      });
    });

    setAnimatedValues(newAnimatedValues);
    setPanResponders(newPanResponders);
  }, [jobOffersWithCandidates]);

  useEffect(() => {
    fetchProfile();
  }, [userType, currentDate]);

  useEffect(() => {
    fetchProfile();
  }, [userType, currentDate]);

  useEffect(() => {
    if (userId) {
      fetchInscriptions(userId);
    }
  }, [userId]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setError({ message: 'Sem conexão com a internet. Verifique sua conexão.' }); setShowNoConnection(true);
      } else {
        setError(null);
        setShowNoConnection(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setModalVisible(false);
    });

    // Limpa o listener ao desmontar
    return unsubscribe;
  }, [navigation]);

  // Função que carrega os dados do usuário
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { id: userId } = await getUserNameAndId();
      console.log('User ID:', userId);
      setUserId(userId);

      // Verificar se o usuário é recrutador ou candidato em paralelo
      const [recruiterResponse, candidateResponse] = await Promise.all([
        supabase
          .from('recrutadores')
          .select('id, nome, cnpj, foto_perfil')
          .eq('id', userId)
          .single(),
        supabase
          .from('candidatos')
          .select('id, nome, foto_perfil')
          .eq('id', userId)
          .single()
      ]);

      const recruiterData = recruiterResponse.data;
      const candidateData = candidateResponse.data;

      if (recruiterData) {
        setUserData(recruiterData);
        setUserType('recrutador');
        recruiterData.foto_perfil && setProfileImage(recruiterData.foto_perfil);
        await fetchJobOffersWithCandidates(recruiterData.id);
      } else if (candidateData) {
        setUserData(candidateData);
        setUserType('candidato');
        candidateData.foto_perfil && setProfileImage(candidateData.foto_perfil);
        await fetchInscriptions(candidateData.id);
      } else {
        console.error('Usuário não encontrado em ambas as tabelas.');
        return;
      }

      // Executar as outras operações em paralelo
      const [solicitacoesCount, jobOffers, candidates, interviewCounts] = await Promise.all([
        countSolicitacoes(userId),
        fetchJobOffers(userId),
        fetchCandidates(userId),
        fetchInterviewCounts(userId)
      ]);

      // Atualizar o número de solicitações no estado global ou em qualquer outro lugar necessário
      AppState.solicitacoesCount = solicitacoesCount || 0;

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setError({ message: 'Erro ao buscar perfil.' });
      setShowNoConnection(true);
    } finally {
      setLoading(false);
    }
  };
  // Função auxiliar para buscar vagas
  const fetchJobOffers = async (userId: any) => {
    try {
      let query;

      if (userType === 'recrutador') {
        query = supabase
          .from('vagas')
          .select('id, titulo, descricao, localizacao, requisitos, salario, data_criacao, recrutadores (nome)')
          .eq('id_recrutador', userId)
          .limit(5);
      } else {
        query = supabase
          .from('solicitacoes_entrevista')
          .select('id_vaga, vagas (id, titulo, descricao, localizacao, requisitos, salario, data_criacao)')
          .eq('id_candidato', userId)
          .limit(5);
      }

      // Executar a consulta e armazenar os dados
      const { data: jobsData, error } = await query;
      if (error) {
        console.error('Erro ao buscar vagas:', error);
        setError('Erro ao buscar vagas.');
        return;
      }

      console.log('Vagas encontradas:', jobsData);
      setJobOffers(jobsData);
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      setError('Erro ao buscar vagas.');
    }
  };

  // Função auxiliar para buscar candidatos
  const fetchCandidates = async (userId: any) => {
    try {
      const query = supabase
        .from('solicitacoes_entrevista')
        .select('id, id_candidato, candidatos (id, nome, email, foto_perfil, cpf), vagas (id, titulo, localizacao, salario), status')
        .eq(userType === 'recrutador' ? 'id_recrutador' : 'id_candidato', userId)
        .limit(5);

      // Executar a consulta e armazenar os dados
      const { data: candidatesData, error } = await query;
      if (error) {
        console.error('Erro ao buscar candidatos:', error);
        setError('Erro ao buscar candidatos.');
        return;
      }

      console.log('Candidatos encontrados:', candidatesData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      setError('Erro ao buscar candidatos.');
    }
  };

  // Função auxiliar para buscar inscrições
  const fetchInscriptions = async (candidateId: any) => {
    try {
      const inscriptions = await getJobInscriptions(candidateId);
      console.log('Inscrições carregadas:', inscriptions);
      setInscriptions(inscriptions);
    } catch (err) {
      console.error('Erro ao carregar inscrições:', err);
      setError('Erro ao carregar as inscrições: ' + err.message);
    }
  };

  // Busca de locais frequentes para o user
  const getMostFrequentLocation = async (userId: any) => {
    const { data, error } = await supabase
      .from('solicitacoes_entrevista')
      .select('local')
      .eq('id_recrutador', userId);

    if (error) {
      console.error("Erro ao buscar os locais:", error);
      return null; // Retorna null em caso de erro
    }

    // Verifique se `data` é um array antes de continuar
    if (!Array.isArray(data)) {
      console.warn('Os dados retornados não são um array:', data);
      return null; // Retorna null se não for um array
    }

    if (data.length === 0) {
      console.warn('Nenhum local encontrado para o usuário:', userId);
      return null; // Retorna null se não houver locais
    }

    // Contar a frequência de cada local
    const locationCount = data.reduce((acc, { local }) => {
      acc[local] = (acc[local] || 0) + 1;
      return acc;
    }, {});

    // Obter o local mais frequente
    const mostFrequentLocation = Object.keys(locationCount).reduce((a, b) => locationCount[a] > locationCount[b] ? a : b);

    return mostFrequentLocation || null;
  };


  const handleAcceptOrReject = (jobId: any, candidateId: any, isAccepted: any) => {
    setFeedbackMessageByCandidate((prev) => ({
      ...prev,
      [candidateId]: isAccepted ? 'Aceito' : 'Recusado',
    }));

    // Aqui, você pode chamar a função de aceitação ou recusa
    if (isAccepted) {
      handleAcceptCandidate(jobId, candidateId, userId);
    } else {
      handleRecusar(jobId, candidateId);
    }

    // Reseta o feedback message após a animação de deslizamento.
    setTimeout(() => {
      setFeedbackMessageByCandidate((prev) => ({
        ...prev,
        [candidateId]: null,
      }));
    }, 50);
  };

  // Funções para recursar um candidato
  const handleRecusar = async (jobId: any, candidateId: any,) => {
    console.log("O item foi recusado!");
    console.log("Vaga recusada:", jobId);
    console.log("Candidato recusado:", candidateId);

    // Verifique se o ID da vaga e do candidato estão definidos
    if (!jobId || !candidateId) {
      console.error("ID da vaga ou do candidato não estão definidos.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inscricoes_vagas')
        .update({ status: 'recusada' })
        .match({ id_vaga: jobId, id_candidato: candidateId });

      if (error) {
        console.error("Erro ao atualizar a vaga:", error);
        return;
      }
      // 1. Buscar o token do candidato
      const { data: candidateTokenData, error: tokenError } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', candidateId)
        .single();

      if (tokenError || !candidateTokenData) {
        console.warn('Token do candidato não encontrado ou erro ao buscar:', tokenError);
        return; // Se não houver token, não envia notificação
      }

      const candidateToken = candidateTokenData.token;

      // 2. Enviar a notificação apenas se o token existir
      if (candidateToken) {
        const notificationTitle = 'Poxa, as notícia não são legais!';
        const notificationBody = 'Infelizmente você  não foi aceito para uma entrevista. Confira os detalhes em seu aplicativo.';

        // Log antes de enviar a notificação
        console.log('Enviando notificação para o candidato:', candidateToken);

        // Enviar a notificação e esperar pela resposta
        const notificationResponse = await sendPushNotification(candidateToken, notificationTitle, notificationBody);

        // Log após o envio
        console.log('Resposta da notificação enviada:', notificationResponse);
      } else {
        console.warn('Candidato optou por não receber notificações.');
      }
      console.log("Vaga atualizada com sucesso:", data);


      fetchJobOffersWithCandidates(userId);
    } catch (err) {
      console.error("Erro ao tentar recusar candidato:", err);
    }
  };

  const handleAcceptCandidate = async (jobId: any, candidateId: any, userId: any) => {
    // Verifique se o ID da vaga e do candidato estão definidos
    if (!jobId || !candidateId) {
      console.error("ID da vaga ou do candidato não estão definidos.");
      return;
    }

    try {
      console.log(`Tentando aceitar o candidato: ID da Vaga: ${jobId}, ID do Candidato: ${candidateId}, ID do Recrutador: ${userId}`);

      // Defina os detalhes da entrevista
      const dataEntrevista = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const dataEntrevistaFormatada = dataEntrevista.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const horario = '10:00:00';
      const local = await getMostFrequentLocation(userId) || '';

      console.log(`Data da Entrevista: ${dataEntrevistaFormatada}, Horário: ${horario}, Local: ${local}`);

      // Atualiza o status do candidato e insere a solicitação de entrevista em paralelo
      const [updateResponse, interviewResponse] = await Promise.all([
        supabase
          .from('inscricoes_vagas')
          .update({ status: 'aceita' })
          .match({ id_vaga: jobId, id_candidato: candidateId }),
        supabase
          .from('solicitacoes_entrevista')
          .insert([
            {
              id_recrutador: userId,
              id_candidato: candidateId,
              id_vaga: jobId,
              data_entrevista: dataEntrevistaFormatada,
              horario,
              local,
              status: 'pendente',
            },
          ])
      ]);

      const { error: updateError } = updateResponse;
      const { error: interviewError } = interviewResponse;

      if (updateError || interviewError) {
        console.error("Erro ao atualizar a vaga ou criar a solicitação de entrevista:", updateError || interviewError);
        console.log("Resposta da atualização:", updateResponse);
        console.log("Resposta da inserção da entrevista:", interviewResponse);
        return;
      }

      console.log("Vaga atualizada e solicitação de entrevista criada com sucesso.");
      alert('Candidato aceito com sucesso, você pode editar os detalhes logo acima!');

      // Fetch de dados adicionais
      fetchProfile();
      fetchJobOffersWithCandidates(userId);
      fetchJobOffers(userId);

      // Buscar o token do candidato enquanto atualiza os dados anteriores
      const { data: candidateTokenData, error: tokenError } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', candidateId)
        .single();

      if (tokenError) {
        console.warn('Erro ao buscar o token do candidato:', tokenError);
        return;
      }

      const candidateToken = candidateTokenData?.token;
      console.log("Token do candidato encontrado:", candidateToken);

      if (candidateToken) {
        const notificationTitle = 'Boa notícia!';
        const notificationBody = 'Parabéns! Você foi aceito para uma entrevista. Confira os detalhes em seu aplicativo.';

        try {
          const notificationResponse = await sendPushNotification(candidateToken, notificationTitle, notificationBody);
          console.log('Notificação enviada com sucesso:', notificationResponse);
        } catch (notificationError) {
          console.error('Erro ao enviar notificação:', notificationError);
        }
      } else {
        console.warn('Candidato optou por não receber notificações.');
      }

    } catch (error) {
      console.error('Erro ao processar a aceitação do candidato:', error);
    }
  };

  // Função para buscar vagas e candidatos inscritos
  const fetchJobOffersWithCandidates = async (userId: any) => {
    try {
      // Buscar as vagas do recrutador
      const { data: jobOffers, error } = await supabase
        .from('vagas')
        .select(`
          id,
          titulo,
          descricao,
          localizacao,
          requisitos,
          salario,
          data_criacao,
          inscricoes_vagas (
            id_candidato,
            status,
            candidatos (id, nome, email, foto_perfil, cpf)
          )
        `)
        .eq('id_recrutador', userId);

      if (error) {
        console.error('Erro ao buscar vagas:', error);
        setJobOffersWithCandidates([]);
        return;
      }

      console.log('Vagas com candidatos inscritos:', JSON.stringify(jobOffers, null, 2));

      // Verificação e validação dos dados recebidos
      if (!jobOffers || !Array.isArray(jobOffers)) {
        console.warn('Nenhuma vaga encontrada ou formato inválido:', jobOffers);
        setJobOffersWithCandidates([]);
        return;
      }

      // Filtrar as inscrições recusadas
      const filteredJobOffers = jobOffers.map((job) => {
        return {
          ...job,
          inscricoes_vagas: job.inscricoes_vagas.filter(inscricao =>
            inscricao.status !== 'recusada' && inscricao.status !== 'aceita'
          )
        };
      })

      // Salvar as vagas e candidatos no estado
      setJobOffersWithCandidates(filteredJobOffers);
      console.log('Estado atualizado com as vagas e candidatos filtrados:', filteredJobOffers);

    } catch (error) {
      console.error('Erro ao buscar vagas e candidatos:', error);
      setError('Erro ao buscar vagas e candidatos.');
    }
  };



  const getBackgroundColor = (animatedValue: any, feedbackMessage: any) => {
    if (feedbackMessage === 'Aceito') {
      return 'lightgreen';
    } else if (feedbackMessage === 'Recusado') {
      return 'lightcoral';
    }

    // Durante o arraste, altera a cor dinamicamente
    return animatedValue.interpolate({
      inputRange: [-100, 0, 100],
      outputRange: ['lightcoral', 'white', 'lightgreen'],
      extrapolate: 'clamp',
    });
  };

  const createPanResponderForCandidate = (jobId: any, candidateId: any) => {
    const animatedValue = new Animated.Value(0);
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        animatedValue.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        const threshold = 120;

        if (gestureState.dx > threshold) {
          // Aceitar
          Animated.spring(animatedValue, {
            toValue: 500,
            useNativeDriver: true,
          }).start(() => {
            handleAcceptOrReject(jobId, candidateId, true);
            animatedValue.setValue(0); // Reseta a posição após a animação
          });
        } else if (gestureState.dx < -threshold) {
          // Recusar
          Animated.spring(animatedValue, {
            toValue: -500,
            useNativeDriver: true,
          }).start(() => {
            handleAcceptOrReject(jobId, candidateId, false);
            animatedValue.setValue(0); // Reseta a posição após a animação
          });
        } else {
          // Volta à posição original sem aceitar ou recusar
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });
    return { animatedValue, panResponder };
  };

  // ======================================================= Funções do Gráfico, Alterações nessa parte representam risco de porrada =====================================================

  // Função do capeta, não mexer por tudo que é mais sagrado
  const fetchInterviewCounts = async (userId: any) => {
    setIsLoading(true);

    try {
      //  Buscar as solicitações de entrevista sera usado para o candidato e RH viu
      console.log('userId:', userId);
      console.log('userType:', userType);
      console.log('startDate:', startDate);
      console.log('endDate:', endDate);

      const { data: countsData, error } = await supabase
        .from('solicitacoes_entrevista')
        .select('data_entrevista')
        .eq(userType === 'recrutador' ? 'id_recrutador' : 'id_candidato', userId)
        .gte('data_entrevista', startDate)
        .lte('data_entrevista', endDate)
        .order('data_entrevista', { ascending: true });

      console.log('Dados das entrevistas:', countsData);
      console.log('Erro ao buscar entrevistas:', error);

      if (error) {
        throw new Error(error.message);
      }

      // Processar dados para ambos os modos
      const countsByMonth = {};
      const countsByDay = {};

      countsData.forEach((interview) => {
        const date = new Date(interview.data_entrevista);
        const month = date.getMonth();
        const day = date.getDate();

        // Agrupando por mês
        countsByMonth[monthNames[month]] = (countsByMonth[monthNames[month]] || 0) + 1;

        // Agrupando por dia
        if (month + 1 === currentMonth) {
          countsByDay[day] = (countsByDay[day] || 0) + 1;
        }
      });

      // Armazenar os dados em cache para  evitar requisições desnecessárias e uma puta demora na troca de modos

      setInterviewCounts({ days: countsByDay, months: countsByMonth });

      // Renderizar gráfico com base no modo atual
      if (viewMode === 'months') {
        renderMonthlyChart(countsByMonth);
      } else {
        renderDailyChart(countsByDay);
      }

    } catch (error) {
      console.error('Erro ao buscar contagens de entrevistas:', error);
      setError('Erro ao buscar contagens de entrevistas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rederizacao do modo mensal, ocorreu a separacao dos modos para uma facil manuntencao
  const renderMonthlyChart = (countsByMonth: any) => {
    const labels = Object.keys(countsByMonth);
    const dataCounts = Object.values(countsByMonth);

    // Se não houver dados, inicializa o gráfico com zero
    if (labels.length === 0) {
      setChartData({
        labels: [],
        datasets: [
          {
            label: 'Contagem de Solicitações',
            data: [0],
            borderColor: '#008080',
            backgroundColor: 'rgba(0, 128, 128, 0.2)',
            borderWidth: 2,
            fill: true,
          },
        ],
      });
    } else {
      // Cria os dados do gráfico com os nomes dos meses e suas contagens
      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Contagem de Solicitações',
            data: dataCounts as number[],
            borderColor: '#008080',
            backgroundColor: 'rgba(0, 128, 128, 0.2)',
            borderWidth: 2,
            fill: true,
          },
        ],
      });
    }
  };

  //  Rederizacao do modo diario, ocorreu a separacao dos modos para uma facil manuntencao
  const renderDailyChart = (countsByDay: any) => {
    const labels = Object.keys(countsByDay);
    const dataCounts = Object.values(countsByDay);

    // Se não houver dados, inicializa o gráfico com zero
    if (labels.length === 0) {
      setChartData({
        labels: [],
        datasets: [
          {
            label: 'Contagem de Solicitações',
            data: [0],
            borderColor: '#008080',
            backgroundColor: 'rgba(0, 128, 128, 0.2)',
            borderWidth: 2,
            fill: true,
          },
        ],
      });
    } else {
      // Cria os dados do gráfico com os dias e suas contagens
      setChartData({
        labels: labels.map((day) => day.toString()), // Converte os dias para strings
        datasets: [
          {
            label: 'Contagem de Solicitações',
            data: dataCounts,
            borderColor: '#008080',
            backgroundColor: 'rgba(0, 128, 128, 0.2)',
            borderWidth: 2,
            fill: true,
          },
        ],
      });
    }
  };

  // Funcao para a mudanca os modos diarios e mensais
  const toggleViewMode = () => {
    const newViewMode = viewMode === 'days' ? 'months' : 'days';
    setViewMode(newViewMode);

    // Verifica se os dados já foram buscados para o novo modo
    if (interviewCounts[newViewMode]) {
      // Atualiza o gráfico com os dados já buscados
      if (newViewMode === 'months') {
        renderMonthlyChart(interviewCounts[newViewMode]);
      } else {
        renderDailyChart(interviewCounts[newViewMode]);
      }
    } else {
      // Busca os dados novamente para o novo modo
      fetchInterviewCounts(userId);
    }
  };

  //  Funcao para a evitar muitas requisicoes do banco de dados
  const debounce = (func: any, delay: any) => {
    let timeoutId: any;
    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const toggleViewModeDebounced = debounce(toggleViewMode, 300);

  // Função para mudar o mês
  const changeMonth = (direction: any) => {
    if (!changingMonth) {
      setChangingMonth(true);
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + direction);
      console.log('Nova Data após mudança de mês:', newDate); // Log para verificar a nova data
      setCurrentDate(newDate);
      fetchInterviewCounts(userId);
      setTimeout(() => {
        setChangingMonth(false);
      }, 500);
    }
  };

  // Função para mudar o ano
  const changeYear = (direction: any) => {
    if (!changingMonth) {
      setChangingMonth(true);
      const newDate = new Date(currentDate);
      newDate.setFullYear(currentDate.getFullYear() + direction);
      console.log('Nova Data após mudança de ano:', newDate);
      setCurrentDate(newDate);
      fetchInterviewCounts(userId);
      setTimeout(() => {
        setChangingMonth(false);
      }, 500);
    }
  };

  // =======================================================================================================================================


  // Função para carregamento da pagina
  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff' }]}>
        <Animatable.View animation="zoomIn" duration={1000} style={styles.loaderContent}>
          <ActivityIndicator size="large" color="#F07A26" />
          <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>Carregando...</Text>
        </Animatable.View>
      </View>
    );
  }

  // Função para alternar a expansão das vagas
  const toggleExpand = (jobId: string) => {
    // Toggle individual do estado de expansão
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleToggleExpand = (jobId: any) => {
    settoggleExpandInfo(prev => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };


  //=========================================================  Funções do modal =======================================================
  // Função para fechar o modal
  const closeModal = () => {
    setModalVisible(false);
    setUserId(null);
    setMapUrl('');  
  };

  // Função para exibir o seletor de data
  const onChangeDate = (selectedDate: any) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  // Função para exibir o seletor de hora
  const onChangeTime = (selectedTime: any) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
  };

  const showDatePickerDialog = () => {
    setShowDatePicker(true);
  };

  const showTimePickerDialog = () => {
    setShowTimePicker(true);
  };

  // Função para abrir o modal
  const openModal = async (candidate: any, jobId: any) => {
    console.log('Candidato selecionado para o modal:', candidate);
    console.log('ID da vaga:', jobId);
    setSelectedCandidate(candidate);
    setSelectedJobId(jobId);
    try {
      await generateMapUrl();
      console.log('Primeira chamada para gerar URL do mapa concluída.');
  
      // Chama a função novamente para gerar a URL do mapa pela segunda vez
      await generateMapUrl();
      console.log('Segunda chamada para gerar URL do mapa concluída.');

      // Buscar a solicitação de entrevista existente para o candidato e a vaga
      const { data: existingRequest, error } = await supabase
        .from('solicitacoes_entrevista')
        .select('local')
        .eq('id_candidato', candidate.candidatos.id)
        .eq('id_vaga', jobId)
        .single();

      console.log('Dados da solicitação de entrevista:', existingRequest);
      console.log('Erro ao buscar a solicitação de entrevista:', error);

      if (error) {
        console.error('Erro ao buscar solicitação de entrevista:', error);
      } else if (existingRequest) {
        setLocation(existingRequest.local);
      } else {
        setLocation('Endereço padrão');
      }

      setModalVisible(true);
    } catch (err) {
      console.error('Erro ao buscar informações da entrevista:', err);
      Alert.alert(
        'Algo deu errrado', // Título do alerta personalizado
        'Erro ao buscar informações da entrevista, lamentamos por isso', // Mensagem do alerta
        [
          { text: 'OK', onPress: () => console.log('OK Pressionado') },
        ],
        { cancelable: true } // Impede que o alerta seja fechado ao tocar fora dele
      );
    }
  };

  // Função para obter o nome do local a partir das coordenadas
  const getLocationName = async (latitude: any, longitude: any) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
        method: 'GET',
        headers: {
          'User-Agent': 'siasapp/1.0',
          'Accept-Language': 'pt-BR'
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setLocation(data.display_name); // Atualiza o campo de input com o nome do local
      setLocationName(data.display_name); // Para o marcador no mapa
    } catch (error) {
      console.error('Erro ao obter o nome do local:', error);
      setLocation('Local não encontrado');
    }
  };
  // Função para obter coordenadas a partir do nome do local
  const getCoordinatesFromLocationName = async (locationName) => {
    try {
      console.log(`Buscando coordenadas para o local: ${locationName}`);
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
      console.log('Resposta da API:', data);
      if (data.length > 0) {
        console.log('Coordenadas encontradas:', data[0].lat, data[0].lon);
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      } else {
        console.log('Nenhuma coordenada encontrada para o local.');
      }
    } catch (error) {
      console.error('Erro ao obter as coordenadas:', error);
    }
    return null;
  };

  // Função para obter as coordenadas e gerar a URL
  const generateMapUrl = async () => {
    console.log(`Gerando URL para o local: ${location}`);

    if (!location) {
      console.log('Nenhuma localização definida, URL do mapa não gerada.');
      return ''; // Retorna vazio se o nome do local não for fornecido
    }

    const zoom = 17; // Nível de zoom fixo para o mapa
    const coordinates = await getCoordinatesFromLocationName(location);

    if (!coordinates) {
      console.log('Não foi possível obter as coordenadas para o local.');
      return '';
    }

    // URL do OpenStreetMap, passando as coordenadas diretamente
    const url = `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}&zoom=${zoom}&layers=mapnik`;

    console.log(`URL gerada: ${url}`);
    setMapUrl(url); 
    return url;
  };



  // Função para lidar com a mudança de texto no input de endereço
  const handleInputChange = (text) => {
    console.log(`Entrada do usuário: ${text}`);
    setLocation(text);

    // Limpar o timeout anterior, se houver
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Definir um novo timeout para "debouncing"
    const newTimeout = setTimeout(() => {
      if (text) {
        console.log('Gerando URL com o nome do local...');
        // Chama a função para gerar a URL com o nome do local
      } else {
        console.log('Nenhum texto inserido');
      }
    }, 700);

    setTypingTimeout(newTimeout);
  };

  // Função para lidar com o toque no mapa
  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setMapLocation(coordinate);
    await getLocationName(coordinate.latitude, coordinate.longitude);

  };

  // Função para salvar as informações do modal no banco de dados
  const handleSave = async () => {
    try {
      const { id: userId } = await getUserNameAndId();
      const id_recrutador = userId;

      // Logs para depuração
      console.log('Candidato selecionado:', selectedCandidate);
      console.log('Candidatos:', selectedCandidate ? selectedCandidate.candidatos : null);
      console.log('ID da vaga:', selectedJobId);

      // Verifica se selectedCandidate e informações relevantes estão definidos
      if (!selectedCandidate || !selectedCandidate.candidatos || !selectedJobId) {
        alert('Selecione um candidato e uma vaga válidos.');
        return;
      }

      //  Verifica se o candidato já foi selecionado para a vaga
      const id_candidato = selectedCandidate.candidatos.id;
      const id_vaga = selectedJobId;
      const data_entrevista = date.toISOString().split('T')[0];
      const horario = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const local = location;
      const status = 'pendente';

      // Adicione logs para depuração
      console.log('userId:', userId);
      console.log('id_candidato:', id_candidato);
      console.log('id_vaga:', id_vaga);

      // Verificar se já existe uma solicitação para este candidato e vaga
      const existingRequestResponse = await supabase
        .from('solicitacoes_entrevista')
        .select('*')
        .eq('id_candidato', id_candidato)
        .eq('id_vaga', id_vaga);

      if (existingRequestResponse.error) {
        console.error('Erro ao buscar solicitação existente:', existingRequestResponse.error);
        Alert.alert(
          'Algo deu errrado', // Título do alerta personalizado
          'Erro ao buscar informações da entrevista, lamentamos por isso', // Mensagem do alerta
          [
            { text: 'OK', onPress: () => console.log('OK Pressionado') },
          ],
          { cancelable: true } // Impede que o alerta seja fechado ao tocar fora dele
        );
        return;
      }

      if (existingRequestResponse.data && existingRequestResponse.data.length > 0) {
        // Se a solicitação já existe, verificar o status
        const existingRequest = existingRequestResponse.data[0];
        if (existingRequest.status === 'pendente') {
          // Atualizar a solicitação existente
          const updateResponse = await supabase
            .from('solicitacoes_entrevista')
            .update({
              data_entrevista,
              horario,
              local,
              status,
            })
            .eq('id_candidato', id_candidato)
            .eq('id_vaga', id_vaga);

          if (updateResponse.error) {
            console.error('Erro ao atualizar solicitação de entrevista:', updateResponse.error);
            alert('Erro ao atualizar solicitação de entrevista.');
          } else {
            console.log('Solicitação de entrevista atualizada com sucesso!');
            handleSuccess();
            closeModal();
          }
        } else {
          // Se o status não é 'pendente', não permitir nova solicitação
          Alert.alert(
            'Candidato ja aceitou ou recursou', // Título do alerta personalizado
            'Não é possível enviar uma nova solicitação, pois já existe uma solicitação com status diferente', // Mensagem do alerta
            [
              { text: 'OK', onPress: () => console.log('OK Pressionado') },
            ],
            { cancelable: true } // Impede que o alerta seja fechado ao tocar fora dele
          );
        }
      } else {
        // Caso não exista uma solicitação, criar uma nova
        const insertResponse = await supabase
          .from('solicitacoes_entrevista')
          .insert([
            {
              id_recrutador,
              id_candidato,
              id_vaga,
              data_entrevista,
              horario,
              local,
              status,
            },
          ]);

        if (insertResponse.error) {
          console.error('Erro ao salvar solicitação de entrevista:', insertResponse.error);
          alert('Erro ao salvar solicitação de entrevista.');
        } else {
          console.log('Solicitação de entrevista salva com sucesso!');
          Alert.alert(
            'Atualizado com sucesso', // Título do alerta personalizado
            'Os detralhes da entrevista forem alterados com sucesso', // Mensagem do alerta
            [
              { text: 'OK', onPress: () => console.log('OK Pressionado') },
            ],
            { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          ); closeModal();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar solicitação de entrevista:', error);
      alert('Erro ao salvar solicitação de entrevista.');
    }
  };

  const handleSuccess = () => {
    Alert.alert(
      'Sucesso', // Título do alerta
      'Solicitação de entrevista atualizada com sucesso!', // Mensagem do alerta
      [{ text: 'OK' }] // Botões do alerta
    );
  };


  //===================================================================================================================================================


  // Funcao para recarregar a pagina
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchInterviewCounts(userId);
      await fetchInscriptions(userId);
      await fetchJobOffers(userId);
      await fetchCandidates(userId);
      await fetchProfile();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setError('Erro ao atualizar os dados.');
    } finally {
      setRefreshing(false);
    }
  };
  const truncateText = (text: any, limit: any) => {
    if (!text) return 'Nome não disponível';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  // Renderização da Home para ambos os tipos de usuário
  if (userType === 'recrutador') {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff' }, // Altera a cor de fundo
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        <View style={styles.top}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../../assets/perfil.png')}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <View style={styles.greetingContainer}>
              <Text style={styles.text}>Olá, Recrutador</Text>
              <Icon
                name="work"
                size={20}
                color="#ffff"
                style={styles.icon}
              />
            </View>
            {userData.nome && (
              <View>
                <Text style={styles.text2}>{userData.nome}</Text>
              </View>
            )}
          </View>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#ff8c00"
          />
        </View>
        <View style={styles.chartContainer}>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Quantidade de entrevistas oferecidas</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffa726" />
          ) : chartData.labels.length > 0 ? (
            <GestureHandlerRootView>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, marginBottom: 10, fontWeight: 'bold', color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>
                  Solicitações de Entrevista - {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode}>
                  <Icon
                    name={viewMode === 'days' ? 'calendar-view-month' : 'calendar-today'}
                    size={20}
                    color="#fff"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.buttonText}>
                    Visualizar por {viewMode === 'days' ? 'meses' : 'dias'}
                  </Text>
                </TouchableOpacity>

                <PanGestureHandler
                  onGestureEvent={(event) => {
                    const { translationX } = event.nativeEvent;
                    console.log('Translation X:', translationX);
                    if (Math.abs(translationX) > 50) {
                      viewMode === 'days'
                        ? (translationX > 0 ? changeMonth(-1) : changeMonth(1))
                        : (translationX > 0 ? changeYear(-1) : changeYear(1));
                    }
                  }}
                >
                  <View style={[styles.chartWrapper, { backgroundColor: '#FFFFFF', borderRadius: 16 }]}>
                    <LineChart
                      data={chartData}
                      width={screenWidth - 32}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#FFFFFF',
                        backgroundGradientFrom: '#FFFFFF',
                        backgroundGradientTo: '#FFFFFF',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(240, 122, 38, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: "4",
                          strokeWidth: "2",
                          stroke: "#ffa726",
                        },
                        propsForBackgroundLines: {
                          strokeDasharray: "5,5",
                          stroke: "#ccc",
                        },
                        withHorizontalLines: true,
                        fromZero: true,
                        formatYLabel: (value) => `${value}`,
                      }}
                      style={{ marginVertical: 8, borderRadius: 16 }}
                      bezier
                    />
                  </View>
                </PanGestureHandler>

              </View>
            </GestureHandlerRootView>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>Aguardando dados</Text>
              <PulsingDots />
            </View>
          )}
        </View>


        <Text style={[styles.text1, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Entrevistas Agendadas
        </Text>
        <View style={[styles.containeragenda, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }]}>
          {error ? (
            <Text style={styles.errorText}>{error.message || 'Erro desconhecido'}</Text>
          ) : (
            <>
              {/* Filtros */}
              <View style={[styles.filtersContainer, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }]}>
                <TouchableOpacity
                  onPress={() => setFiltersVisible(!filtersVisible)}
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: filtersVisible
                        ? (colorScheme === 'dark' ? '#F07A26' : '#1F1F3F')
                        : (colorScheme === 'dark' ? '#4141A5FF' : '#F07A26'),
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={{ color: filtersVisible ? '#FFFFFF' : (colorScheme === 'dark' ? '#FFFFFF' : '#000000') }}>
                    {filtersVisible ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </Text>
                  <Ionicons name={filtersVisible ? 'chevron-up' : 'chevron-down'} size={20} color="#fff" />
                </TouchableOpacity>

                {filtersVisible && ( // Renderiza os filtros apenas se estiver visível
                  <>
                    <TextInput
                      style={[styles.inputtitulo, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF', color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}
                      placeholder="Título da vaga"
                      placeholderTextColor={colorScheme === 'dark' ? '#CCCCCC' : '#888888'}
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                    />
                    <View>
                      <Text style={[styles.label, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                        Quantidade mínima de candidatos na vaga:
                      </Text>
                      <View style={styles.containerNumber}>
                        <TouchableOpacity onPress={() => setMinInscritos(prev => Math.max(1, prev - 1))} style={styles.button}>
                          <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>-</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.inputNumber, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}
                          keyboardType="numeric"
                          value={minInscritos.toString()}
                          onChangeText={(text) => setMinInscritos(Math.max(1, parseInt(text) || 1))}
                        />
                        <TouchableOpacity onPress={() => setMinInscritos(prev => prev + 1)} style={styles.button}>
                          <Text style={styles.buttonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={[styles.statusFilter, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }]}>
                      <Text style={[styles.headerText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>Status da solicitação:</Text>
                      <View style={[styles.buttonContainer, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }]}>
                        <TouchableOpacity onPress={() => setSelectedStatus('aceita')} style={styles.button}>
                          <Ionicons name="checkmark-circle" size={20} color={selectedStatus === 'aceita' ? '#fff' : '#333'} />
                          <Text style={selectedStatus === 'aceita' ? styles.selectedStatus : styles.status}>Aceito</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedStatus('recusada')} style={styles.button}>
                          <Ionicons name="close-circle" size={20} color={selectedStatus === 'recusada' ? '#fff' : '#333'} />
                          <Text style={selectedStatus === 'recusada' ? styles.selectedStatus : styles.status}>Recusado</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedStatus('pendente')} style={styles.button}>
                          <Ionicons name="hourglass" size={20} color={selectedStatus === 'pendente' ? '#fff' : '#333'} />
                          <Text style={selectedStatus === 'pendente' ? styles.selectedStatus : styles.status}>Pendente</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedStatus('')} style={styles.button}>
                          <Ionicons name="list" size={20} color={selectedStatus === '' ? '#fff' : '#333'} />
                          <Text style={selectedStatus === '' ? styles.selectedStatus : styles.status}>Todos</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Filtrando e exibindo as ofertas de emprego */}
              {jobOffers.filter(job => {
                const inscritosCount = candidates.filter(candidate => candidate.vagas.id === job.id).length;

                return (
                  inscritosCount >= minInscritos &&
                  (selectedStatus ? candidates.some(candidate => candidate.vagas.id === job.id && candidate.status === selectedStatus) : true) &&
                  (searchTerm ? job.titulo.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                );
              }).length > 0 ? (
                jobOffers
                  .filter(job => {
                    const inscritosCount = candidates.filter(candidate => candidate.vagas.id === job.id).length;

                    return (
                      inscritosCount >= minInscritos &&
                      (selectedStatus ? candidates.some(candidate => candidate.vagas.id === job.id && candidate.status === selectedStatus) : true) &&
                      (searchTerm ? job.titulo.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                    );
                  })
                  .map((job, index) => (
                    <Animatable.View
                      key={job.id}
                      style={[
                        styles.jobContainer,
                        { backgroundColor: colorScheme === 'dark' ? (index % 2 === 0 ? '#4141A5FF' : '#F07A26') : (index % 2 === 0 ? '#1F1F3F' : '#F07A26') }
                      ]}
                      animation="bounceIn"
                      duration={500}
                    >
                      <TouchableOpacity style={styles.jobTitleContainer} onPress={() => toggleExpand(job.id)}>
                        <Text style={[styles.jobTitle, { color: '#FFFFFF' }]}>{job.titulo}</Text>
                        <Text style={[styles.arrow, { color: '#FFFFFF' }]}>{expandedJobs[job.id] ? '▼' : '▲'}</Text>
                      </TouchableOpacity>

                      {expandedJobs[job.id] && (
                        candidates
                          .filter(candidate => candidate.vagas.id === job.id && (selectedStatus ? candidate.status === selectedStatus : true)) // Filtra os candidatos com base no status selecionado ou não
                          .map(candidate => (
                            <View key={candidate.id} style={styles.candidateContainer}>
                              <TouchableOpacity onPress={() => openModal(candidate, job.id)}>
                                <View style={styles.candidateDetails}>
                                  {candidate.candidatos.foto_perfil ? (
                                    <Image source={{ uri: candidate.candidatos.foto_perfil }} style={styles.photo} />
                                  ) : (
                                    <Image source={require('../../assets/perfil.png')} style={styles.photo} />
                                  )}
                                  <View style={styles.infoContainer}>
                                    {candidate.status === 'aceita' && <Text style={styles.statusText}>✔️ Aceito</Text>}
                                    {candidate.status === 'recusada' && <Text style={styles.statusText}>❌ Recusado</Text>}
                                    {candidate.status === 'pendente' && <Text style={styles.statusText}>⏳ Pendente</Text>}
                                    <Text style={styles.name}>{candidate.candidatos.nome}</Text>
                                    <Text style={styles.email}>{candidate.candidatos.email}</Text>
                                    <Text style={styles.cpf}>CPF: {candidate.candidatos.cpf.replace(/.(?=.{4})/g, '*')}</Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </View>
                          ))
                      )}
                    </Animatable.View>
                  ))
              ) : (
                <Text style={[styles.noJobOffersText, { color: colorScheme === 'dark' ? '#FF4500' : 'red' }]}>Nenhuma vaga disponível com os filtros aplicados.</Text>
              )}
            </>
          )}
        </View>

        <Text style={[styles.text1, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>Suas Ofertas de Trabalho:</Text>
        <View style={[styles.containeragenda, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }]}>
          {/* Botão para mostrar/ocultar filtros */}
          <View style={styles.filtersContainer}>




            <Animatable.View style={styles.filtersContainersuasJobs} animation="fadeIn" duration={300}>
              {/* Indicador de arraste */}
              <Animatable.Text
                animation="bounceInRight"
                iterationCount={1}
                duration={1500}
                style={[styles.dragIndicator, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}
              >
                <Ionicons name="arrow-forward" size={16} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                Arraste para mais opções
              </Animatable.Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {/* Botão para mostrar/ocultar vagas */}
                <TouchableOpacity
                  style={[styles.toggleButton, styles.suasjobOfferButton]}
                  onPress={() => setShowOnlyWithCandidates(!showOnlyWithCandidates)}
                >
                  <Ionicons name="briefcase" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>
                    {showOnlyWithCandidates ? "Exibir Todas as Vagas" : "Exibir Somente Vagas com Candidatos Inscritos"}
                  </Text>
                </TouchableOpacity>

                {/* Botão para ordenar vagas */}
                <TouchableOpacity
                  style={[styles.toggleButton, styles.suasjobOfferButton, { marginLeft: 10 }]}
                  onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <Ionicons
                    name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>
                    {sortOrder === 'asc' ? "Ordenar do Mais Antigo ao Mais Recente" : "Ordenar do Mais Recente ao Mais Antigo"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animatable.View>



          </View>
          {sortedJobOffers.length > 0 ? (
            <>
              {/* Renderiza as instruções apenas se a lista estiver expandida */}
              {Object.keys(toggleExpandInfo).some(jobId => toggleExpandInfo[jobId]) && (
                <View>
                  <Text style={[styles.instructionText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                    👈 Arraste o candidato para a <Text style={styles.highlightText}>esquerda</Text> para <Text style={styles.rejectText}>recusar</Text>.
                  </Text>
                  <Text style={[styles.instructionText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                    Arraste para a <Text style={styles.highlightText}>direita</Text> para <Text style={styles.acceptText}>aceitar 👉</Text>.
                  </Text>
                </View>
              )}

              {sortedJobOffers.map((job, index) => (
                <Animatable.View
                  key={job.id}
                  style={[
                    styles.jobContainer,
                    { backgroundColor: colorScheme === 'dark' ? (index % 2 === 0 ? '#4141A5FF' : '#F07A26') : (index % 2 === 0 ? '#1F1F3F' : '#F07A26') }
                  ]}
                  animation="bounceIn"
                  duration={500}
                >
                  <TouchableOpacity style={styles.jobTitleContainer} onPress={() => handleToggleExpand(job.id)}>
                    <Text style={[styles.jobTitle, { color: '#FFFFFF' }]}>{job.titulo}</Text>
                    <Text style={[styles.arrow, { color: '#FFFFFF' }]}>{toggleExpandInfo[job.id] ? '▼' : '▲'}</Text>
                  </TouchableOpacity>

                  {toggleExpandInfo[job.id] && (
                    <View>
                      <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Inscritos:</Text>
                      {Array.isArray(job.inscricoes_vagas) && job.inscricoes_vagas.length > 0 ? (
                        job.inscricoes_vagas.map((inscricao, candidateIndex) => {
                          const candidato = inscricao.candidatos;
                          if (!candidato) {
                            console.warn('Inscrição sem candidatos:', inscricao);
                            return null;
                          }
                          const animatedValue = animatedValues[inscricao.id_candidato] || new Animated.Value(0);
                          const panResponder = panResponders[inscricao.id_candidato];
                          const feedbackMessage = feedbackMessageByCandidate[inscricao.id_candidato];
                          return (
                            <Animated.View
                              key={inscricao.id_candidato}
                              style={[
                                styles.candidateContainer,
                                {
                                  transform: [{ translateX: animatedValue }],
                                  backgroundColor: getBackgroundColor(animatedValue, feedbackMessage),
                                },
                              ]}
                              {...(panResponder ? panResponder.panHandlers : {})}
                            >
                              <TouchableOpacity onPress={() => {
                                setFeedbackVisibleByCandidate((prev) => ({
                                  ...prev,
                                  [inscricao.id_candidato]: true,
                                }));
                                setFeedbackMessageByCandidate((prev) => ({
                                  ...prev,
                                }));
                              }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  {candidato.foto_perfil ? (
                                    <Image source={{ uri: candidato.foto_perfil }} style={styles.photo} />
                                  ) : (
                                    <Image source={require('../../assets/perfil.png')} style={styles.photo} />
                                  )}
                                  <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.name}>
                                      {truncateText(candidato.nome, 30)}
                                    </Text>
                                    <Text style={styles.email}>{candidato.email || 'Email não disponível'}</Text>
                                    {candidato.cpf && (
                                      <Text style={styles.cpf}>CPF: {candidato.cpf.replace(/.(?=.{4})/g, '*')}</Text>
                                    )}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </Animated.View>
                          );
                        })
                      ) : (
                        <Text style={styles.noJobOffersText}>Nenhum inscrito nessa vaga</Text>
                      )}
                    </View>
                  )}
                </Animatable.View>
              ))}
            </>
          ) : (
            <Text>Nenhuma vaga disponível.</Text>
          )}
        </View>

        <View>
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
                  fetchInterviewCounts(userId);
                }}
              >
                <Text style={styles.buttonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Modal para informações do candidato */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1F1F3F' : '#FFFFFF' }]}>
                {selectedCandidate && (
                  <>
                    <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                      Detalhes do Candidato
                    </Text>
                    <View style={styles.imageContainer}>
                      <Image
                        source={selectedCandidate.candidatos.foto_perfil ? { uri: selectedCandidate.candidatos.foto_perfil } : require('../../assets/perfil.png')}
                        style={styles.profileImage}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.buttonContact}
                      onPress={async () => {
                        const userId = await getUserIdByEmailFirestore(selectedCandidate.candidatos.email);

                        navigation.navigate('chatRoom', {
                          item: {
                            userId: userId,
                            username: selectedCandidate.candidatos.nome,
                            profileImg: selectedCandidate.candidatos.foto_perfil
                          }
                        });
                      }}
                    >
                      <View style={styles.buttonContent}>
                        <Ionicons name="chatbubble-outline" size={20} color="#FF8D02FF" />
                        <Text style={styles.buttonTexnavegacao}>Conversar com o Candidato</Text>
                      </View>

                    </TouchableOpacity>
                    <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                      <Text style={styles.modalLabel}>Nome: </Text>
                      {selectedCandidate.candidatos.nome || 'Nome não disponível'}
                    </Text>
                    <Text style={[styles.modalText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                      <Text style={styles.modalLabel}>Email: </Text>
                      {selectedCandidate.candidatos.email || 'Email não disponível'}
                    </Text>

                    {/* Campo de input para digitar o local */}
                    <TextInput
                      style={[
                        {
                          color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                          borderColor: '#FF8C00',
                          borderWidth: 1,
                          height: 40,
                          padding: 10,
                          marginBottom: 30
                        }
                      ]} placeholder="Digite o local"
                      value={location}
                      onChangeText={handleInputChange}
                      placeholderTextColor={colorScheme === 'dark' ? '#FFFFFF' : '#888'}
                      selectionColor="#FF8C00"
                      underlineColorAndroid="transparent"
                    />

                    <View style={{ height: 300 }}>
                      {isMapLoading && <ActivityIndicator size="large" color="#FF8C00" />}
                      {mapUrl ? (
                        <WebView
                          source={{ uri: mapUrl }}
                          style={{ flex: 1 }}
                          onLoadStart={() => setIsMapLoading(true)}
                          onLoadEnd={() => setIsMapLoading(false)}
                        />
                      ) : null}
                    </View>


                    {/* Input para selecionar Data */}
                    <TouchableOpacity onPress={showDatePickerDialog} style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { color: '#000' }]}
                        value={date ? date.toLocaleDateString() : ''}
                        placeholder="Selecionar Data"
                        editable={false}
                        placeholderTextColor="#000"
                      />
                      <Icon name="event" size={20} color="#FF8C00" style={styles.icon} />
                    </TouchableOpacity>

                    {/* Input para selecionar Hora */}
                    <TouchableOpacity onPress={showTimePickerDialog} style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { color: '#000' }]}
                        value={time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        placeholder="Selecionar Hora"
                        editable={false}
                        placeholderTextColor="#000"
                      />
                      <Icon name="access-time" size={20} color="#FF8C00" style={styles.icon} />
                    </TouchableOpacity>

                    {/* Seletor de Data */}
                    {showDatePicker && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={onChangeDate}
                        minimumDate={new Date()}
                      />
                    )}

                    {/* Seletor de Hora */}
                    {showTimePicker && (
                      <DateTimePicker
                        testID="timePicker"
                        value={time}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={onChangeTime}
                      />
                    )}
                    <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={closeModal}>
                      <Text style={styles.buttonText}>Fechar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.saveButton,
                        { opacity: isCandidateAcceptedOrRejected ? 0.5 : 1 }
                      ]}
                      onPress={isCandidateAcceptedOrRejected ? null : handleSave}
                      disabled={isCandidateAcceptedOrRejected}
                    >
                      <Text style={styles.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView >

    );
  } else {
    // Se o usario for do tipo Candidato
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff' }, // Altera a cor de fundo
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Topo da pagina com a foto de perfil carregando, talvez mexerei no tamanho dela de forma geral */}
        <View style={styles.top}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../../assets/perfil.png')}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <View style={styles.greetingContainer}>
              <Text style={styles.text}>Olá, Candidato</Text>
              <Icon
                name="assignment"
                size={20}
                color="#ffff"
                style={styles.icon}
              />
            </View>
            {userData.nome && (
              <View>
                <Text style={styles.text2}>{userData.nome}</Text>
              </View>
            )}
          </View>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#ff8c00"
          />
        </View>

        {/*  Seção de informações do usuário focada no Gráfico cujo tem que ser refinado mais ainda*/}
        <View style={styles.chartContainer}>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Contagem de Entrevistas</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffa726" />
          ) : chartData.labels.length > 0 ? (
            <GestureHandlerRootView>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>
                  Solicitações de Entrevista - {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={toggleViewMode}
                >
                  <Icon
                    name={viewMode === 'days' ? 'calendar-view-month' : 'calendar-today'}
                    size={20}
                    color="#fff"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.buttonText}>
                    Visualizar por {viewMode === 'days' ? 'meses' : 'dias'}
                  </Text>
                </TouchableOpacity>

                <PanGestureHandler
                  onGestureEvent={(event) => {
                    const { translationX } = event.nativeEvent;
                    console.log('Translation X:', translationX);
                    if (Math.abs(translationX) > 50) {
                      viewMode === 'days'
                        ? (translationX > 0 ? changeMonth(-1) : changeMonth(1))
                        : (translationX > 0 ? changeYear(-1) : changeYear(1));
                    }
                  }}
                >
                  {/* Parte realmente do grafico, se mexer aqui faz uns 5 Pai nossos viu */}
                  <View style={[styles.chartWrapper, { backgroundColor: '#FFFFFF', borderRadius: 16 }]}>
                    <LineChart
                      data={chartData}
                      width={screenWidth - 32}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#FFFFFF',
                        backgroundGradientFrom: '#FFFFFF',
                        backgroundGradientTo: '#FFFFFF',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(240, 122, 38, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: "4",
                          strokeWidth: "2",
                          stroke: "#ffa726",
                        },
                        propsForBackgroundLines: {
                          strokeDasharray: "5,5",
                          stroke: "#ccc",
                        },
                        withVerticalLines: true,
                        withHorizontalLines: true,
                        fromZero: true,
                        formatYLabel: (value) => `${value}`,
                      }}
                      style={{ marginVertical: 8, borderRadius: 16 }}
                      bezier
                    />
                  </View>
                </PanGestureHandler>

                {/* Exibindo informações de texto  apenas para melhor edicao do grafico e suas funcionalidades

                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Detalhes das Entrevistas:</Text>
                  {chartData.labels.map((label, index) => (
                    <Text key={index}>
                      {label}: {chartData.datasets[0].data[index]} entrevistas
                    </Text>
                  ))}
                </View>

                */}

              </View>
            </GestureHandlerRootView>
          ) : (
            <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000' }}>Aguardando dados...</Text>
          )}
        </View>


        {/* Carregamento das últimas inscrições do candidato */}
        <Text style={[styles.text1, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Últimas Inscrições</Text>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : inscriptions.length > 0 ? (
          inscriptions.map((inscription, index) => {
            const backgroundColor = index % 2 === 0 ? '#1F1F3F' : '#F07A26';
            const borderColor = index % 2 === 0 ? '#F07A26' : '#1F1F3F';

            return (
              <Animatable.View
                key={inscription.id}
                style={[
                  styles.jobContainer,
                  {
                    backgroundColor: backgroundColor,
                    borderRadius: 8,
                    marginVertical: 8,
                    padding: 10,
                    elevation: 3,
                    borderLeftWidth: 4,
                    borderLeftColor: borderColor,
                  }
                ]}
                animation="bounceIn"
                duration={500}
              >
                <TouchableOpacity
                  style={styles.jobTitleContainer}
                  onPress={() => toggleExpand(inscription.id)}
                >
                  <Text
                    style={[
                      styles.jobTitle,
                      { color: '#FFFFFF', fontWeight: 'bold' }
                    ]}
                  >
                    {inscription.vagas.titulo}
                  </Text>
                  <Text style={[styles.arrow, { color: '#FFFFFF' }]}>
                    {expandedJobs[inscription.id] ? '▼' : '▲'}
                  </Text>
                </TouchableOpacity>
                {expandedJobs[inscription.id] && (
                  <View style={styles.jobDetails}>
                    <Text
                      style={[
                        styles.jobDescription,
                        {
                          color: '#FFFFFF',
                          borderLeftColor: borderColor,
                          borderLeftWidth: 2,
                          paddingLeft: 8,
                        },
                      ]}
                    >
                      <Icon name="description" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      {inscription.vagas.descricao}
                    </Text>

                    <Text style={styles.jobLocation}>
                      <Icon name="place" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      {`Localização: ${inscription.vagas.localizacao}`}
                    </Text>
                    <Text style={styles.jobRequirements}>
                      <Icon name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      {`Requisitos: ${inscription.vagas.requisitos}`}
                    </Text>
                    <Text style={styles.jobSalary}>
                      <Icon name="attach-money" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      {`Salário: R$ ${inscription.vagas.salario.toFixed(2)}`}
                    </Text>
                  </View>
                )}
              </Animatable.View>
            );
          })
        ) : (
          <Text style={styles.noInscriptionText}>Nenhuma inscrição encontrada.</Text>
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
                fetchInterviewCounts(userId); // Tenta recarregar os dados
              }}
            >
              <Text style={styles.buttonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    );
  }
}


export default App;