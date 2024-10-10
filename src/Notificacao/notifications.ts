import * as Notifications from 'expo-notifications';
import { isUserEmailVerified } from '../services/Firebase';

// Configurar as permissões e o handler de notificações
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Solicitar permissões para notificações
const requestPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
    }
};

// Função para agendar uma notificação local
export const scheduleNotification = async (title: string, body: string, seconds: number) => {
    await requestPermissions();

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: {
            seconds,
        },
    });
};


export const sendNotificationNow = async (title: string, body: string) => {
    await requestPermissions();

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: null,
    });
};
// Função de delay
const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

// Verifica se o e-mail foi verificado e envia notificação se necessário
export const checkEmailVerificationAndNotify = async () => {
    const isVerified = isUserEmailVerified();

    if (!isVerified) {
        // Adiciona um delay de 20 segundos
        await delay(20000);

        await sendNotificationNow(
            'Verifique Seu E-mail',
            'Você precisa verificar seu e-mail para ativar algumas funcionalidades do Sistema!'
        );
    }
};

export const checkEmailVerificationAndNotifyLogin = async () => {
    const isVerified = isUserEmailVerified();

    if (!isVerified) {
        // Adiciona um delay de 30 segundos
        await delay(30000);

        await sendNotificationNow(
            'Verifique Seu E-mail',
            'Ei! Sua conta ainda não está ativada! Não perca tempo, ative agora e aproveite todas as vantagens incríveis que temos para você!!'
        );
    }
};