import { StatusBar } from "expo-status-bar";
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars'; // Biblioteca de calendário

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState('');
  const [interviews, setInterviews] = useState([
    {
      id: '1',
      date: '2024-10-05',
      company: 'Empresa A',
      type: 'Remota',
      status: 'Pendente',
    },
    {
      id: '2',
      date: '2024-10-10',
      company: 'Empresa B',
      type: 'Presencial',
      status: 'Confirmada',
    },
    {
      id: '3',
      date: '2024-10-12',
      company: 'Empresa C',
      type: 'Remota',
      status: 'Pendente',
    },
  ]);

  const markedDates = {
    '2024-10-05': { marked: true, dotColor: 'orange' },
    '2024-10-10': { marked: true, dotColor: 'green' },
    '2024-10-12': { marked: true, dotColor: 'orange' },
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header da agenda */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Agenda</Text>
        <TouchableOpacity onPress={() => console.log("Add contact")}>
          <Ionicons name="add-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Calendário */}
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#ff8c00',
          todayTextColor: '#ff8c00',
        }}
      />

      {/* Lista de entrevistas */}
      <View style={styles.interviewListContainer}>
        <Text style={styles.monthTitle}>Entrevistas a serem confirmadas</Text>
        <FlatList
          data={interviews.filter(interview => interview.status === 'Pendente')}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.interviewItem}>
              <Text style={styles.interviewDate}>
                {new Date(item.date).getDate()} / {new Date(item.date).getMonth() + 1}
              </Text>
              <View>
                <Text style={styles.interviewCompany}>{item.company}</Text>
                <Text style={styles.interviewType}>{item.type}</Text>
                <Text style={styles.interviewStatus}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ff8c00",
  },
  headerText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  interviewListContainer: {
    padding: 10,
    flex: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  interviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 5,
  },
  interviewDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  interviewCompany: {
    fontSize: 16,
  },
  interviewType: {
    color: '#666',
  },
  interviewStatus: {
    color: '#ff8c00',
    fontWeight: 'bold',
  },
});
