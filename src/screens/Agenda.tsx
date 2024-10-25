import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Modal, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { ScrollView } from "react-native-gesture-handler";
import React, { useState, useEffect } from 'react';
import { getUserNameAndId, supabase } from "../services/userService";
import { styles } from "./Styles/stylesAgenda";
import MapView, { Marker } from 'react-native-maps';



export default function Agenda() {

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
  const [duration, setDuration] = useState(null);

  LocaleConfig.locales['pt'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
  };

  LocaleConfig.defaultLocale = 'pt';

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

      console.log('Dados de solicitações de entrevista:', interviewRequests); // Log dos dados

      if (error) {
        throw error;
      }

      const marked = {};
      const details = [];

      if (interviewRequests.length > 0) {
        console.log('Solicitações de entrevista encontradas:', interviewRequests);

        for (const request of interviewRequests) {
          const date = request.data_entrevista;
          const dotStyle = getDotStyle(request.status);

          marked[date] = {
            marked: true,
            dotColor: dotStyle.color,
            dotStyle: {
              borderColor: dotStyle.borderColor,
              borderWidth: dotStyle.borderWidth,
              width: dotStyle.width,
              height: dotStyle.height,
            },
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


  // Função para recarregar a página
  const onRefresh = async () => {
    try {
      await fetchProfile();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };


  const openModal = (interview) => {
    setSelectedInterview(interview);
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
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Agenda</Text>
        </View>

        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => {
            console.log('Selected day', day);
          }}
        />

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
          <Text style={styles.monthTitle}>Entrevistas a serem confirmadas</Text>
          <FlatList
            data={interviewDetails.filter(interview => interview.status.toLowerCase() === 'pendente')}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openModal(item)}>
                <View style={styles.interviewItem}>
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
                    <Text style={styles.interviewTitle}>{item.title}</Text>
                    <Text style={styles.interviewRecruiter}>
                      Empresa: {item.recruiter}
                    </Text>
                    <Text style={styles.interviewLocation}>
                      Local: {item.location}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
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
    );
  }
}
