import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../../screens/home';
import Assistente from '../../screens/assistente';
import Chat from '../../screens/chat';
import Configuracoes from '../../screens/configuracoes';
import Agenda from '../../screens/Agenda';
import TabIconWithBadge from '../../components/TabIconWithBadge';
import { isUserEmailVerified } from '../../services/Firebase';
import { useColorScheme } from 'nativewind';
import AppState from '../../components/globalVars';


const Tab = createBottomTabNavigator();


export default function TabRoutes() {
    // Estado para gerenciar as contagens de notificações

    const updateBadge = (newCount) => {
        setBadgeCount(newCount);
    };

    const [solicitacoesCount, setSolicitacoesCount] = useState(AppState.solicitacoesCount);
    const [badgeCount, setBadgeCount] = useState(0);

    useEffect(() => {
        // Atualiza o badgeCount com o valor de solicitacoesCount
        setBadgeCount(solicitacoesCount);

        const interval = setInterval(() => {
            const newCount = AppState.solicitacoesCount;
            setSolicitacoesCount(newCount);
            setBadgeCount(newCount);
        }, 1000);

        return () => clearInterval(interval);
    }, []);



    // Obtém o esquema de cores atual (light ou dark)
    const { colorScheme, toggleColorScheme } = useColorScheme();

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

                    return (
                        <TabIconWithBadge
                            iconName={iconName}
                            color={color}
                            size={size}
                        />
                    );
                },
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: '#F07A26', // Cor laranja para ícones ativos
                tabBarInactiveTintColor: colorScheme === 'dark' ? 'white' : 'gray', // Branco se no dark mode, cinza no light mode
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#000' : '#fff', // Preto no dark mode, branco no light mode
                },
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
                options={{
                    tabBarLabel: 'Agenda',
                    tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
                }}
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
