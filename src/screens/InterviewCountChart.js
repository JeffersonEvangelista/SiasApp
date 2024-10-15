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
        const dateKey = itemDate.toISOString().split('T')[0];

        if (!acc[dateKey]) {
            acc[dateKey] = 0;
        }

        acc[dateKey] += item.count;

        return acc;
    }, {});

    // Obtenha as chaves únicas e ordenadas
    const uniqueDays = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

    // Crie um array para armazenar as contagens
    const countsArray = uniqueDays.map(date => groupedData[date] || 0);

    // Prepare os dados do gráfico usando o array de contagens
    const chartData = {
        labels: uniqueDays,
        datasets: [{
            data: countsArray, // Use o array de contagens aqui
            color: () => `rgba(240, 122, 38, 1)`,
            strokeWidth: 1,
        }],
    };

    const [changingMonth, setChangingMonth] = useState(false);

    const changeMonth = (direction) => {
        if (!changingMonth) {
            setChangingMonth(true);
            const newDate = new Date(currentDate);
            newDate.setMonth(currentDate.getMonth() + direction);
            setCurrentDate(newDate);
            setTimeout(() => {
                setChangingMonth(false);
            }, 500);
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
                                yAxisLabel: '', // Remover o rótulo do eixo Y
                                yAxisSuffix: '', // Remover o sufixo do eixo Y
                                yAxisInterval: null, // Remover os intervalos do eixo Y
                                formatYLabel: () => '', // Remover os valores do eixo Y
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
                                    strokeDasharray: "5,5", // Linhas horizontais pontilhadas
                                    stroke: "#ccc", // Cor das linhas horizontais
                                },
                                // Esta parte garante que o eixo Y não seja visível
                                withVerticalLines: false, // Para não mostrar linhas verticais
                                withHorizontalLines: false, // Para não mostrar linhas horizontais
                                // Remover linhas do eixo Y
                                fromZero: true, // Começar do zero no eixo Y
                                // Para garantir que o gráfico não mostre valores no eixo Y
                                hideYAxis: true,
                                hideLegend: true, // Se você não quiser a legenda do gráfico
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                            bezier
                            hidePointsAtIndex={[]} // Remover as legendas dos valores do lado esquerdo
                        />
                        <Text style={{ position: 'absolute', top: 10, left: 10, fontSize: 12 }}>
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                </PanGestureHandler>
            </View>
        </GestureHandlerRootView>
    );
};

export default InterviewCountChart;
