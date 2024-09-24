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
        backgroundColor: colors.background,
        justifyContent: 'flex-end',
    },
    scrollView: {
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        height: 50,
        marginBottom: -710,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    chatIdText: {
        fontSize: 16,
        color: colors.orange,
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
        backgroundColor: colors.orange,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    introButtonText: {
        color: colors.background,
        fontSize: 16,
    },
    introText: {
        marginBottom: 20,
        fontSize: 16,
        color: colors.textPrimary,
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
        backgroundColor: colors.userBackground,
        alignSelf: 'flex-end',
    },
    botMessage: {
        marginLeft: 8,
        backgroundColor: colors.botBackground,
        alignSelf: 'flex-start',
        marginRight: 5,
        marginEnd: 55,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderColor,
        backgroundColor: colors.background,
    },
    input: {
        flex: 1,
        borderColor: colors.borderColor,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        margin: 10,
    },
    sendButton: {
        backgroundColor: colors.orange,
        padding: 10,
        borderRadius: 50,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachButton: {
        backgroundColor: colors.orange,
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
        backgroundColor: colors.modalBackground,
    },
    modalContainer: {
        width: '90%',
        height: '80%',
        backgroundColor: colors.background,
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
        backgroundColor: colors.orange,
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
    },
    buttonText: {
        color: colors.background,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollContainer: {
        height: 40,
        paddingVertical: 5,
        flexDirection: 'row',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 10,

    },
    optionButton: {
        backgroundColor: colors.orange,
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 0.5,
        padding: 5,
        borderColor: colors.textPrimary,
    },

    optionButtonText: {
        color: colors.background,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },

    messageContent: {
        flexDirection: 'row',
        alignItems: 'center',

    },


    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },

    typingIndicatorText: {
        fontSize: 16,
        color: colors.textPrimary,
        marginRight: 5, // Espaço entre a mensagem e os pontos
    },
});