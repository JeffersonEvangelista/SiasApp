import { StyleSheet, Dimensions } from 'react-native';
import colors from './colors';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escurecido
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '80%', // Ajuste conforme necessário
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },

    map: {
        width: '100%',
        height: 300,
        marginVertical: 15,
        borderRadius: 20,
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

    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff8c00',
        padding: 5,
        borderRadius: 5,
        marginVertical: 10,
        width: 120,
        alignSelf: 'flex-start',
        marginLeft: '2%'
    },
    toggleButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 5,
    },
    legendContainer: {
        marginTop: '-2%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    legendText: {
        fontSize: 16,
    },

    interviewDate: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    interviewTitle: {
        fontSize: 20,
        color: '#d77906',
        marginTop: '-6%',
        marginBottom: '3%'
    },
    interviewRecruiter: {
        fontSize: 12,
        color: '#666',
        marginBottom: '5%'
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBar: {
        width: 4,
        height: '100%',
        backgroundColor: '#ff8c00',
        marginRight: 10,
    },
    dateTextContainer: {
        alignItems: 'center',
    },
    interviewDateDay: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#d77906'
    },
    interviewDateMonth: {
        fontSize: 18,
        color: '#d77906'
    },
    detailsContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        padding: 10,
        borderRadius: 5,
    },
    interviewCompany: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },

    interviewLocation: {
        fontSize: 16,
        color: '#555',
        marginBottom: '-5 %'
    },

});