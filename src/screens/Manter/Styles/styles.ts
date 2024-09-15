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
});