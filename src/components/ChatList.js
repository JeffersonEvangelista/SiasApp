import { View, Text } from 'react-native'
import React from 'react'
import { FlatList } from 'react-native-gesture-handler'
import ChatItem from './ChatItem'

export default function ChatList({users, currentUser}) {
    
  return (
    <View style={{flex:1}}>
      <FlatList
        data={users}
        contentContainerStyle={{flex:1}}
        keyExtractor={item=>Math.random()}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index})=> <ChatItem
          item={item}
          currentUser={currentUser}
          index={index}/>}
        />
    </View>
  )
}