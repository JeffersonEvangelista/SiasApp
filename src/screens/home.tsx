import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getUserNameAndId, supabase } from '../services/userService';

const App = () => {
  const [userData, setUserData] = useState({ nome: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [jobOffers, setJobOffers] = useState([]); // Estado para armazenar as vagas

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

        if (profileError) {
          console.error('Erro ao buscar dados do perfil:', profileError);
        } else {
          setUserData(profileData);
          console.log('Dados do perfil:', profileData);

          if (profileData.foto_perfil) {
            const profilePhotoUrl = profileData.foto_perfil;
            setProfileImage(profilePhotoUrl);
          }

          // Agora que temos o userId, podemos buscar as vagas
          fetchJobOffers(userId); // Passando o userId para a função
        }
      } catch (error) {
        console.error('Erro ao obter o ID do usuário:', error);
      }
    };

    const fetchJobOffers = async (userId) => {
      try {
        const { data: jobsData, error: jobsError } = await supabase
          .from('inscricoes')
          .select(`
            id_inscricoes,
            vagas (
              id,
              titulo,
              descricao,
              localizacao,
              requisitos,
              salario,             
              data_criacao
            )
          `)
          .eq('id_candidatos', userId)
          .limit(5);
        if (jobsError) {
          console.error('Erro ao buscar vagas:', jobsError);
        } else {
          setJobOffers(jobsData);
        }
      } catch (error) {
        console.error('Erro ao buscar vagas:', error);
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

  return (
    <View style={styles.container}>
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
      </View>

      <Text style={styles.text1}>Vagas Disponíveis</Text>
      {jobOffers.length > 0 ? (
        jobOffers.map((job) => (
          <View key={job.id_inscricoes} style={styles.jobContainer}>
            {job.vagas ? ( // Verificação se job.vagas existe
              <>
                <Text style={styles.jobTitle}>{job.vagas.titulo}</Text>
                <Text style={styles.jobCompany}>{job.vagas.id_recrutador}</Text>
                <Text style={styles.jobLocation}>{job.vagas.localizacao}</Text>
                <Text style={styles.jobSalary}>Salário: {job.vagas.salario}</Text>
                <Text style={styles.jobRequirements}>Requisitos: {job.vagas.requisitos}</Text>
                <Text style={styles.jobDescription}>Descrição: {job.vagas.descricao}</Text>
                <Text style={styles.jobDate}>Criado em: {new Date(job.vagas.data_criacao).toLocaleDateString()}</Text>
              </>
            ) : (
              <Text style={styles.jobTitle}>Vaga não disponível</Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.text1}>Nenhuma vaga encontrada.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    textAlign: 'left',
    marginTop: 10,
  },
  mid: {
    alignItems: 'center',
    marginTop: 20,
  },
  jobContainer: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#c9deea',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: '97%',
    alignSelf: 'center',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jobCompany: {
    fontSize: 16,
    color: '#333',
  },
  jobLocation: {
    fontSize: 14,
    color: '#666',
  },
  jobSalary: {
    fontSize: 14,
    color: '#666',
  },
  jobRequirements: {
    fontSize: 14,
    color: '#666',
  },
  jobDescription: {
    fontSize: 14,
    color: '#666',
  },
  jobDate: {
    fontSize: 14,
    color: '#666',
  },
});

export default App;
