import { StyleSheet, Dimensions } from 'react-native';
import colors from './colors';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    chartContainer: {
        height: 330,
        marginBottom: 8,
        marginTop: '3%',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    loaderContent: {
        alignItems: 'center',
    },
    top: {
        backgroundColor: '#ff8c00',
        height: '14%',
        width: '100%',
        borderWidth: 2,
        borderColor: '#ff8c00',
        borderRadius: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 0,
        paddingHorizontal: 15,
    },
    
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 25,
        marginRight: 10,
    },
    
    textContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        color: 'white',
        marginTop: 5
    },
    text1: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        color: 'black',
        marginTop: '13%',
        
    },
    jobTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mid: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
    jobContainer: {
        width: '95%',
        borderBottomColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        elevation: 1,
        marginTop: '4%',

    },
    jobTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    jobCompany: {
        fontSize: 14,
        color: 'gray',
    },
    jobLocation: {
        fontSize: 14,
        color: '#fff',
        marginLeft: '2%',

        padding: 5,
    },
    jobSalary: {
        fontSize: 14,
        color: '#fff',
        marginLeft: '2%',

        padding: 5,
    },
    jobRequirements: {
        fontSize: 14,
        color: '#fff',
        marginLeft: '2%',

        padding: 5,
    },
    jobDescription: {
        fontSize: 14,
        color: '#fff',
        marginLeft: '2%',
        padding: 5,
    },
    jobDate: {
        fontSize: 12,
        padding: 5,
        marginLeft: '2%',

        color: 'gray',
    },
    noJobsContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    noJobsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'red',
        marginTop: 50,
    },
    forte: {
        fontWeight: 'bold',
    },
    noJobsImage: {
        width: 50,
        height: 50,
        marginTop: 10,
    },
    text2: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        color: 'white',
        marginTop: 5
    },
    candidateContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    candidateDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    photo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 14,
        color: '#666',
    },
    cpf: {
        fontSize: 12,
        color: '#666',
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        position: 'absolute',
        right: 10,
        top: 10,
    },
    noCandidatesText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#fff',
    },

    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginVertical: 5,
    },
    modalLabel: {
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF8C00',
        borderRadius: 5,
        marginVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    icon: {
        marginLeft: 10,
    },
    button: {
        backgroundColor: '#FF8C00',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: '#888',
    },
    iconMargin: {
        marginRight: 8,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF8C00',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    chartWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#FFA726',
        overflow: 'hidden',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
        paddingBottom: 4,
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
    customButton: {
        backgroundColor: '#ffa726',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    input: {
        height: 40,
        padding: 10,
        flex: 1,
        minHeight: "5%",
        fontSize: 16,
        textAlignVertical: 'center',
        paddingVertical: 0,
        paddingHorizontal: 10,
    },
    mapContainer: {
        height: 200,
        width: '100%',
        marginBottom: 10,
    },
    map: {
        flex: 1,
    },

    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginTop: 5,
    },
    feedbackContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 55
    },
    correct: {
        color: 'green',
        fontSize: 18,
    },
    wrong: {
        color: 'red',
        fontSize: 18,
    },
    
});