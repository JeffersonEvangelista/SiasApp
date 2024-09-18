import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Manter/Login';
import Cadastro from '../screens/Manter/Cadastro';
import TabRoutes from './TiposDeNavegacao/tab.routes';

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
            />
            <Stack.Screen
                name="Home"
                component={TabRoutes} // Tela principal com TabNavigator
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
