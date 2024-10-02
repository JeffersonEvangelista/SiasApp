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

// Função para ignorar notificações
export const handleIgnoreNotification = (setBadgeCounts) => {
    setBadgeCounts((prevCounts) => ({
        ...prevCounts,
        Configurações: 0, // Reseta a contagem de notificações
    }));
};

export default function TabRoutes() {
    // Estado para gerenciar as contagens de notificações
    const [badgeCounts, setBadgeCounts] = useState({
        Home: 0,
        Agenda: 0,
        Assistente: 0,
        Chat: 0,
        Configurações: 0,
    });

    // Estado para verificar se a notificação foi ignorada
    const [notificationIgnored, setNotificationIgnored] = useState(false);

    // Efeito para atualizar a contagem na aba "Configurações"
    useEffect(() => {
        const emailVerified = isUserEmailVerified();

        // Se a notificação não foi ignorada, atualiza a contagem de notificações
        if (!notificationIgnored) {
            setBadgeCounts((prevCounts) => ({
                ...prevCounts,
                Configurações: emailVerified ? 0 : 1,
            }));
        }
    }, [notificationIgnored]); // Executa o efeito quando notificationIgnored muda

    // Função para ignorar notificações e atualizar o estado
    const handleIgnore = () => {
        handleIgnoreNotification(setBadgeCounts);
        setNotificationIgnored(true);
    };

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
                    } else {
                        iconName = 'home'; // Valor padrão
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
