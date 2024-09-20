import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import Home from '../../screens/home';
import Assistente from '../../screens/assistente';
import Chat from '../../screens/chat';
import Configuracoes from '../../screens/configuracoes';
import Agenda from '../../screens/Agenda';

const Tab = createBottomTabNavigator();

// Definindo os tipos válidos para Feather
type FeatherIconName =
    | 'home'
    | 'calendar'
    | 'headphones'
    | 'message-circle'
    | 'settings';

export default function TabRoutes() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName: FeatherIconName;

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
                    } else {
                        iconName = 'home'; // Valor padrão
                    }

                    return <Feather name={iconName} color={color} size={size} />;
                },                
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: '#F07A26', // Cor do ícone ativo
                tabBarInactiveTintColor: 'gray', // Cor do ícone inativo
                headerShown: false, // Oculta o cabeçalho
            })}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="Agenda"
                component={Agenda}
                options={{ tabBarLabel: 'Agenda' }}
            />
            <Tab.Screen
                name="Assistente"
                component={Assistente}
                options={{ tabBarLabel: 'Assistente' }}
            />
            <Tab.Screen
                name="Chat"
                component={Chat}
                options={{ tabBarLabel: 'Chat' }}
            />
            <Tab.Screen
                name="Configurações"
                component={Configuracoes}
                options={{ tabBarLabel: 'Configurações' }}
            />
        </Tab.Navigator>
    );
}
