import { View, Text } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import MessageItem from './MessageItem'

export default function MessagesList({messages, currentUser}) {
  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{paddingTop: 10}}
      ref={ref => {this.scrollView = ref}}
      onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}>
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