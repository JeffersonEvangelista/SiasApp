// Importações do codigo 
import React, { useEffect, useState, useRef } from 'react';
import { View, SafeAreaView, FlatList, Animated, Button, RefreshControl, Text, StatusBar, StyleSheet, Image, Easing, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Dimensions, Platform, PanResponder } from 'react-native';
import { getUserNameAndId, supabase, getInterviewCountByDate, getJobInscriptions } from '../services/userService';
import * as Animatable from 'react-native-animatable';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import LottieView from 'lottie-react-native';
import MapView, { Marker } from 'react-native-maps';
import PulsingDots from '../components/PulsingDots';
import { styles } from './Styles/stylesHome';

interface Candidate {
  nome: string;
  email: string;
  foto_perfil?: string;
}


const App = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [userData, setUserData] = useState({ nome: '', cnpj: null });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState([]);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleInfo, setModalVisibleInfo] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState({});
  const [interviewCounts, setInterviewCounts] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('days');
  const screenWidth = Dimensions.get('window').width;
  const [changingMonth, setChangingMonth] = useState(false);
  const [userId, setUserId] = useState(null);
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
  const [mapLocation, setMapLocation] = useState(null);
  const [locationName, setLocationName] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [jobOffers, setJobOffers] = useState([]);
  const [jobOffersWithCandidates, setJobOffersWithCandidates] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [animatedValues, setAnimatedValues] = useState({});
  const [panResponders, setPanResponders] = useState({});
  const [feedbackVisibleByCandidate, setFeedbackVisibleByCandidate] = useState({});
  const [feedbackMessageByCandidate, setFeedbackMessageByCandidate] = useState({});

  useEffect(() => {
    const newAnimatedValues = {};
    const newPanResponders = {};
  
    jobOffersWithCandidates.forEach((job) => {
      job.inscricoes_vagas.forEach((inscricao) => {
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


  //  Função que carrega os dados do usuário
  const fetchProfile = async () => {
    try {
      const { id: userId } = await getUserNameAndId();
      console.log('User ID:', userId);
      setUserId(userId);

      // Verificar se o usuário é recrutador
      const { data: recruiterData } = await supabase
        .from('recrutadores')
        .select('id, nome, cnpj, foto_perfil')
        .eq('id', userId)
        .single();

      if (recruiterData) {
        setUserData(recruiterData);
        setUserType('recrutador');
        if (recruiterData.foto_perfil) {
          setProfileImage(recruiterData.foto_perfil);
        }
        // Chamar a função para buscar vagas e candidatos inscritos
        await fetchJobOffersWithCandidates(recruiterData.id);
      } else {
        const { data: candidateData } = await supabase
          .from('candidatos')
          .select('id, nome, foto_perfil')
          .eq('id', userId)
          .single();

        if (candidateData) {
          setUserData(candidateData);
          setUserType('candidato');
          if (candidateData.foto_perfil) {
            setProfileImage(candidateData.foto_perfil);
          }
          await fetchInscriptions(candidateData.id);
        }
      }

      await fetchJobOffers(userId);
      await fetchCandidates(userId);

      if (userType) {
        await fetchInterviewCounts(userId);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setError('Erro ao buscar perfil.');
    } finally {
      setLoading(false);
    }
  };

  //  Funções auxiliares para buscar vagas  e candidatos
  const fetchJobOffers = async (userId: any) => {
    try {
      let query;
      if (userType === 'recrutador') {
        query = supabase
          .from('vagas')
          .select(`id, titulo, descricao, localizacao, requisitos, salario, data_criacao, recrutadores (nome)`)
          .eq('id_recrutador', userId)
          .limit(5);
      } else {
        query = supabase
          .from('solicitacoes_entrevista')
          .select(`id_vaga, vagas (id, titulo, descricao, localizacao, requisitos, salario, data_criacao)`)
          .eq('id_candidato', userId)
          .limit(5);
      }

      const { data: jobsData } = await query;
      console.log('Vagas encontradas:', jobsData);
      setJobOffers(jobsData);
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      setError('Erro ao buscar vagas.');
    }
  };

  //   Funções auxiliares para buscar candidatos
  const fetchCandidates = async (userId: any) => {
    try {
      let query;
      if (userType === 'recrutador') {
        query = supabase
          .from('solicitacoes_entrevista')
          .select(`id, id_candidato, candidatos (id, nome, email, foto_perfil, cpf), vagas (id, titulo, localizacao, salario), status`)
          .eq('id_recrutador', userId)
          .limit(5);
      } else {
        query = supabase
          .from('solicitacoes_entrevista')
          .select(`id, id_candidato, candidatos (id, nome, email, foto_perfil, cpf), vagas (id, titulo, localizacao, salario), status`)
          .eq('id_candidato', userId)
          .limit(5);
      }

      const { data: candidatesData } = await query;
      console.log('Candidatos encontrados:', candidatesData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      setError('Erro ao buscar candidatos.');
    }
  };

  //    Funções auxiliares para buscar Inscrições
  const fetchInscriptions = async (candidateId: any) => {
    try {
      const inscriptions = await getJobInscriptions(candidateId);
      console.log('Inscrições carregadas:', inscriptions); // Log para verificar os dados
      setInscriptions(inscriptions);
    } catch (err) {
      setError('Erro ao carregar as inscrições: ' + err.message);
    }
  };


  const handleRecusar = async (vaga, candidato) => {
    console.log("O item foi recusado!");
    console.log("Vaga recusada:", vaga);
    console.log("Candidato recusado:", candidato);
  
    // Verifique se o ID da vaga e do candidato estão definidos
    if (!vaga || !candidato) {
      console.error("ID da vaga ou do candidato não estão definidos.");
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('inscricoes_vagas')
        .update({ status: 'recusada' }) 
        .match({ id_vaga: vaga, id_candidato: candidato }); 
  
      if (error) {
        console.error("Erro ao atualizar a vaga:", error);
        return;
      }
  
      console.log("Vaga atualizada com sucesso:", data);
      

    fetchJobOffersWithCandidates(userId); 
    } catch (err) {
      console.error("Erro ao tentar recusar candidato:", err);
    }
  };
  

  const handleAcceptCandidate = async (jobId, candidateId, userId) => {
    // Defina os detalhes da entrevista
    const dataAtual = new Date();
    const dataEntrevista = new Date(dataAtual.getTime() + 10 * 24 * 60 * 60 * 1000);
    
    const dia = dataEntrevista.getDate().toString().padStart(2, '0');
    const mes = (dataEntrevista.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataEntrevista.getFullYear();
    
    const dataEntrevistaFormatada = `${ano}-${mes}-${dia}`;    const horario = '10:00:00'; 
    const local = 'Sala de Reuniões 1'; // Local da entrevista
    
    // Verifique se o ID da vaga e do candidato estão definidos
    if (!jobId || !candidateId) {
      console.error("ID da vaga ou do candidato não estão definidos.");
      return;
    }
  
    try {
      // Atualiza o status do candidato
      const { data: updateData, error: updateError } = await supabase
        .from('inscricoes_vagas')
        .update({ status: 'aceita' }) 
        .match({ id_vaga: jobId, id_candidato: candidateId });
  
      if (updateError) {
        console.error("Erro ao atualizar a vaga:", updateError);
        return;
      }
  
      console.log("Vaga atualizada com sucesso:", updateData);
      fetchJobOffersWithCandidates(userId); 
  
      // Inserir na tabela solicitacoes_entrevista
      const { data: interviewData, error: interviewError } = await supabase
        .from('solicitacoes_entrevista')
        .insert([
          {
            id_recrutador: userId,
            id_candidato: candidateId,
            id_vaga: jobId,
            data_entrevista: dataEntrevista,
            horario: horario,
            local: local,
            status: 'pendente', 
          },
        ]);
  
      if (interviewError) {
        throw interviewError;
      }
  
      alert('Candidato aceito com sucesso!');
      console.log('Solicitação de entrevista criada com sucesso:', interviewData);
      fetchJobOffers(userId);
  
    } catch (error) {
      console.error('Erro ao processar a aceitação do candidato:', error);
      // Aqui você pode lidar com erros, como exibir uma mensagem de erro
    }
  };

  // Função para buscar vagas e candidatos inscritos
  const fetchJobOffersWithCandidates = async (userId) => {
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
          )        };
      })
  
      // Salvar as vagas e candidatos no estado
      setJobOffersWithCandidates(filteredJobOffers);
      console.log('Estado atualizado com as vagas e candidatos filtrados:', filteredJobOffers);
  
    } catch (error) {
      console.error('Erro ao buscar vagas e candidatos:', error);
      setError('Erro ao buscar vagas e candidatos.');
    }
  };
  

  const createPanResponderForCandidate = (jobId, candidateId) => {
    const animatedValue = new Animated.Value(0);
  
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderGrant: () => {
        setFeedbackVisibleByCandidate((prev) => ({
          ...prev,
          [candidateId]: true,
        }));
      },
      onPanResponderMove: (evt, gestureState) => {
        animatedValue.setValue(gestureState.dx);
  
        setFeedbackMessageByCandidate((prev) => ({
          ...prev,
          [candidateId]: gestureState.dx > 20 ? 'Aceito' : 'Recusado',
        }));
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          handleAcceptCandidate (jobId, candidateId, userId);
          Animated.spring(animatedValue, {
            toValue: 500,
            useNativeDriver: true,
          }).start(() => {
            animatedValue.setValue(0);
            setFeedbackVisibleByCandidate((prev) => ({
              ...prev,
              [candidateId]: false,
            }));
          });
        } else if (gestureState.dx < -120) {
          handleRecusar(jobId, candidateId);
          Animated.spring(animatedValue, {
            toValue: -500,
            useNativeDriver: true,
          }).start(() => {
            animatedValue.setValue(0);
            setFeedbackVisibleByCandidate((prev) => ({
              ...prev,
              [candidateId]: false,
            }));
          });
        } else {
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            setFeedbackVisibleByCandidate((prev) => ({
              ...prev,
              [candidateId]: false,
            }));
          });
        }
      },
    });
  
    return { animatedValue, panResponder };
  };

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
        setError('Sem conexão com a internet. Verifique sua conexão.');
        setShowNoConnection(true);
      } else {
        setError(null);
        setShowNoConnection(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ======================================================= Funções do Gráfico, Alterações nessa parte representam risco de porrada =====================================================

  // Função do capeta, não mexer por tudo que é mais sagrado
  const fetchInterviewCounts = async (userId) => {
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
  const renderMonthlyChart = (countsByMonth) => {
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

  //  Rederizacao do modo diario, ocorreu a separacao dos modos para uma facil manuntencao 
  const renderDailyChart = (countsByDay) => {
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
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
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
  const changeMonth = (direction) => {
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
  const changeYear = (direction) => {
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
      <View style={styles.loaderContainer}>
        <Animatable.View animation="zoomIn" duration={1000} style={styles.loaderContent}>
          <ActivityIndicator size="large" color="#F07A26" />
          <Text>Carregando...</Text>
        </Animatable.View>
      </View>
    );
  }


  // Função para selecionar a vaga e alternar a expansão
  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    toggleExpand(jobId);
    console.log('ID da vaga selecionada:', jobId);
  };

  // Função para alternar a expansão das vagas
  const toggleExpand = (jobId) => {
    setExpandedJobs(prevState => ({
      ...prevState,
      [jobId]: !prevState[jobId],
    }));
  };


  //=========================================================  Funções do modal ======================================================= 
  // Função para fechar o modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedCandidate(null);
    setLocation('');
    setDate(null);
    setTime(null);
  };

  const handleCandidatePress = (candidato) => {
    setSelectedCandidate(candidato);
    setModalVisible(true); // Abre o modal ao clicar no candidato
  };

  const handleInterviewRequest = () => {
    // Aqui você pode implementar a lógica para enviar a solicitação de entrevista
    console.log(`Solicitação de entrevista enviada para ${selectedCandidate.nome}`);
    setModalVisible(false); // Fecha o modal após enviar a solicitação
  };

  // Função para exibir o seletor de data
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  // Função para exibir o seletor de hora
  const onChangeTime = (event, selectedTime) => {
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
const openModal = async (candidate, jobId) => {
  console.log('Candidato selecionado para o modal:', candidate);
  console.log('ID da vaga:', jobId);

  setSelectedCandidate(candidate);
  setSelectedJobId(jobId);

  try {
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
    alert('Erro ao buscar informações da entrevista.');
  }
};
// Função para obter o nome do local a partir das coordenadas
const getLocationName = async (latitude, longitude) => {
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


  // Função para obter o nome do local a partir das coordenad

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
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error('Erro ao obter as coordenadas:', error);
    }
    return null; // Retorna nulo se não encontrar as coordenadas
  };


  // Handle ao mudar texto no input
  const handleInputChange = async (text) => {
    setLocation(text);

    const coords = await getCoordinatesFromLocationName(text);
    if (coords) {
      setMapLocation(coords);
      setLocationName(text); 
    } else {
      setMapLocation(null); // Limpa o marcador se o endereço não for encontrado
    }
  };

  // Função para lidar com o toque no mapa
  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setMapLocation(coordinate); // Atualiza a localização do mapa
    await getLocationName(coordinate.latitude, coordinate.longitude);
    // O nome do local já está atualizado na função getLocationName
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
        alert('Erro ao buscar solicitação existente.');
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
            alert('Solicitação de entrevista atualizada com sucesso!');
            closeModal();
          }
        } else {
          // Se o status não é 'pendente', não permitir nova solicitação
          alert('Não é possível enviar uma nova solicitação, pois já existe uma solicitação com status diferente de "pendente".');
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
          alert('Solicitação de entrevista salva com sucesso!');
          closeModal();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar solicitação de entrevista:', error);
      alert('Erro ao salvar solicitação de entrevista.');
    }
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


  // Renderização da Home para ambos os tipos de usuário
  if (userType === 'recrutador') {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
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
            <Text style={styles.text}>Olá,</Text>
            {userData.nome && <Text style={styles.text2}>{userData.nome}</Text>}
          </View>
          <StatusBar style="auto" />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.title}>Quantidade de entrevistas oferecidas</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffa726" />
          ) : chartData.labels.length > 0 ? (
            <GestureHandlerRootView>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>
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

                {/* Exibindo informações de texto apenas para melhor edição do gráfico e suas funcionalidades */}

              </View>
            </GestureHandlerRootView>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text>Aguardando dados</Text>
              {/*     <PulsingDots />    */}

            </View>
          )}
        </View>


        <Text style={styles.text1}>
  Entrevistas Agendadas
