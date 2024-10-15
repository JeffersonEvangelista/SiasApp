import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

const InterviewCountChart = ({ data }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('days'); // 'days' or 'months'
    const [changingMonth, setChangingMonth] = useState(false);

    if (!data) {
        return <Text>Carregando dados...</Text>;
    }

    // Filtra os dados para o mês e ano atuais ou o ano atual, dependendo do modo de visualização
    const filterData = (data, date, viewMode) => {
        const month = date.getMonth();
        const year = date.getFullYear();

        return data.filter(item => {
            const itemDate = new Date(item.data_criacao);
            if (viewMode === 'days') {
                return itemDate.getMonth() === month && itemDate.getFullYear() === year;
            } else {
                return itemDate.getFullYear() === year;
            }
        });
    };

    const filteredData = filterData(data, currentDate, viewMode);

    // Agrupa os dados por data (dia completo ou mês)
    const groupedData = filteredData.reduce((acc, item) => {
        const itemDate = new Date(item.data_criacao);
        const dateKey = viewMode === 'days'
            ? itemDate.toLocaleDateString('pt-BR') // Formato DD/MM/AAAA para o Brasil
            : `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}`; // Agrupa por mês

        // Se a data não estiver no acumulador, inicialize com 0
        if (!acc[dateKey]) {
            acc[dateKey] = 0;
        }

        // Verifique se o item.count está definido e some à contagem
        if (item.count) {
            acc[dateKey] += item.count; // Adiciona a contagem para o dia/mês
        }
        return acc;
    }, {});

    // Obtenha as chaves únicas e ordenadas
    const uniqueDaysOrMonths = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

    // Crie um array para armazenar as contagens
    const countsArray = uniqueDaysOrMonths.map(date => groupedData[date]);

    // Prepare os dados do gráfico e formate as etiquetas de acordo com o modo de visualização
    const chartData = {
        labels: uniqueDaysOrMonths.map(date => {
            if (viewMode === 'days') {
                // Extrai apenas o número do dia para visualização por dias
                const [day] = date.split('/');
                return day;
            } else {
                // Mostra o mês/ano para visualização por meses
                return date;
            }
        }),
        datasets: [{
            data: countsArray,
            color: () => `rgba(240, 122, 38, 1)`,
            strokeWidth: 1,
        }],
    };

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

    const changeYear = (direction) => {
        if (!changingMonth) {
            setChangingMonth(true);
            const newDate = new Date(currentDate);
            newDate.setFullYear(currentDate.getFullYear() + direction);
            setCurrentDate(newDate);
            setTimeout(() => {
                setChangingMonth(false);
            }, 500);
        }
    };

    return (
        <GestureHandlerRootView>
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>
                    Solicitações de Entrevista - {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#F07A26',
                        padding: 10,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                    }}
                    onPress={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}
                >
                    <Icon
                        name={viewMode === 'days' ? 'calendar-view-month' : 'calendar-today'}
                        size={20}
                        color="#fff"
                        style={{ marginRight: 5 }}
                    />
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                        Visualizar por {viewMode === 'days' ? 'meses' : 'dias'}
                    </Text>
                </TouchableOpacity>
                <PanGestureHandler
                    onGestureEvent={(event) => {
                        const { translationX } = event.nativeEvent;
                        if (Math.abs(translationX) > 50) {
                            if (translationX > 0) {
                                viewMode === 'days' ? changeMonth(-1) : changeYear(-1);
                            } else {
                                viewMode === 'days' ? changeMonth(1) : changeYear(1);
                            }
                        }
                    }}
                >
                    <View style={{ borderColor: '#1F1F3F', borderWidth: 5, borderRadius: 16, overflow: 'hidden' }}>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 32}
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
                                propsForLabels: {
                                    labelStyle: { transform: [{ translateX: -10 }] },
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
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                            bezier
                        />
                    </View>
                </PanGestureHandler>
            </View>
        </GestureHandlerRootView>
    );
};

export default InterviewCountChart;
