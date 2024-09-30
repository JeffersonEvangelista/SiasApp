import { View, Text } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import MessageItem from './MessageItem'

export default function MessagesList({messages, currentUser, scrollViewRef}) {
  return (
    <ScrollView 
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{paddingTop: 10}}>
      {
        messages.map((message, index)=>{
          return(
            <MessageItem message={message} key={index} currentUser={currentUser}/>
          )
        })
      }
    </ScrollView>
  )
}