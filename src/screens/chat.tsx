import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import PageContainer from '../components/PageContainer';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Chat() {
  
  return (
    <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}}>          
          <View style={{
            flexDirection:"row",
            justifyContent:"space-between",
            alignItems:"center",
            padding: 10,
            marginTop:22,
            backgroundColor:"#F07A26"
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
            ></TextInput>
          </View>

        </View>
    </SafeAreaView>
  );
};