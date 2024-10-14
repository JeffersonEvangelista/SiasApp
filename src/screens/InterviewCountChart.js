import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const screenWidth = Dimensions.get('window').width;

const InterviewCountChart = ({ data }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    if (!data) {
        return <Text>Carregando dados...</Text>;
    }

    if (data.length === 0) {
        return <Text>Nenhuma solicitação de entrevista encontrada.</Text>;
    }

    // Filtra os dados para o mês e ano atuais
    const filterDataByMonth = (data, date) => {
        const month = date.getMonth();
        const year = date.getFullYear();
        return data.filter(item => {
            const itemDate = new Date(item.data_criacao);
            return itemDate.getMonth() === month && itemDate.getFullYear() === year;
        });
    };

    const filteredData = filterDataByMonth(data, currentDate);

    // Agrupa os dados por dia, somando as ocorrências
    const groupedData = filteredData.reduce((acc, item) => {
        const itemDate = new Date(item.data_criacao);
        const day = itemDate.getUTCDate(); // Usa getUTCDate() para evitar problemas de fuso horário
        acc[day] = (acc[day] || 0) + item.count; // Soma a quantidade de entrevistas no dia
        return acc;
    }, {});

    // Ordena os dias para que sejam exibidos em ordem
    const uniqueDays = Object.keys(groupedData).sort((a, b) => a - b);

    // Prepara os labels e os valores para o gráfico
    const chartData = {
        labels: uniqueDays.map(day => day.toString()),
        datasets: [{
            data: uniqueDays.map(day => groupedData[day]),
            color: () => `rgba(240, 122, 38, 1)`,
            strokeWidth: 2,
        }],
    };

    // Função para mudar o mês ao deslizar
    const changeMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    return (
        <GestureHandlerRootView>
            <View>
                <Text style={{ fontSize: 15, marginBottom: 10 }}>
                    Solicitações de Entrevista - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
                <PanGestureHandler
                    onGestureEvent={(event) => {
                        const { translationX } = event.nativeEvent;
                        if (translationX > 50) {
                            changeMonth(-1); // Mês anterior
                        } else if (translationX < -50) {
                            changeMonth(1); // Próximo mês
                        }
                    }}
                >
                    <View style={{ borderColor: '#1F1F3F', borderWidth: 5, borderRadius: 16, overflow: 'hidden' }}>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 16}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(240, 122, 38, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                        />
                        <Text style={{ position: 'absolute', left: '50%', top: '90%', transform: [{ translateX: -50 }] }}>Dias do Mês</Text>
                        <Text style={{ position: 'absolute', left: '1%', top: '20%', transform: [{ translateY: -50 }] }}>Contagem de Entrevistas</Text>
                    </View>
                </PanGestureHandler>
            </View>
        </GestureHandlerRootView>
    );
};

export default InterviewCountChart;