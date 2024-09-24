import { View, Text } from 'react-native'
import React from 'react'
import { FlatList } from 'react-native-gesture-handler'
import ChatItem from './ChatItem'
import { useRouter } from 'expo-router'

export default function ChatList({users}) {
    
  const router = useRouter();

  return (
    <View style={{flex:1}}>
      <FlatList
        data={users}
        contentContainerStyle={{flex:1}}
        keyExtractor={item=>Math.random()}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index})=> <ChatItem 
          noBorder={index+1 == users.length} 
          router={router}
          item={item} 
          index={index}/>}
        />
    </View>
  )
}