import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Manter/Login';
import Cadastro from '../screens/Manter/Cadastro';
import TabRoutes from './TiposDeNavegacao/tab.routes';
import ChatRoom from '../screens/chatRoom';
import EsqueciSenha from '../screens/Manter/EsqueciSenha';

const Stack = createStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Cadastro"
                component={Cadastro}                
                options={{ headerShown: true }}
            />
            <Stack.Screen
                name="Home"
                component={TabRoutes} // Tela principal com TabNavigator
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="chatRoom"
                component={ChatRoom}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="EsqueciSenha"
                component={EsqueciSenha} // Tela principal com TabNavigator
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
