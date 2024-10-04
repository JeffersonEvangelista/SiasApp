import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getUserNameAndId, supabase } from '../services/userService';

const App = () => {
  const [userData, setUserData] = useState({ nome: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
          console.log('Dados do perfil:', profileData); // Log para ver os dados do perfil

          // Verifique se existe um caminho para a foto de perfil
          if (profileData.foto_perfil) {
            // Usar a URL da foto de perfil diretamente
            const profilePhotoUrl = profileData.foto_perfil;
            console.log('Caminho da foto de perfil:', profilePhotoUrl); // Log para verificar o caminho

            setProfileImage(profilePhotoUrl); // Armazena a URL pública no estado
            console.log('Public URL:', profilePhotoUrl); // Log para verificar a URL pública
          } else {
            console.log('Nenhuma imagem de perfil encontrada.');
          }
        }
      } catch (error) {
        console.error('Erro ao obter o ID do usuário:', error);
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
        {/* Exibe a imagem de perfil se existir */}
        {profileImage ? (
          <Image 
            source={{ uri: profileImage }} 
            style={styles.profileImage}
          />
        ) : (
          <Image 
            source={require('../../assets/perfil.png')} // Imagem padrão
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
            backgroundColor: '#ffffff', // Fundo branco do gráfico
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Cor das linhas (preto)
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Cor do texto dos rótulos (preto)
            style: {
              borderRadius: 16, // Mantém as bordas arredondadas
              borderColor: '#00008B', // Borda azul escuro
              borderWidth: 4, // Aumenta a largura da borda (ajuste conforme necessário)
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#00008B', // Cor dos pontos (azul escuro)
            },
            }}
            bezier
          style={{
            marginVertical: 8,
            borderRadius: 24, // Mantém as bordas arredondadas do gráfico
            alignSelf: 'center',
            borderColor: '#00008B', // Borda azul escuro
            borderWidth: 7, // Aumenta a largura da borda do gráfico
          }}
        />
      </View>

      <Text style={styles.text1}>Últimas Inscrições</Text>
      <View style={styles.end}>
        <Image 
          source={require('../../assets/perfil.jpg')} 
          style={styles.logo1} 
        />
        <Text style={styles.text2}>Empresa</Text>      
        <View style={styles.titleContainer}>
          <Text style={styles.text3}>Título da Vaga</Text>
          <Ionicons name="location-sharp" size={20} color="#000" style={styles.icon} />
        </View>
      </View>
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
  logo1:{
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    marginTop: -50,
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
  text2:{
    fontSize: 17,
    fontWeight: 'normal',
    textAlign: 'left',
    marginTop: -50,
  },
  text3: {
    fontSize: 19,
    fontWeight: 'normal',
    textAlign: 'left',
    marginTop: 50,
    marginLeft: -60,
  },
  mid: {
    alignItems: 'center',
    marginTop: 20,
  },
  end:{
    backgroundColor: '#c9deea',
    height: 160,
    width: '97%',
    borderWidth: 2,
    borderColor: '#c9deea',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%',
  },
  icon: {
    marginLeft: 10,
  }
});

export default App;
