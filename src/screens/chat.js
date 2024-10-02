import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import ChatList from '../components/ChatList';
import { ScrollView, TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { getCurrentUserData, getCurrentUserEmail } from '../services/Firebase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { styles } from './Styles/styles';
import { ActivityIndicator } from 'react-native-paper';
import { query, where, getDocs } from 'firebase/firestore'
import { usersRef } from '../services/Firebase'

export default function Chat() {

  const user = getCurrentUserData();
  
  const [users, setUsers] = useState([]);
  useEffect(()=>{
    getUsers();
  }, [])
  
  const getUsers = async ()=>{
    const q =  query(usersRef, where('userId', '!=', user?.id))

    const querySnapshot = await getDocs(q);
    let data = [];
    querySnapshot.forEach((doc) => {
      data.push({...doc.data()}); 
    });

    setUsers(data);

  }
  
  return (
    <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}}>          
          <View style={{
            flexDirection:"row",
            justifyContent:"space-between",
            alignItems:"center",
            paddingTop: 30,
            paddingBottom: 10,
            paddingHorizontal: 12,
            backgroundColor:"#ff8c00"
            }}>
              <Text style={{fontSize:24, color:"white", fontWeight:"bold"}}>Chat</Text>
              <TouchableOpacity onPress={()=>console.log("Add contact")} >
                <Ionicons name="add-outline" size={30} color="white" /> 
              </TouchableOpacity>
          </View>

          <View style={{
            flexDirection:"row",
            alignItems:"center",
            height:46,
            margin:10,
            paddingHorizontal:12,
            borderRadius:10,
            borderColor: "#ccc",
            borderWidth: 1
          }}>
            <Ionicons name="search-outline" size={24} color="black" />
            <TextInput style={{
              width:"100%",
              height:"100%",
              marginHorizontal:12,
              fontSize: 18,
            }}
            placeholder='Pesquisar'
            />
          </View>
          <ScrollView>
            {
            <View style={{flex: 1}}>
              <StatusBar style='light'/>
              {
                users.length>0? (
                  <ChatList currentUser={user} users={users}/>
                ):(
                  <View style={{
                    flexDirection:"column",
                    alignItems:"center",
                    top: 30
                  }}>
                    <ActivityIndicator size={'large'} color="#F07A26"/>
                  </View>
                )
              }
            </View>
            }
          </ScrollView>
        </View>
    </SafeAreaView>
  );
};