import { View, Text, Image } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'

export default function ChatItem({item, router, noBorder}) {
  return (
    <TouchableOpacity
    style={{
        borderBottomColor: "#ccc",
        borderBottomWidth: 0.5,
        padding: 8,
    }}>
        <View style={{flexDirection:"row", alignItems:"center"}}>            
            <Image 
                source={item?.foto_perfil}
                style={{width:50, aspectRatio:1, borderRadius: 100}}
                transition={500}
            />
            <View style={{flexDirection:"row", flex:1, justifyContent:"space-between"}}>                
                <View style={{marginStart:8}}>
                    <Text style={{fontSize:18, fontWeight:"semibold"}}>{item?.username}</Text>                
                    <Text style={{fontSize:12,}}>Alguma mensagem</Text>
                </View>
                <View>
                    <Text>Tempo</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
  )
}