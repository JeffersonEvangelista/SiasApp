import React from 'react';
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
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Agenda') {
                        iconName = 'calendar';
                    } else if (route.name === 'Assistente') {
                        iconName = 'headphones';
                    } else if (route.name === 'Chat') {
                        iconName = 'message-circle';
                    } else if (route.name === 'Configurações') {
                        iconName = 'settings';
                    }

                    // You can return any component that you like here!
                    return <Feather name={iconName} color={color} size={size} />;
                },
                tabBarActiveTintColor: '#F07A26', // Cor do ícone ativo
                tabBarInactiveTintColor: 'gray', // Cor do ícone inativo
            })}
        >
            <Tab.Screen
                name="Home"
                component={Home}
            />
            <Tab.Screen
                name="Agenda"
                component={Agenda}
            />
            <Tab.Screen
                name="Assistente"
                component={Assistente}
            />
            <Tab.Screen
                name="Chat"
                component={Chat}
            />
            <Tab.Screen
                name="Configurações"
                component={Configuracoes}
            />
        </Tab.Navigator>
    );
}
