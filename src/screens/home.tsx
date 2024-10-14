import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getUserNameAndId, supabase, getInterviewCountByDate } from '../services/userService';
import * as Animatable from 'react-native-animatable';
import InterviewCountChart from './InterviewCountChart';

const App = () => {
  const [userData, setUserData] = useState({ nome: '', cnpj: null });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewCounts, setInterviewCounts] = useState([]);

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
          // Chama a função getInterviewCountByDate e armazena o resultado no estado
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

        // Chama a função fetchJobOffers aqui para buscar as vagas
        fetchJobOffers(userId);
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
            .select(`id, titulo, descricao, localizacao, requisitos, salario, data_criacao, recrutadores (nome), candidatos (nome)`)
            .eq('id_recrutador', userId)
            .limit(5);
        } else {
          // Se o usuário for candidato, buscar as vagas em que ele se inscreveu
          query = supabase
            .from('vagas')
            .select(`id, titulo, descricao, localizacao, requisitos, salario, data_criacao, recrutadores (nome), candidatos (nome)`)
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

    fetchProfile();
  }, [userType]); // Adicionando userType como dependência


  const data = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [
      {
        data: [1, 2, 3, 4, 5, 7, 9],
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Animatable.View animation="zoomIn" duration={1000} style={styles.loaderContent}>
          <ActivityIndicator size="large" color="#00008B" />
          <Text>Carregando...</Text>
        </Animatable.View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.top}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <Image
            source={require('../../assets/perfil.png')}
            style={styles.profileImage}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.text}>Olá,</Text>
          {userData.nome && (
            <Text style={styles.text2}>{userData.nome}</Text>
          )}
        </View>
        <StatusBar style="auto" />
      </View>

      <View style={styles.mid}>
        <Text style={styles.textStyle}>
          {userType === 'recrutador' ? 'Entrevistas Oferecidas' : 'Entrevistas Recebidas'}
        </Text>
        <Animatable.View animation="fadeIn" duration={1000}>
        {userType === 'recrutador' && (
                <InterviewCountChart data={interviewCounts} /> // Passando os dados de contagem para o gráfico
            )}
        </Animatable.View>
      </View>

      <Text style={styles.text1}>
        {userType === 'recrutador' ? 'Vagas Criadas Recente ' : 'Últimas Inscrições'}
      </Text>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : jobOffers.length > 0 ? (
        jobOffers.map((job) => (
          <Animatable.View
            key={job.id}
            style={styles.jobContainer}
            animation="bounceIn"
            duration={500}
          >
            <Text style={styles.jobTitle}>{job.titulo}</Text>
            <Text style={styles.jobLocation}>📍 {job.localizacao}</Text>
            <Text style={styles.jobSalary}>💰 {job.salario}</Text>
            <Text style={styles.jobRequirements}>📋 {job.requisitos}</Text>
            <Text style={styles.jobDescription}>📄 {job.descricao}</Text>
            <Text style={styles.jobDate}>🗓️ {new Date(job.data_criacao).toLocaleDateString()}</Text>
          </Animatable.View>
        ))
      ) : (
        <Text style={styles.noJobsText}>Nenhuma vaga encontrada.</Text>
      )}
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
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    color: 'black',
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
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    color: 'white',
    marginTop: 5
  },
  textStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    color: 'black',
    width: '100%',
    marginLeft: '-40%',
  }
});

export default App;
