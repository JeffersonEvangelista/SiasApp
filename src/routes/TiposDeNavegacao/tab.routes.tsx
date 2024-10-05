import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../../screens/home';
import Assistente from '../../screens/assistente';
import Chat from '../../screens/chat';
import Configuracoes from '../../screens/configuracoes';
import Agenda from '../../screens/Agenda';
import TabIconWithBadge from '../../components/TabIconWithBadge';
import { isUserEmailVerified } from '../../services/Firebase';

const Tab = createBottomTabNavigator();


export default function TabRoutes() {
    // Estado para gerenciar as contagens de notificações
    const [badgeCounts, setBadgeCounts] = useState({
        Home: 0,
        Agenda: 0,
        Assistente: 0,
        Chat: 0,
        Configurações: 0,
    });

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
                        iconName = 'help-circle';
                    } else if (route.name === 'Chat') {
                        iconName = 'message-circle';
                    } else if (route.name === 'Configurações') {
                        iconName = 'settings';
                    } else {
                        iconName = 'home'; 
                    }

                    const badgeCount = badgeCounts[route.name] || 0;

                    return (
                        <TabIconWithBadge
                            iconName={iconName}
                            color={color}
                            size={size}
                            badgeCount={badgeCount}
                        />
                    );
                },
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: '#F07A26',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
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
                name="Chat"
                component={Chat}
                options={{ tabBarLabel: 'Chat' }}
            />
            <Tab.Screen
                name="Assistente"
                component={Assistente}
                options={{ tabBarLabel: 'Assistente' }}
            />
            <Tab.Screen
                name="Configurações"
                component={Configuracoes}
                options={{ tabBarLabel: 'Configurações' }}
            />
            
        </Tab.Navigator>
    );
}
