import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getUserNameAndId, supabase } from '../services/userService';
import * as Animatable from 'react-native-animatable';

const App = () => {
  const [userData, setUserData] = useState({ nome: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { id: userId } = await getUserNameAndId();
        console.log('User ID:', userId);

        // Buscar dados do usuário no banco de dados
        const { data: profileData, error: profileError } = await supabase
          .from('candidatos')
          .select('nome, foto_perfil')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        setUserData(profileData);
        console.log('Dados do perfil:', profileData);

        if (profileData.foto_perfil) {
          setProfileImage(profileData.foto_perfil);
        }

        // Buscar vagas após obter o perfil do usuário
        await fetchJobOffers(userId);
      } catch (error) {
        console.error('Erro ao buscar perfil e vagas:', error);
        setError('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    const fetchJobOffers = async (userId) => {
      try {
        // Buscar vagas associadas ao candidato
        const { data: jobsData, error: jobsError } = await supabase
          .from('vagas')
          .select(`
            id,
            titulo,
            descricao,
            localizacao,
            requisitos,
            salario,
            data_criacao,
            recrutadores (
              nome
            )
          `)
          .eq('id_candidato', userId)
          .limit(5);

        if (jobsError) throw jobsError;

        console.log('Vagas encontradas:', jobsData);
        setJobOffers(jobsData);
      } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        setError('Erro ao buscar vagas.');
      }
    };

    fetchProfile();
  }, []);

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
            <Text style={styles.text1}>{userData.nome}</Text>
          )}
        </View>
        <StatusBar style="auto" />
      </View>

      <View style={styles.mid}>
        <Text style={styles.text1}>Entrevistas Oferecidas</Text>
        <Animatable.View animation="fadeIn" duration={1000}>
          <LineChart
            data={data}
            width={350}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
                borderColor: '#00008B',
                borderWidth: 4,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#00008B',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 24,
              alignSelf: 'center',
              borderColor: '#00008B',
              borderWidth: 7,
            }}
          />
        </Animatable.View>
      </View>

      <Text style={styles.text1}>Últimas Inscrições</Text>
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
            {job.recrutadores && job.recrutadores.length > 0 && job.recrutadores[0].nome && (
              <Text style={styles.jobCompany}>Recrutador: {job.recrutadores[0].nome}</Text>
            )}
            <Text style={styles.jobLocation}>📍 {job.localizacao}</Text>
            <Text style={styles.jobSalary}>💰 {job.salario}</Text>
            <Text style={styles.jobRequirements}>📋 {job.requisitos}</Text>
            <Text style={styles.jobDescription}>📄 {job.descricao}</Text>
            <Text style={styles.jobDate}>📅 Criado em: {new Date(job.data_criacao).toLocaleDateString()}</Text>
          </Animatable.View>
        ))
      ) : (
        <Animatable.View 
          style={styles.noJobsContainer} 
          animation="fadeIn" 
          duration={1000}
        >
          <Animatable.Text 
            style={styles.noJobsText} 
            animation="pulse" 
            iterationCount="infinite" 
            duration={1000}
          >
            Nenhuma inscrição encontrada.
          </Animatable.Text>
          <Text style={styles.forte}> Continue se inscrevendo! O sucesso vem para quem insiste!</Text>
          <Image 
            source={require('../../assets/triste.png')} 
            style={styles.noJobsImage}
          />
        </Animatable.View>
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
    width: '97%',
    borderWidth: 2,
    borderColor: '#ffa600',
    borderRadius: 20,
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
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  text1: {
    fontSize: 20,
    fontWeight: 'normal',
    textAlign: 'center',
    marginTop: 10,
  },
  forte:{
    fontSize: 15,
    fontWeight: 'normal',
    textAlign: 'center',
    marginTop: 10,
  },
  mid: {
    alignItems: 'center',
  },
  jobContainer: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: '90%',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jobCompany: {
    fontSize: 16,
    color: '#00008B',
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
    color: 'grey',
  },
  noJobsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  noJobsImage: {
    width: 50,
    height: 50,
    marginTop: 20, // Adicionando margem superior para espaçamento
  },
  noJobsText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color:'red',
    marginTop: 30,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default App;
