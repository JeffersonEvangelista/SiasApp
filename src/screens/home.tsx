// Importações do codigo 
import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Dimensions } from 'react-native';
import { getUserNameAndId, supabase, getInterviewCountByDate, getJobInscriptions } from '../services/userService';
import * as Animatable from 'react-native-animatable';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';


const App = () => {
  //  Estados / Variáveis do código
  const [userData, setUserData] = useState({ nome: '', cnpj: null });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState([]);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
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

  //  Funções automáticas do código
  useEffect(() => {

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
    const fetchJobOffers = async (userId) => {
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
    const fetchCandidates = async (userId) => {
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
    const fetchInscriptions = async (candidateId) => {
      try {
        const inscriptions = await getJobInscriptions(candidateId);
        setInscriptions(inscriptions);
      } catch (err) {
        setError('Erro ao carregar as inscrições: ' + err.message);
      }
    };

    fetchProfile();
  }, [userType, currentDate]);

  // Função do capeta, não mexer por tudo que é mais sagrado
  const fetchInterviewCounts = async (userId) => {
    try {
      setIsLoading(true); // Ativa o loader

      // Extrai o mês e o ano da data atual
      const currentMonth = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Define a data de início e fim com base no modo de visualização
      let startDate, endDate;

      if (viewMode === 'months') {
        // Modo de meses: busca entrevistas de todos os meses do ano
        startDate = `${year}-01-01`; // Início do ano
        endDate = `${year}-12-31`; // Fim do ano
      } else {
        // Modo de dias: busca entrevistas apenas para o mês atual
        const lastDayOfMonth = new Date(year, currentMonth, 0).getDate();
        startDate = `${year}-${currentMonth.toString().padStart(2, '0')}-01`;
        endDate = `${year}-${currentMonth.toString().padStart(2, '0')}-${lastDayOfMonth}`;
      }

      // Realiza a consulta ao Supabase
      const { data: countsData, error } = await supabase
        .from('solicitacoes_entrevista')
        .select('data_entrevista')
        .eq(userType === 'recrutador' ? 'id_recrutador' : 'id_candidato', userId)
        .gte('data_entrevista', startDate)
        .lte('data_entrevista', endDate)
        .order('data_entrevista', { ascending: true });

      if (error) {
        console.error('Erro na consulta ao Supabase:', error.message);
        setError('Erro ao buscar contagens de entrevistas.');
        return;
      }

      // Inicializa o objeto para armazenar as contagens
      const countsByDate = {};

      if (countsData && countsData.length > 0) {
        // Processa os dados de contagem de entrevistas e formata-os para exibição
        countsData.forEach((interview) => {
          const date = new Date(interview.data_entrevista);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const yearString = date.getFullYear();

          if (viewMode === 'days') {
            // Agrupando por dia no formato DD-MM
            const day = date.getDate().toString().padStart(2, '0');
            const dayMonth = `${day}-${month}`;
            countsByDate[dayMonth] = (countsByDate[dayMonth] || 0) + 1; // Incrementa a contagem por dia
          } else {
            // Agrupando por mês
            const yearMonth = `${month}-${yearString}`;
            countsByDate[yearMonth] = (countsByDate[yearMonth] || 0) + 1; // Incrementa a contagem por mês
          }
        });
      }

      // Prepara os dados para o gráfico
      const labels = Object.keys(countsByDate);
      const dataCounts = Object.values(countsByDate);

      // Se não houver dados, inicializa o gráfico com zero, caso o modo seja 'months'
      if (viewMode === 'months' && labels.length === 0) {
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
        // Cria os dados do gráfico com os dias ou meses e suas contagens
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
    } catch (error) {
      console.error('Erro ao buscar contagens de entrevistas:', error);
      setError('Erro ao buscar contagens de entrevistas.');
    } finally {
      setIsLoading(false); // Desativa o loader
    }
  };

  // Função para alternar entre os modos de visualização
  const toggleViewMode = () => {
    const newViewMode = viewMode === 'days' ? 'months' : 'days';
    setViewMode(newViewMode);
    fetchInterviewCounts(userId);
  };

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
  //  Função para fechar o modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedCandidate(null);
    setLocation('');
    setDate(null);
    setTime(null);
  };

  // Função para abrir o calendário 
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  // Função para fechar o calendário
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  //  Função para selecionar a data
  const handleConfirmDate = (date) => {
    setDate(date);
    hideDatePicker();
  };

  //  Função para selecionar a hora
  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  //  Função para fechar a hora
  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  //   Função para selecionar a hora
  const handleConfirmTime = (time: any) => {
    setTime(time);
    hideTimePicker();
  };

  // Função para abri o modal
  const openModal = (candidate: any, jobId: any) => {
    setSelectedCandidate(candidate);
    setSelectedJobId(jobId);
    setModalVisible(true);
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

  // Renderização da Home para ambos os tipos de usuário
  if (userType === 'recrutador') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.top}>
          {userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
          ) : (
            <Image source={require('../../assets/perfil.png')} style={styles.profileImage} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.text}>Olá,</Text>
            {userData.nome && <Text style={styles.text2}>{userData.nome}</Text>}
          </View>
          <StatusBar style="auto" />
        </View>

        <View style={styles.mid}>
          <Text style={styles.text1}>
            Entrevistas Oferecidas
          </Text>
          <Animatable.View animation="fadeIn" duration={1000} style={styles.chartContainer}>
            {/* Aqui você pode adicionar o conteúdo do gráfico */}
          </Animatable.View>
        </View>

        <Text style={styles.text1}>
          Vagas Criadas Recentes
        </Text>


        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : jobOffers.length > 0 ? (
          jobOffers.map((job, index) => (
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
                candidates.length > 0 ? (
                  [...new Map(candidates.map(candidate => [candidate.candidatos.id, candidate])).values()]
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
                              {/* Aqui adicionamos a lógica para mostrar o status */}
                              {candidate.status === 'aceito' && (
                                <Text style={styles.statusText}>✔️ Aceito</Text>
                              )}
                              {candidate.status === 'recusado' && (
                                <Text style={styles.statusText}>❌ Recusado</Text>
                              )}
                              {candidate.status === 'pendente' && (
                                <Text style={styles.statusText}>⏳ Pendente</Text>
                              )}
                              <Text style={styles.name}>{candidate.candidatos.nome}</Text>
                              <Text style={styles.email}>{candidate.candidatos.email}</Text>
                              <Text style={styles.cpf}>CPF: {candidate.candidatos.cpf.replace(/.(?=.{4})/g, '*')}</Text>
                            </View>
                          </View>

                        </TouchableOpacity>
                      </View>
                    ))
                ) : (
                  <Text style={styles.noCandidatesText}>Nenhum candidato inscrito.</Text>
                )
              )}
            </Animatable.View>
          ))
        ) : (
          <Text style={styles.noJobOffersText}>Nenhuma vaga disponível.</Text>
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

                    <TextInput
                      style={{ borderColor: '#FF8C00', borderWidth: 1, height: 40, padding: 10 }}
                      placeholder="Digite o local"
                      value={location}
                      onChangeText={(text) => setLocation(text)}
                      placeholderTextColor="#888"
                      selectionColor="#000"
                      underlineColorAndroid="transparent"
                    />
                    {/* Input para selecionar Data */}
                    <TouchableOpacity onPress={showDatePicker} style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { color: '#000' }]}
                        value={date ? date.toLocaleDateString() : ''}
                        placeholder="Selecionar Data"
                        editable={false}
                        placeholderTextColor="#000"
                      />
                      <Icon name="calendar" size={20} color="#FF8C00" style={styles.icon} />
                    </TouchableOpacity>

                    {/* Input para selecionar Hora */}
                    <TouchableOpacity onPress={showTimePicker} style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { color: '#000' }]}
                        value={time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        placeholder="Selecionar Hora"
                        editable={false}
                        placeholderTextColor="#000"
                      />
                      <Icon name="clock-o" size={20} color="#FF8C00" style={styles.icon} />
                    </TouchableOpacity>
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

          {/* Seletor de Data */}
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            minimumDate={new Date()} // Restringe a seleção de datas passadas
          />

          {/* Seletor de Hora */}
          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={handleConfirmTime}
            onCancel={hideTimePicker}
          />
        </View>

      </ScrollView>

    );
  } else {
    // Se o usario for do tipo Candidato 
    return (
      <ScrollView contentContainerStyle={styles.container}>
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
                  onPress={() => {
                    const newViewMode = viewMode === 'days' ? 'months' : 'days';
                    setViewMode(newViewMode);
                    fetchInterviewCounts(userId);
                  }}
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
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  chartContainer: {
    height: 330,
    marginBottom: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loaderContent: {
    alignItems: 'center',
  },
  top: {
    backgroundColor: '#ff8c00',
    height: 160,
    width: '100%',
    borderWidth: 2,
    borderColor: '#ff8c00',
    borderRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    paddingHorizontal: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    color: 'white',
    marginTop: 5
  },
  text1: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    color: 'black',
  },
  jobTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mid: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  jobContainer: {
    width: '95%',
    borderBottomColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
    marginTop: '4%',

  },
  jobTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  jobCompany: {
    fontSize: 14,
    color: 'gray',
  },
  jobLocation: {
    fontSize: 14,
    color: '#fff',
    marginLeft: '2%',

    padding: 5,
  },
  jobSalary: {
    fontSize: 14,
    color: '#fff',
    marginLeft: '2%',

    padding: 5,
  },
  jobRequirements: {
    fontSize: 14,
    color: '#fff',
    marginLeft: '2%',

    padding: 5,
  },
  jobDescription: {
    fontSize: 14,
    color: '#fff',
    marginLeft: '2%',
    padding: 5,
  },
  jobDate: {
    fontSize: 12,
    padding: 5,
    marginLeft: '2%',

    color: 'gray',
  },
  noJobsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  noJobsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
    marginTop: 50,
  },
  forte: {
    fontWeight: 'bold',
  },
  noJobsImage: {
    width: 50,
    height: 50,
    marginTop: 10,
  },
  text2: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    color: 'white',
    marginTop: 5
  },
  candidateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  candidateDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  cpf: {
    fontSize: 12,
    color: '#666',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    position: 'absolute',
    right: 10,
    top: 10,
  },
  noCandidatesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#F07A26',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 5,
  },
  modalLabel: {
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 5,
    marginVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#FF8C00',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#888',
  },
  iconMargin: {
    marginRight: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

});

export default App;