import { StyleSheet, Dimensions } from 'react-native';
import colors from './colors';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
    },
    container: {
        flex: 1,
        backgroundColor: colors.backgroundManter,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    gridContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
    },
    line: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(224, 224, 224, 0.3)',
    },
    point: {
        position: 'absolute',
        width: 4,
        height: 4,
        backgroundColor: colors.orange,
        borderRadius: 2,
    },
    frameLayout: {
        width: '100%',
        height: 80,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 30,
        height: 30,
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        color: '#FFF',
    },
    header: {
        fontSize: 30,
        color: '#FFF',
        marginTop: 5,
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 20,
        color: '#FFF',
        marginTop: 10,
        textAlign: 'center',
    },
    transitionContainer: {
        backgroundColor: colors.background,
        marginHorizontal: 16,
        marginTop: 32,
        paddingBottom: 16,
        borderRadius: 20,
        padding: 16,
    },
    formContainer: {
        marginTop: 20,
    },
    textInput: {
        marginBottom: 16,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIcon: {
        marginLeft: 8,
    },
    termsText: {
        textAlign: 'center',
        color: '#darker_gray',
        fontSize: 16,
        marginTop: 16,
    },
    terms: {
        color: colors.termos,
        textAlign: 'center',
        fontSize: 17,
        padding: 10,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalContent: {
        maxHeight: 300,
        marginBottom: 20,
    },
    modalText: {
        fontSize: 14,
        color: '#333',
    },
    divider: {
        height: 2,
        backgroundColor: '#cor_foco',
        marginVertical: 16,
    },
    lineContainer: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderColor,
    },
    containeer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    orText: {
        fontSize: 16,
        marginHorizontal: 10,
        color: '#000',
        textAlign: 'center',
    },
    linee: {
        flex: 1,
        height: 1,
        backgroundColor: '#000',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: 'transparent',
    },
    footerButton: {
        flex: 1,
        backgroundColor: '#button_background',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,

    },
    footerButtonText: {
        color: '#FFF',
    },
    BtnCadastro: {
        color: '#FFF',
        fontSize: 14,
        backgroundColor: colors.orange,
        padding: 20,
        borderRadius: 16,

    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -35,
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxLabel: {
        marginLeft: 8,
    },

    forgotPassword: {
        color: colors.orange,
        textDecorationLine: 'underline',
    },

});

export const stylesAssistente = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        zIndex: 99
    },
    messagesContainer: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
        flexDirection: 'column',
        justifyContent: 'flex-end',
    }, modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContainer: {
        width: '90%',
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    chatIdText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    resetButtonTop: { padding: 5 },
    message: {
        marginVertical: 10,
        padding: 15, borderRadius:
            10
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.orange,
        color: 'white', 
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#F1F1F1'
    },
    userText: { color: '#000' },
    botText: { color: '#555' },
    typingContainer: { flexDirection: 'row' },
    optionsContainer: {
        flexDirection: 'row',
        marginTop: 10, alignItems:
            'flex-end'
    },
    optionButton: {
        backgroundColor: colors.orange,
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        minHeight: 40
    },
    optionButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    scrollView: { marginVertical: 10 },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f8f8f8'
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10
    },
    inputDescription: { width: '82%' },
    sendButton: {
        marginLeft: 5,
        padding: 10,
        backgroundColor: colors.orange,
        borderRadius: 5
    },
    sendButtonText: { color: '#fff' },
    subOptionsContainer: {
        flexDirection: 'row',
        marginTop: 10,
        alignItems: 'flex-end'
    },
    subOptionButton: {
        backgroundColor: colors.orange,
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        minHeight: 40
    },
    subOptionButtonText: {
        color: colors.background,
    }, introText: {
        marginBottom: 20,
        fontSize: 16,
        color: '#333',
    },
    lottieAnimation: {
        width: 200,
        height: 200,
    },
    introContainer: {
        flex: 1,
        marginTop: 100,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        zIndex: 4,
    }, imageDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    clipIconContainer:{
        backgroundColor:  colors.orange,
        padding: 10,
        borderRadius:4,
        marginRight : 6,

    }
    
});