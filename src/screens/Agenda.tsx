import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Modal, FlatList, Animated, PanResponder } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { ScrollView } from "react-native-gesture-handler";
import React, { useState, useEffect, useRef } from 'react';
import { getUserNameAndId, supabase, countSolicitacoes } from "../services/userService";
import { styles } from "./Styles/stylesAgenda";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import AppState from '../components/globalVars';
import { Swipeable } from 'react-native-gesture-handler';



export default function Agenda() {
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


  // Função que carrega os dados do usuário
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
        setUserType('recrutador');
      } else {
        const { data: candidateData } = await supabase
          .from('candidatos')
          .select('id, nome, foto_perfil')
          .eq('id', userId)
          .single();

        if (candidateData) {
          setUserType('candidato');
          handleCandidateProfile(candidateData.id);
          const solicitacoesCount = await countSolicitacoes(userId) || 0;
          AppState.solicitacoesCount = solicitacoesCount;
        }
      }

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
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
          nome
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

          // Adiciona detalhes da entrevista ao array
          details.push({
            id: request.id, // Adicione um ID único para o item
            title: request.vagas.titulo,
            recruiter: request.vagas.recrutadores.nome,
            date: request.data_entrevista,
            time: request.horario,
            location: request.local,
            status: request.status,
            coordinates: coordinates, // Adiciona as coordenadas
          });

          console.log(`Entrevista para a vaga: ${request.vagas.titulo} com o recrutador: ${request.vagas.recrutadores.nome}`);
          console.log(`Data: ${request.data_entrevista}, Horário: ${request.horario}, Local: ${request.local}, Status: ${request.status}`);
        }

        setInterviewDetails(details); // Atualiza o estado com os detalhes das entrevistas
        setMarkedDates(marked);
      } else {
        console.log('Nenhuma solicitação de entrevista encontrada para este candidato.');
      }

    } catch (error) {
      console.error('Erro ao buscar solicitações de entrevista:', error);
    }
  };


  // Função para dar animação na questão da entrevista
  const createPanResponderForInterview = (animatedValue, interview, userId) => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        animatedValue.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          handleAcceptCandidate(interview, userId); // Passando userId aqui
          Animated.spring(animatedValue, {
            toValue: 500,
            useNativeDriver: true,
          }).start(() => {
            animatedValue.setValue(0);
          });
        } else if (gestureState.dx < -120) {
          handleRecusar(interview, userId); // Passando userId aqui
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
  };

  // Função para aceitar o entrevista
  const handleAcceptCandidate = async (interview, userId) => {
    console.log('Candidate ID:', userId);
    try {


      console.log(`Candidato aceito:`, interview);



      // Atualizar o status da solicitação de entrevista
      const { error: updateError } = await supabase
        .from('solicitacoes_entrevista')
        .update({ status: 'aceita' })
        .eq('id', interview.id);

      if (updateError) {
        console.error('Erro ao atualizar status da entrevista:', updateError);
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
          fetchProfile()
        }
      } else {
        console.log('Já existe uma resposta para essa solicitação e candidato.');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  // Função para recusar a entrevista
  const handleRecusar = async (interview, userId) => {
    try {
      console.log(`Candidato recusado:`, interview);

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
          fetchProfile()
        }
      } else {
        console.log('Já existe uma resposta para essa solicitação e candidato.');
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


  // Renderização da Home para ambos os tipos de usuário
  if (userType === 'recrutador') {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Aqui pode ser adicionado o conteúdo para recrutadores */}
      </ScrollView>
    );
  } else {
    return (
      <View style={{ flex: 1 }}>
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
          {renderCalendar()}



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
                <Text style={styles.legendText}>Pendente</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#009e23' }]} />
                <Text style={styles.legendText}>Aceita</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#a30000' }]} />
                <Text style={styles.legendText}>Recusada</Text>
              </View>
            </View>
          )}
          <View style={styles.interviewListContainer}>
            {/* Seção para entrevistas pendentes */}
            <Text style={styles.monthTitle}>Entrevistas a serem confirmadas</Text>
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
              <Text style={styles.noInterviewsMessage}>Nenhuma entrevista pendente.</Text>
            )}




            {/* Seção para entrevistas aceitas */}
            <Text style={styles.monthTitle}>Entrevistas aceitas</Text>
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
              <Text style={styles.noInterviewsMessage}>Nenhuma entrevista aceita.</Text>
            )}

            {/* Seção para entrevistas recusadas */}
            <Text style={styles.monthTitle}>Entrevistas recusadas</Text>
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
              <Text style={styles.noInterviewsMessage}>Nenhuma entrevista recusada.</Text>
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
                  <Text style={styles.modalTitle}>Detalhes da Entrevista</Text>
                  <Text style={styles.modalText}>Empresa: {selectedInterview.recruiter}</Text>
                  <Text style={styles.modalText}>Data: {new Date(selectedInterview.date).toLocaleDateString('pt-BR')}</Text>
                  <Text style={styles.modalText}>Horário: {selectedInterview.time}</Text>
                  <Text style={styles.modalText}>Status: {selectedInterview.status}</Text>

                  {selectedInterview.coordinates ? (
                    <MapView
                      style={styles.map}
                      initialRegion={{
                        latitude: selectedInterview.coordinates.latitude,
                        longitude: selectedInterview.coordinates.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                      }}
                    >
                      <Marker
                        coordinate={{
                          latitude: selectedInterview.coordinates.latitude,
                          longitude: selectedInterview.coordinates.longitude,
                        }}
                        title={selectedInterview.recruiter}
                        description={`Entrevista: ${selectedInterview.title}`}
                      />
                    </MapView>
                  ) : (
                    <Text style={styles.modalText}>Localização não disponível.</Text>
                  )}

                  {distance !== undefined ? (
                    <Text style={styles.modalText}>
                      Distância da vaga: {(distance / 1000).toFixed(2)} km
                    </Text>
                  ) : (
                    <Text style={styles.modalText}>
                      Distância da vaga: Indisponível
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.buttonClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </View>

    );
  }
}