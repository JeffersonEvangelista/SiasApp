import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import Home from '../../screens/home';
import Assistente from '../../screens/assistente';
import Chat from '../../screens/chat';
import Configuracoes from '../../screens/configuracoes';
import Agenda from '../../screens/Agenda';

const Tab = createBottomTabNavigator();

export default function TabRoutes() {
    return (
        <Tab.Navigator>
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Agenda"
                component={Agenda}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name="calendar" color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Assistente"
                component={Assistente}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name="headphones" color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Chat"
                component={Chat}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name="message-circle" color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Configurações"
                component={Configuracoes}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name="settings" color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}
