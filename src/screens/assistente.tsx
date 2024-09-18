import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Modal, Platform, Pressable, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Lottie from 'lottie-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

// Defina o tipo da mensagem
type Message = {
  id: string;
  text?: string;
  sender: 'user' | 'bot';
  imageUri?: string;
  videoUri?: string;
};

export default function Assistente() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showAnimation, setShowAnimation] = useState<boolean>(true);
  const [reportingBug, setReportingBug] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const getPermissions = async () => {
      try {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissões para acessar sua galeria.');
          }
        }
      } catch (error) {
        console.error('Erro ao solicitar permissões:', error);
      }
    };
    getPermissions();
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
      const botResponse = generateResponse(input);
      const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };

      console.log('Enviando mensagem:', userMessage);
      console.log('Resposta do bot:', botMessage);

      setMessages(prevMessages => [...prevMessages, userMessage, botMessage]);
      setInput('');
      setShowIntro(false);
      setReportingBug(false); // Após o envio, não está mais relatando um bug
    }
  };

  const handleButtonPress = (text: string) => {
    console.log('Botão pressionado:', text);

    if (text === 'Achou algum bug do sistema') {
      setReportingBug(true);
      setShowIntro(false);
    } else {
      const userMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
      const botResponse = generateResponse(text);
      const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };

      console.log('Enviando mensagem:', userMessage);
      console.log('Resposta do bot:', botMessage);

      setMessages(prevMessages => [...prevMessages, userMessage, botMessage]);
      setShowIntro(false);
    }
  };

  const handleSelectMedia = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const type = result.assets[0].type;

        let message: Message = { id: Date.now().toString(), sender: 'user' };

        if (type.startsWith('image')) {
          message = { ...message, imageUri: uri };
        } else if (type.startsWith('video')) {
          message = { ...message, videoUri: uri };
        }

        console.log('Mídia selecionada:', message);

        setMessages(prevMessages => [...prevMessages, message]);
      }
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
    }
  };

  const handlePressMedia = (uri: string) => {
    console.log('Mídia pressionada:', uri);
    setSelectedMedia(uri);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    console.log('Modal fechado');
    setIsModalVisible(false);
    setSelectedMedia(null);
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setShowIntro(true);
    setShowAnimation(true);
    setReportingBug(false);
    console.log('Chat resetado');
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const generateResponse = (input: string) => {
    // Função fictícia para gerar uma resposta do bot
    const response = `Você disse: ${input}`;
    console.log('Resposta gerada:', response);
    return response;
  };

  return (
    <View style={styles.container}>
      {showIntro && (
        <View style={styles.introContainer}>
          {showAnimation && (
            <Lottie
              source={{ uri: 'https://lottie.host/12b6782f-edfc-4b2c-91ad-fdc9419466b1/MttHHyP7Zv.json' }}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          )}
          <Text style={styles.introText}>Olá! Sou o Assistente do Sias, me chamo Botly</Text>
          <Text style={styles.introText}>Use os botoes para ser mais rapido</Text>
          <TouchableOpacity
            style={styles.introButton}
            onPress={() => handleButtonPress('Duvidas do Sistema')}
          >
            <Text style={styles.introButtonText}>Duvidas do Sistema</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.introButton}
            onPress={() => handleButtonPress('Achou algum bug do sistema')}
          >
            <Text style={styles.introButtonText}>Achou algum bug do sistema</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.messagesContainer}>
        <TouchableOpacity style={styles.resetButtonTop} onPress={resetChat}>
          <Icon name="delete" size={24} color="#FF4D4D" />
        </TouchableOpacity>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.sender === 'user' ? styles.userMessage : styles.botMessage,
              ]}
            >
              {item.text && <Text>{item.text}</Text>}
              {item.imageUri && (
                <TouchableOpacity onPress={() => handlePressMedia(item.imageUri)}>
                  <Image source={{ uri: item.imageUri }} style={styles.image} />
                </TouchableOpacity>
              )}
              {item.videoUri && (
                <TouchableOpacity onPress={() => handlePressMedia(item.videoUri)}>
                  <Image
                    source={{ uri: item.videoUri }}
                    style={styles.image}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          keyExtractor={item => item.id}
          style={styles.messages}
        />
      </View>
      <InputArea 
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        handleSelectMedia={handleSelectMedia}
        reportingBug={reportingBug}
      />

      {/* Modal para visualização de mídia */}
      {selectedMedia && (
        <Modal
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.modalBackground} onPress={closeModal}>
            <View style={styles.modalContainer}>
              {selectedMedia.endsWith('.mp4') ? (
                <Video
                  source={{ uri: selectedMedia }}
                  useNativeControls
                  resizeMode="contain"
                  style={styles.modalVideo}
                  shouldPlay
                />
              ) : (
                <Image source={{ uri: selectedMedia }} style={styles.modalImage} />
              )}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const InputArea: React.FC<{ 
  input: string; 
  setInput: React.Dispatch<React.SetStateAction<string>>; 
  sendMessage: () => void; 
  handleSelectMedia: () => void; 
  reportingBug: boolean; 
}> = ({ input, setInput, sendMessage, handleSelectMedia, reportingBug }) => (
  <View style={styles.inputContainer}>
    {reportingBug ? (
      <>
        <TouchableOpacity style={styles.attachButton} onPress={handleSelectMedia}>
          <Icon name="attach-file" size={24} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Descreva o bug"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </>
    ) : (
      <>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua mensagem"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  resetButtonTop: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 50,
    zIndex: 1,
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
});
