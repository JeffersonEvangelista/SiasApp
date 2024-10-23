import { StatusBar } from "expo-status-bar";
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars'; // Biblioteca de calendário
import { ScrollView } from "react-native-gesture-handler";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

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

  // Datas marcadas no calendário
  const markedDates = {
    '2024-10-05': { marked: true, dotColor: 'orange' },
    '2024-10-10': { marked: true, dotColor: 'green' },
    '2024-10-12': { marked: true, dotColor: 'orange' },
  };

  const openModal = (interview) => {
    setSelectedInterview(interview);
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header da agenda */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Agenda</Text>
      </View>

      <ScrollView>
        {/* Calendário */}
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: '#ff8c00',
            todayTextColor: '#ff8c00',
            arrowColor: '#ff8c00',
            textDayFontSize: 18,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 16,
          }}
        />

        {/* Lista de entrevistas pendentes */}
        <View style={styles.interviewListContainer}>
          <Text style={styles.monthTitle}>Entrevistas a serem confirmadas</Text>
          <FlatList
            data={interviews.filter(interview => interview.status === 'Pendente')}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openModal(item)}>
                <View style={styles.interviewItem}>
                  <Text style={styles.interviewDate}>
                    {new Date(item.date).getDate()} / {new Date(item.date).getMonth() + 1}
                  </Text>
                  <View>
                    <Text style={styles.interviewCompany}>{item.company}</Text>
                    <Text style={styles.interviewType}>{item.type}</Text>
                    <Text style={styles.interviewStatus}>{item.status}</Text>
                  </View>
                  <Ionicons name="information-circle-outline" size={24} color="orange" />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Lista de entrevistas confirmadas */}
        <View style={styles.interviewListContainer}>
          <Text style={styles.monthTitle}>Entrevistas Confirmadas</Text>
          <FlatList
            data={interviews.filter(interview => interview.status === 'Confirmada')}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openModal(item)}>
                <View style={styles.interviewItem}>
                  <Text style={styles.interviewDate}>
                    {new Date(item.date).getDate()} / {new Date(item.date).getMonth() + 1}
                  </Text>
                  <View>
                    <Text style={styles.interviewCompany}>{item.company}</Text>
                    <Text style={styles.interviewType}>{item.type}</Text>
                    <Text style={styles.interviewStatusConfirmed}>{item.status}</Text>
                  </View>
                  <Ionicons name="information-circle-outline" size={24} color="green" />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Modal para detalhes da entrevista */}
        {selectedInterview && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Detalhes da Entrevista</Text>
              <Text style={styles.modalText}>Empresa: {selectedInterview.company}</Text>
              <Text style={styles.modalText}>Data: {selectedInterview.date}</Text>
              <Text style={styles.modalText}>Tipo: {selectedInterview.type}</Text>
              <Text style={styles.modalText}>Status: {selectedInterview.status}</Text>
              <TouchableOpacity
                style={styles.buttonClose}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
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
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10, // cantos arredondados
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // sombra leve para Android
  },
  interviewDate: {
    fontSize: 18, // tamanho maior para destaque
    fontWeight: 'bold',
    color: '#333',
  },
  interviewCompany: {
    fontSize: 16,
    color: '#555',
  },
  interviewType: {
    color: '#666',
  },
  interviewStatus: {
    color: '#ff8c00',
    fontWeight: 'bold',
  },
  interviewStatusConfirmed: {
    color: 'green',
    fontWeight: 'bold',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonClose: {
    backgroundColor: "#ff8c00",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
