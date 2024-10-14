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

    // Agrupa os dados por data completa, somando as ocorrências
    const groupedData = filteredData.reduce((acc, item) => {
        const itemDate = new Date(item.data_criacao);
        // Use a data completa no formato YYYY-MM-DD
        const dateKey = itemDate.toISOString().split('T')[0];

        // Se a data não existir no objeto, inicialize com 0
        if (!acc[dateKey]) {
            acc[dateKey] = 0;
        }

        // Some a contagem de entrevistas para aquela data
        acc[dateKey] += item.count; 

        return acc;
    }, {});

    // Obtenha as chaves únicas e ordenadas
    const uniqueDays = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

    // Prepare os dados do gráfico
    const chartData = {
        labels: uniqueDays,
        datasets: [{
            data: uniqueDays.map(day => groupedData[day]),
            color: () => `rgba(240, 122, 38, 1)`,
            strokeWidth: 1,
        }],
    };

    // Obter os valores únicos e ordenados para o eixo Y
    const uniqueYValues = [...new Set(chartData.datasets[0].data)].sort((a, b) => a - b);

    const [changingMonth, setChangingMonth] = useState(false);

    const changeMonth = (direction) => {
        if (!changingMonth) {
            setChangingMonth(true);
            const newDate = new Date(currentDate);
            newDate.setMonth(currentDate.getMonth() + direction);
            setCurrentDate(newDate);
            setTimeout(() => {
                setChangingMonth(false);
            }, 500); // tempo de espera para evitar mudanças rápidas
        }
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
                        if (Math.abs(translationX) > 50) {
                            if (translationX > 0) {
                                changeMonth(-1); // Mês anterior
                            } else {
                                changeMonth(1); // Próximo mês
                            }
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
                                yAxisInterval: 1,
                                yAxisSuffix: '',
                                yLabelsOffset: 10,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForLabels: {
                                    labelStyle: { transform: [{ translateX: -10 }] },
                                },
                                propsForDots: {
                                    r: "4",
                                    strokeWidth: "2",
                                    stroke: "#ffa726",
                                },
                                propsForBackgroundLines: {
                                    strokeDasharray: "0", // remove linhas horizontais extras
                                },
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                            yAxisLabel=""
                            bezier
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
