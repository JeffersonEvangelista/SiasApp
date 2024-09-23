import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import { stylesAssistente } from '../screens/Styles/styles'; 

interface InputAreaProps {
    input: string;
    setInput: (input: string) => void;
    sendMessage: () => void;
    handleSelectMedia: () => void; 
    reportingBug: boolean;
    sendBugReport: (description: string, image: string | null) => void; 
}

const InputArea: React.FC<InputAreaProps> = ({
    input,
    setInput,
    sendMessage,
    handleSelectMedia,
    reportingBug,
    sendBugReport,
}) => {
    const [bugDescription, setBugDescription] = useState<string>('');
    const [bugImage, setBugImage] = useState<string | null>(null);

    const handleBugReportSubmit = () => {
        console.log('Descrição do bug antes do envio:', bugDescription);
        
        if (typeof sendBugReport !== 'function') {
            console.error('sendBugReport não é uma função');
            return;
        }

        if (bugDescription.trim() || bugImage) {
            sendBugReport(bugDescription, bugImage); // Chama a função passada como prop
            setBugDescription(''); // Limpa a descrição após enviar
            setBugImage(null); // Limpa a imagem após enviar
        } else {
            alert('Por favor, descreva o bug ou selecione uma imagem antes de enviar.');
        }
    };
    
    return (
        <View style={stylesAssistente.inputContainer}>
            {reportingBug ? (
                <>
                    <TouchableOpacity style={stylesAssistente.attachButton} onPress={handleSelectMedia}>
                        <Icon name="attach-file" size={24} color="#fff" />
                    </TouchableOpacity>
                    {bugImage && (
                        <Image source={{ uri: bugImage }} style={{ width: 100, height: 100 }} /> // Exibe a imagem selecionada
                    )}
                    <TextInput
                        style={stylesAssistente.input}
                        value={bugDescription}
                        onChangeText={(text) => {
                            console.log('Texto do bug:', text);
                            setBugDescription(text);
                        }}
                        placeholder="Descreva o bug"
                    />
                    <TouchableOpacity
                        style={stylesAssistente.sendButton}
                        onPress={handleBugReportSubmit}
                    >
                        <Icon name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TextInput
                        style={stylesAssistente.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Digite sua mensagem"
                    />
                    <TouchableOpacity style={stylesAssistente.sendButton} onPress={sendMessage}>
                        <Icon name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

export default InputArea;
