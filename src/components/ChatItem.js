import { View, Text, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useNavigation } from '@react-navigation/native';
import { formatDate, getRoomId } from '../utils/common';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../services/Firebase';

import { useColorScheme } from 'nativewind';

export default function ChatItem({item, currentUser}) {

    const navigation = useNavigation();

    const { colorScheme, toggleColorScheme } = useColorScheme(); // Dark Mode

    const [lastMessage, setLastMessage] = useState(undefined);
    useEffect(()=>{

        let roomId = getRoomId(currentUser?.id, item?.userId);
        const docRef = doc(db, 'rooms', roomId);
        const messagesRef = collection(docRef, "messages");
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        let unsub = onSnapshot(q, (snapshot)=>{
            let allMessages = snapshot.docs.map(doc=>{
                return doc.data();
            });
            setLastMessage(allMessages[0]? allMessages[0]: null);
        });
    },[]);

    const renderTime = ()=>{
        if(lastMessage){
            let date = lastMessage?.createdAt;
            return formatDate(new Date(date?.seconds * 1000))
        }
    }

    const renderLastMessage = ()=>{
        if(typeof lastMessage == 'undefined') return 'Carregando...';
        if(lastMessage){
            if(currentUser?.id == lastMessage?.id) return "Você: "+lastMessage?.text;
            return lastMessage?.text;
        }
        else{
            return "...";
        }
    }

  return (
    <TouchableOpacity
    onPress={() => {navigation.navigate('chatRoom', {item})}}
    style={{
        borderBottomColor: "#ccc",
        borderBottomWidth: 0.5,
        padding: 8,
    }}>
        <View style={{flexDirection:"row", alignItems:"center"}}>
            <Image
                source={
                    item?.profileImg
                        ? { uri: item.profileImg }
                        : require('../../assets/profilePlaceholder.png')
                }
                style={{width:50, aspectRatio:1, borderRadius: 100}}
                transition={500}
            />
            <View style={{flexDirection:"row", flex:1, justifyContent:"space-between"}}>
                <View style={{marginStart:8}}>
                    <Text style={{fontSize:18, fontWeight:"semibold", ...(colorScheme === 'dark' ? { color: '#fff' } : {})}}>{item?.username}</Text>
                    <Text style={{fontSize:14, ...(colorScheme === 'dark' ? { color: '#fff' } : {})}}>{renderLastMessage()}</Text>
                </View>
                <View>
                <Text style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}>
                    {renderTime()}
                </Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
  )
}