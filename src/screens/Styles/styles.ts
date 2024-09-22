import { StyleSheet, Dimensions } from 'react-native';

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
        backgroundColor: '#0D0D1B',
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
        backgroundColor: '#F07A26',
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
        backgroundColor: '#FFFFFF',
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
        color: '#1A0596',
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
        backgroundColor: '#CCCCCC',
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
        backgroundColor: '#F07A26',
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
        color: '#F07A26',
        textDecorationLine: 'underline',
    },

});

export const stylesAssistente = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    chatIdText: {
        fontSize: 16,
        color: '#555',
        fontWeight: 'bold',
    },
    resetButtonTop: {
        padding: 10,
    },
    introContainer: {
        flex: 1,
        marginTop: 100,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
    },
    introButton: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#F07A26',
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    introButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    introText: {
        marginBottom: 20,
        fontSize: 16,
    },
    lottieAnimation: {
        width: 200,
        height: 200,
    },
    messagesContainer: {
        flex: 1,
        marginTop: 20,
    },

    messages: {
        flex: 1,
    },
    message: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
    },
    userMessage: {
        marginRight: 8,
        backgroundColor: '#e1ffc7',
        alignSelf: 'flex-end',
    },
    botMessage: {
        marginLeft: 8,
        backgroundColor: '#f1f0f0',
        alignSelf: 'flex-start',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        margin: 10,
    },
    sendButton: {
        backgroundColor: '#F07A26',
        padding: 10,
        borderRadius: 50,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachButton: {
        backgroundColor: '#F07A26',
        padding: 10,
        borderRadius: 5,
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 200,
        marginTop: 10,
        borderRadius: 5,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContainer: {
        width: '90%',
        height: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalVideo: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 50,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
        paddingHorizontal: 20,
    },
    responseButton: {
        backgroundColor: '#007BFF', // ou a cor que preferir
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
        paddingHorizontal: 10,
    },
    optionButton: {
        backgroundColor: '#007BFF', // Cor de fundo do botão
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    optionButtonText: {
        color: '#FFFFFF', // Cor do texto
        fontWeight: 'bold',
        textAlign: 'center',
    },
    messageContent: {
        flexDirection: 'row', // Alinha o ícone e o texto em linha
        alignItems: 'center', // Centraliza verticalmente
    },
    icon: {
        marginRight: 8, // Espaçamento entre o ícone e o texto
        alignSelf: 'flex-start',
    },
    typingIndicator: {
        padding: 10,
        alignItems: 'flex-start',
        backgroundColor: '#f0f0f0', // Cor de fundo leve
        borderRadius: 8,
        margin: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },

    typingIndicatorText: {
        fontSize: 14,
        color: '#555', // Cor do texto
        fontStyle: 'italic', // Estilo de texto itálico
    },

});