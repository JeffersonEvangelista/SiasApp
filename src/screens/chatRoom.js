
import { View, Text, SafeAreaView, Image, TextInput, Keyboard } from 'react-native';
import React, { useEffect, useRef, useState } from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import MessagesList from '../components/MessagesList';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { stylesAssistente } from './Styles/styles';
import { getCurrentUserData, registerChatRoom, usersRef } from '../services/Firebase';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, getFirestore, collection, addDoc, Timestamp, orderBy, onSnapshot, query } from 'firebase/firestore';
import { db } from '../services/Firebase';
import { getRoomId } from '../utils/common';

import { useColorScheme } from 'nativewind';

export default function ChatRoom({route, navigation}) {

  const {item} = route.params;
  const user = getCurrentUserData();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const textRef = useRef('');
  const inputRef = useRef(null);
  const scrollViewRef =  useRef(null);

  const { colorScheme, toggleColorScheme } = useColorScheme(); // Dark Mode

  console.log(item?.userId);
  console.log(user?.id);

  useEffect(()=>{
    registerChatRoom(user?.id, item?.userId)

    let roomId = getRoomId(user?.id, item?.userId);
    const docRef = doc(db, 'rooms', roomId);
    const messagesRef = collection(docRef, "messages");
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    let unsub = onSnapshot(q, (snapshot)=>{
      let allMessages = snapshot.docs.map(doc=>{
        return doc.data();
      });
      setMessages([...allMessages]);
    });

    const KeyBoardDidShowListener = Keyboard.addListener(
      'keyboardDidShow', UpdateScrollView
    )

    return()=>{
      unsub();
      KeyBoardDidShowListener.remove();
    }

  },[]);

  useEffect(() => {
    UpdateScrollView();
  },[messages])

  const UpdateScrollView = ()=>{
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({animated:false})
    }, 100);
  }

  const handleSendMessage = async ()=>{
    let message = textRef.current.trim();
    if (!message) return;
    try{
      let roomId = getRoomId(user?.id, item?.userId);
      const docRef = doc(db, 'rooms', roomId);
      const messagesRef = collection(docRef, "messages");
      textRef.current = "";
      if(inputRef) inputRef?.current?.clear();
      const newDoc = await addDoc(messagesRef,{
        id: user?.id,
        text: message,
        senderEmail: user?.email,
        createdAt: Timestamp.fromDate(new Date())
      })
    }catch(err){
      Alert.alert('Message', err.message);
    }
  }

  console.log('messages', messages);

  return (
    <SafeAreaView style={{flex: 1, ...(colorScheme === 'dark' ? { backgroundColor: '#1a1a1a' } : {})}}>
        <View style={{flex: 1}}>
          <View style={{
            flexDirection:"row",
            justifyContent:"space-between",
            alignItems:"center",
            paddingTop: 40,
            paddingBottom: 10,
            paddingLeft:10,
            backgroundColor:"#ff8c00"
            }}>
              <View style={{flexDirection:"row", alignItems:"center"}}>
                <TouchableOpacity onPress={() =>{navigation.goBack()}}>
                  <Ionicons name="chevron-back-outline" size={30} color="white"/>
                </TouchableOpacity>
                <Image
                    source={
                      item?.profileImg
                          ? { uri: item.profileImg }
                          : require('../../assets/profilePlaceholderGray.png')
                    }
                    style={{width:42, aspectRatio:1, borderRadius: 100, marginLeft: 8, marginRight: 8}}
                    transition={500}
                />
                <Text style={{fontSize:20, color:"white", fontWeight:"bold"}}>{item?.username}</Text>
              </View>
          </View>
          <View style={{flex: 1, justifyContent: 'space-between', overflow:'visible' }}>
            <View style={{ flex:1 }}>
              <MessagesList scrollViewRef={scrollViewRef} messages={messages} currentUser={user}/>
            </View>
              <View style={{flexDirection:'row', alignItems:'center', margin:10}}>
                <View style={{flex: 1, flexDirection:"row", alignItems:"center", height:46, marginRight:10, paddingHorizontal:12, borderRadius:10, borderColor: "#ccc", borderWidth: 1, backgroundColor: '#fff'}}>
                  <TextInput
                  ref={inputRef}
                  onChangeText={value=> textRef.current = value}
                  style={{fontSize: 18}}
                  placeholder='Digite sua mensagem'
                  />
                </View>
                <TouchableOpacity 
                  onPress={handleSendMessage} 
                  style={{
                    backgroundColor:"#F07A26",
                    padding:12,
                    borderRadius:100
                  }}>
                    <Icon name="send" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
          </View>
        </View>
    </SafeAreaView>
  )
}