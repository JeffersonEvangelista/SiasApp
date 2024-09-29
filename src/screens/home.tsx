import React from 'react';
import { View, Text, StatusBar, StyleSheet, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit'; // Importando o gráfico
import Ionicons from 'react-native-vector-icons/Ionicons';


const App = () => {
  const userData = { email: "Marai@gmail.com" }; // Exemplo de dados do usuário
  
  const data = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'], // Labels do gráfico
    datasets: [
      {
        data: [1, 2, 3, 4, 5, 7, 9], // Dados a serem plotados
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        {/* Adicionando a logo */}
        <Image 
          source={{ uri: 'https://via.placeholder.com/50' }} 
          style={styles.logo} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.text}>Olá</Text>
          {userData ? ( 
            <Text style={styles.text1}>{userData.email}</Text>
          ) : null}
        </View>
        <StatusBar style="auto" />
      </View>
      
      <View style={styles.mid}>
        <Text style={styles.text1}>Entrevistas Oferecidas</Text>
        {/* Adicionando o gráfico abaixo da view amarela */}
        <LineChart
          data={data}
          width={350} // Largura do gráfico
          height={220} // Altura do gráfico
          yAxisLabel="" // Prefixo do eixo Y
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 0, // Número de casas decimais
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          bezier // Curvas suavizadas
          style={{
            marginVertical: 8,
            borderRadius: 16,
            alignSelf: 'center', // Centraliza horizontalmente
          }}
        />
      </View>

      <Text style={styles.text1}>Ultimas Inscrições</Text>
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
    justifyContent: 'flex-start', // Mantenha o conteúdo no topo
  },
  top: {
    backgroundColor: '#ffa600', // Cor de fundo da caixa
    height: 160, // Altura da caixa
    width: '97%', // Largura da caixa (ajustável conforme necessário)
    borderWidth: 2, // Largura da borda
    borderColor: '#ffa600', // Cor da borda
    borderRadius: 20, // Bordas arredondadas
    flexDirection: 'row', // Organiza os filhos em linha
    alignItems: 'center', // Centraliza verticalmente
    marginTop: 10, // Espaçamento do topo da tela
    paddingHorizontal: 15, // Espaçamento interno horizontal
  },
  logo: {
    width: 50, // Largura da logo
    height: 50, // Altura da logo
    borderRadius: 25, // Torna a logo redonda
    marginRight: 10, // Espaço entre a logo e os textos
    
  },
  logo1:{
    width: 50, // Largura da logo
    height: 50, // Altura da logo
    borderRadius: 25, // Torna a logo redonda
    marginRight: 10, // Espaço entre a logo e os textos
    marginTop: -50, // Ajuste para subir a logo
  },
  textContainer: {
    justifyContent: 'center', // Centraliza os textos verticalmente
  },
  text: {
    fontSize: 14, // Tamanho do texto menor
    fontWeight: 'bold', // Negrito
    textAlign: 'left', // Alinha o texto à esquerda
  },
  text1: {
    fontSize: 19, // Tamanho do texto menor
    fontWeight: 'normal', // Normal
    textAlign: 'left', // Alinha o texto à esquerda
    marginTop: 10, // Adiciona espaço acima do texto para separá-lo do gráfico
  },
  text2:{
    fontSize: 17, // Tamanho do texto menor
    fontWeight: 'normal', // Normal
    textAlign: 'left', // Alinha o texto à esquerda
    marginTop: -50, // Ajuste para subir a logo
  },
  text3: {
    fontSize: 19, // Tamanho do texto
    fontWeight: 'normal', // Normal
    textAlign: 'left', // Alinha o texto à esquerda
    marginTop: 50, // Espaço acima do texto
    marginLeft: -60, // Ajuste a margem esquerda para mover o texto para a esquerda
  },
  mid: {
    alignItems: 'center', // Centraliza o conteúdo da seção do meio
    marginTop: 20, // Espaço entre a view amarela e o conteúdo do meio
  },
  end:{
    backgroundColor: '#ffa600', // Cor de fundo da caixa
    height: 160, // Altura da caixa
    width: '97%', // Largura da caixa (ajustável conforme necessário)
    borderWidth: 2, // Largura da borda
    borderColor: '#ffa600', // Cor da borda
    borderRadius: 20, // Bordas arredondadas
    flexDirection: 'row', // Organiza os filhos em linha
    alignItems: 'center', // Centraliza verticalmente
    marginTop: 10, // Espaçamento do topo da tela
    paddingHorizontal: 15, // Espaçamento interno horizontal
  },
  titleContainer: {
    flexDirection: 'row', // Alinha os itens horizontalmente
    justifyContent: 'space-between', // Espaça o texto e o ícone
    alignItems: 'center', // Centraliza verticalmente
    width: '60%', // Ocupa toda a largura da view pai
  },
  icon: {
    marginRight: 1, // Espaçamento entre o ícone e a borda direita
    marginTop: -60, // Ajuste para subir a logo
  },
  
});

export default App;
