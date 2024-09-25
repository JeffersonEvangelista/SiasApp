import { View, Text } from 'react-native'
import React from 'react'

export default function MessageItem({message, currentUser}) {
  if(currentUser?.id==message?.id){
    // Minha mensagem
    return (
        <View style={{flexDirection:"row", justifyContent:'flex-end'}}>
            <View style={{maxWidth:280, backgroundColor:"#F07A26", margin: 6, padding: 10, borderTopLeftRadius:12, borderBottomLeftRadius: 12, borderTopRightRadius: 12}}>
                <Text style={{fontSize:16, color:"white", fontWeight:"semibold"}}>{message?.text}</Text>
            </View>
        </View>
    )
  }
  else{
    return(
        <View style={{flexDirection:"row"}}>
            <View style={{maxWidth:280, backgroundColor:"#6d6d6d", margin: 6, padding: 10, borderTopLeftRadius:12, borderBottomRightRadius: 12, borderTopRightRadius: 12}}>
                <Text style={{fontSize:16, color:"white", fontWeight:"semibold"}}>{message?.text}</Text>
            </View>
        </View>
    )
  }
}