</Text>
{error ? (
  <Text style={styles.errorText}>{error.message || 'Erro desconhecido'}</Text>
) : (
  <>
    {console.log('Job Offers:', jobOffers)}
    {console.log('Candidates:', candidates)}

    {jobOffers.filter(job => candidates.some(candidate => candidate.vagas.id === job.id)).length > 0 ? (
      jobOffers
        .filter(job => candidates.some(candidate => candidate.vagas.id === job.id))
        .map((job, index) => (
          <Animatable.View
            key={job.id}
            style={[
              styles.jobContainer,
              { backgroundColor: index % 2 === 0 ? '#1F1F3F' : '#F07A26' }
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
                .filter(candidate => candidate.vagas.id === job.id)
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
                          {candidate.status === 'aceito' && <Text style={styles.statusText}>✔️ Aceito</Text>}
                          {candidate.status === 'recusado' && <Text style={styles.statusText}>❌ Recusado</Text>}
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
      <Text style={styles.noJobOffersText}>Nenhuma vaga disponível.</Text>
    )}
  </>
)}



        <Text style={styles.text1}>Suas Ofertas de Trabalho:</Text>
        {jobOffersWithCandidates.length > 0 ? (
  jobOffersWithCandidates.map((job, index) => (
    <Animatable.View
      key={job.id}
      style={[styles.jobContainer, { backgroundColor: index % 2 === 0 ? '#1F1F3F' : '#F07A26' }]}
      animation="bounceIn"
      duration={500}
    >
      <TouchableOpacity style={styles.jobTitleContainer} onPress={() => toggleExpand(job.id)}>
        <Text style={[styles.jobTitle, { color: '#FFFFFF' }]}>{job.titulo}</Text>
        <Text style={[styles.arrow, { color: '#FFFFFF' }]}>{expandedJobs[job.id] ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {expandedJobs[job.id] && (
        <View>
          <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Inscritos:</Text>
          {Array.isArray(job.inscricoes_vagas) && job.inscricoes_vagas.length > 0 ? (
            job.inscricoes_vagas.map((inscricao) => {
              const candidato = inscricao.candidatos;
              if (!candidato) {
                console.warn('Inscrição sem candidatos:', inscricao);
                return null;
              }

              const animatedValue = animatedValues[inscricao.id_candidato];
              const panResponder = panResponders[inscricao.id_candidato];
              const feedbackVisible = feedbackVisibleByCandidate[inscricao.id_candidato];
              const feedbackMessage = feedbackMessageByCandidate[inscricao.id_candidato];

              return (
                <Animated.View
                  key={inscricao.id_candidato}
                  style={[styles.candidateContainer, { transform: [{ translateX: animatedValue }] }]}
                  {...(panResponder ? panResponder.panHandlers : {})}
                >
                  <TouchableOpacity onPress={() => {
                    openModal1(candidato);
                    setFeedbackVisibleByCandidate((prev) => ({
                      ...prev,
                      [inscricao.id_candidato]: true,
                    }));
                    setFeedbackMessageByCandidate((prev) => ({
                      ...prev,
                      [inscricao.id_candidato]: 'Candidato selecionado com sucesso!',
                    }));
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {candidato.foto_perfil ? (
                        <Image source={{ uri: candidato.foto_perfil }} style={styles.photo} />
                      ) : (
                        <Image source={require('../../assets/perfil.png')} style={styles.photo} />
                      )}
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.name}>{candidato.nome || 'Nome não disponível'}</Text>
                        <Text style={styles.email}>{candidato.email || 'Email não disponível'}</Text>
                        {candidato.cpf && (
                          <Text style={styles.cpf}>CPF: {candidato.cpf.replace(/.(?=.{4})/g, '*')}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  {feedbackVisible && (
                    <View style={[styles.feedbackContainer, { alignItems: feedbackMessage === 'Aceito' ? 'flex-start' : 'flex-end' }]}>
                      <Text style={feedbackMessage === 'Aceito' ? styles.correct : styles.wrong}>
                        {feedbackMessage}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              );
            })
          ) : (
            <Text>Nenhum candidato inscrito nesta vaga.</Text>
          )}
        </View>
      )}
    </Animatable.View>
  ))
) : (
  <Text>Nenhuma vaga disponível.</Text>
)}



        <View>
          {/* Modal para informações do candidato */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {selectedCandidate && (
                  <>
                    <Text style={styles.modalTitle}>Detalhes do Candidato</Text>
                    <Text style={styles.modalText}>
                      <Text style={styles.modalLabel}>Nome: </Text>
                      {selectedCandidate.candidatos.nome || 'Nome não disponível'}
                    </Text>
                    <Text style={styles.modalText}>
                      <Text style={styles.modalLabel}>Email: </Text>
                      {selectedCandidate.candidatos.email || 'Email não disponível'}
                    </Text>


                    {/* Campo de input para digitar o local */}
                    <TextInput
                      style={{ borderColor: '#FF8C00', borderWidth: 1, height: 40, padding: 10 }}
                      placeholder="Digite o local"
                      value={location}
                      onChangeText={handleInputChange}
                      placeholderTextColor="#888"
                      selectionColor="#000"
                      underlineColorAndroid="transparent"
                    />

                    {/* Mapa para seleção do local */}
                    <View style={{ height: 300 }}>
                      <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                          latitude: -23.5505,
                          longitude: -46.6333,
                          latitudeDelta: 0.0922,
                          longitudeDelta: 0.0421,
                        }}
                        onPress={handleMapPress}
                      >
                        {mapLocation && (
                          <Marker
                            coordinate={mapLocation}
                            title={locationName}
                            description={locationName}
                          />
                        )}
                      </MapView>
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
                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                      <Text style={styles.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>

    );
  } else {
    // Se o usario for do tipo Candidato 
    return (
      <ScrollView
        contentContainerStyle={styles.container}
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
            <Text style={styles.text}>Olá,</Text>
            {userData.nome && <Text style={styles.text2}>{userData.nome}</Text>}
          </View>
          <StatusBar style="auto" />
        </View>

        {/*  Seção de informações do usuário focada no Gráfico cujo tem que ser refinado mais ainda*/}
        <View style={styles.chartContainer}>
          <Text style={styles.title}>Contagem de Entrevistas</Text>
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
            <Text>Aguardando dados...</Text>
          )}
        </View>


        {/* Carregamento das ultimas incricoes do candidato  */}
        <Text style={styles.text1}>Últimas Inscrições</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : inscriptions.length > 0 ? (
          inscriptions.map((inscription, index) => (
            <Animatable.View
              key={inscription.id}
              style={[styles.jobContainer, { backgroundColor: index % 2 === 0 ? '#1F1F3F' : '#F07A26' }]}
              animation="bounceIn"
              duration={500}
            >
              <TouchableOpacity style={styles.jobTitleContainer} onPress={() => toggleExpand(inscription.id)}>
                <Text style={[styles.jobTitle, { color: '#FFFFFF' }]}>{inscription.vagas.titulo}</Text>
                <Text style={[styles.arrow, { color: '#FFFFFF' }]}>{expandedJobs[inscription.id] ? '▼' : '▲'}</Text>
              </TouchableOpacity>
              {expandedJobs[inscription.id] && (
                <View style={styles.jobDetails}>
                  <Text style={styles.jobDescription}>
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
          ))
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