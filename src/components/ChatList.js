import { View, Text } from 'react-native'
import React from 'react'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import ChatItem from './ChatItem'

export default function ChatList({users, currentUser}) {
    
  return (
    <View style={{flex:1}}>
      <FlatList
        data={users}
        keyExtractor={(item) => Math.random().toString()} // use algo mais único se possível
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => (
          <ChatItem item={item} currentUser={currentUser} index={index} />
        )}
      />    
    </View>
  )
}