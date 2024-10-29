import { StyleSheet, Dimensions } from 'react-native';
import colors from './colors';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    inputName: {
        width: '100%',
        textAlign: 'center',
        paddingVertical: 5,
        fontSize: 16,
        borderRadius: 5,
        borderBottomWidth: 2,
        borderBottomColor: '#ff8c00',
    },
    photo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
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
        marginTop: '4%'
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
    interviewItemPedentes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginVertical: 8,
        elevation: 5,
    },
    interviewItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
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
    interviewTitleRecursada: {
        fontSize: 20,
        color: '#a30000',
        marginTop: '-6%',
        marginBottom: '3%'
    },
    interviewTitleAceita: {
        fontSize: 20,
        color: '#009e23',
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
    dateBarRecursada: {
        width: 4,
        height: '100%',
        backgroundColor: '#a30000',
        marginRight: 10,
    },
    interviewDateDayRecursada: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#a30000'
    },
    interviewDateMonthRecursada: {
        fontSize: 18,
        color: '#a30000'
    },
    dateBarAceita: {
        width: 4,
        height: '100%',
        backgroundColor: '#009e23',
        marginRight: 10,
    },
    interviewDateDayAceita: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#009e23'
    },
    interviewDateMonthAceita: {
        fontSize: 18,
        color: '#009e23'
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
    acceptAction: {
        backgroundColor: 'green',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
    },
    rejectAction: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignSelf: 'center',
        marginBottom: 15,
    },
    customButton: {
        backgroundColor: '#ffa726',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    lottieAnimation: {
        width: 200,
        height: 200,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        color: '#555',
        marginLeft: 10,
    },
    distanceText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
    },
    buttonClose: {
        backgroundColor: '#ff8c00',
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: {
        fontSize: 18,
        color: '#ff8c00',
        marginLeft: 10,
        fontWeight: 'bold',
    },
    buttonTextclosd: {
        fontSize: 20,
        color: '#ffffff',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        marginBottom: '1%',
    },
    map: {
        width: '100%',
        height: 300,
        marginVertical: 15,
        borderRadius: 20,
    },
});