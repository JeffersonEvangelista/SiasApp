import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Button, } from 'react-native';
import InterviewCountChart from './InterviewCountChart';
import { getUserNameAndId, supabase, getInterviewCountByDate } from '../services/userService';
import * as Animatable from 'react-native-animatable';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/FontAwesome';

const App = () => {
  const [userData, setUserData] = useState({ nome: '', cnpj: null });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewCounts, setInterviewCounts] = useState([]);
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


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { id: userId } = await getUserNameAndId();
        console.log('User ID:', userId);

        // Verificar se o usuário é recrutador
        const { data: recruiterData, error: recruiterError } = await supabase
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
          const counts = await getInterviewCountByDate(recruiterData.id);
          setInterviewCounts(counts || []);
        } else {
          // Se o usuário não for recrutador, verificar se é candidato
          const { data: candidateData, error: candidateError } = await supabase
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
          }
        }

        // Chama as funções para buscar ofertas de trabalho e candidatos
        await fetchJobOffers(userId);
        await fetchCandidates(userId);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        setError('Erro ao buscar perfil.');
      } finally {
        setLoading(false);
      }
    };

    const fetchJobOffers = async (userId) => {
      try {
        let query;

        // Se o usuário for recrutador, buscar as vagas criadas por ele
        if (userType === 'recrutador') {
          query = supabase
            .from('vagas')
            .select(`id, titulo, descricao, localizacao, requisitos, salario, data_criacao, recrutadores (nome)`)
            .eq('id_recrutador', userId)
            .limit(5);
        } else {
          // Se o usuário for candidato, buscar as vagas em que ele se inscreveu
          query = supabase
            .from('solicitacoes_entrevista')
            .select(`id_vaga, vagas (id, titulo, descricao, localizacao, requisitos, salario, data_criacao)`)
            .eq('id_candidato', userId)
            .limit(5);
        }

        const { data: jobsData, error: jobsError } = await query;

        if (jobsError) throw jobsError;

        console.log('Vagas encontradas:', jobsData);
        setJobOffers(jobsData);
      } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        setError('Erro ao buscar vagas.');
      }
    };

    const fetchCandidates = async (userId) => {
      try {
        let query;

        // Se o usuário for recrutador, buscar os candidatos inscritos nas vagas que ele criou
        if (userType === 'recrutador') {
          query = supabase
            .from('solicitacoes_entrevista')
            .select(`id, id_candidato, candidatos (id, nome, email, foto_perfil, cpf), vagas (titulo, localizacao, salario)`)
            .eq('id_recrutador', userId)
            .limit(5);
        } else {
          // Se o usuário for candidato, buscar as vagas em que ele se inscreveu
          query = supabase
            .from('solicitacoes_entrevista')
            .select(`id, id_candidato, candidatos (id, nome, email, foto_perfil, cpf), vagas (titulo, localizacao, salario)`)
            .eq('id_candidato', userId)
            .limit(5);
        }

        const { data: candidatesData, error: candidatesError } = await query;

        if (candidatesError) throw candidatesError;

        console.log('Candidatos encontrados:', candidatesData);
        setCandidates(candidatesData); // Atualiza o estado para armazenar os candidatos
      } catch (error) {
        console.error('Erro ao buscar candidatos:', error);
        setError('Erro ao buscar candidatos.');
      }
    };

    fetchProfile();
  }, [userType]);

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

  const toggleExpand = (id) => {
    setExpandedJobs((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const handleCandidateDecision = (candidateId, decision) => {
    setCandidateStatus(prevState => ({
      ...prevState,
      [candidateId]: decision, // 'accepted' ou 'rejected'
    }));
  };
  // Funções de manipulação e renderização
  const openModal = (candidate: any, jobId: any) => {
    setSelectedCandidate(candidate);
    setSelectedJobId(jobId);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCandidate(null);
    setDate(new Date());
    setTime(new Date());
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (selectedDate: any) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirmTime = (selectedTime: any) => {
    setTime(selectedTime);
    hideTimePicker();
  };
  const handleSave = async () => {
    try {
      const { id: userId } = await getUserNameAndId();
      const id_recrutador = userId;
      const id_candidato = selectedCandidate.candidatos.id;
      const id_vaga = selectedCandidate.id_vaga;
      const data_entrevista = date.toISOString().split('T')[0];
      const horario = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const local = location;
      const status = 'pendente';

      // Verificar se já existe uma solicitação para este candidato e vaga
      const existingRequestResponse = await supabase
        .from('solicitacoes_entrevista')
        .select('*')
        .eq('id_candidato', id_candidato)
        .eq('id_vaga', id_vaga)
        .single();

      if (existingRequestResponse.error) {
        console.error('Erro ao buscar solicitação existente:', existingRequestResponse.error);
        alert('Erro ao buscar solicitação existente.');
        return;
      }

      if (existingRequestResponse.data) {
        // Se a solicitação já existe, verificar o status
        if (existingRequestResponse.data.status === 'pendente') {
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
          {userType === 'recrutador' ? 'Ofertas de Trabalho Disponíveis' : 'Entrevistas Oferecidas'}
        </Text>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.chartContainer}>
          {userType === 'recrutador' && <InterviewCountChart data={interviewCounts} />}
        </Animatable.View>
      </View>

      <Text style={styles.text1}>
        {userType === 'recrutador' ? 'Vagas Criadas Recentes' : 'Últimas Inscrições'}
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
                            <Text style={styles.name}>{candidate.candidatos.nome}</Text>
                            <Text style={styles.email}>{candidate.candidatos.email}</Text>
                            <Text style={styles.cpf}>CPF: {candidate.candidatos.cpf.replace(/.(?=.{4})/g, '*')}</Text>

                            {/* Aqui adicionamos a lógica para mostrar o status */}
                            {candidate.status === 'aceito' && (
                              <Text style={styles.statusText}>✔️ Aceito</Text> // Ícone ou texto para aceito
                            )}
                            {candidate.status === 'recusado' && (
                              <Text style={styles.statusText}>❌ Recusado</Text> // Ícone ou texto para recusado
                            )}
                            {candidate.status === 'pendente' && (
                              <Text style={styles.statusText}>⏳ Pendente</Text> // Ícone ou texto para pendente
                            )}
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

};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  chartContainer: {
    height: 300,
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
  },
  jobSalary: {
    fontSize: 14,
  },
  jobRequirements: {
    fontSize: 14,
  },
  jobDescription: {
    fontSize: 14,
  },
  jobDate: {
    fontSize: 12,
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
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#555',
  },
  cpf: {
    fontSize: 14,
    color: '#555',
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
});

export default App;