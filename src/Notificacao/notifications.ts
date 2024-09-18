// notifications.ts
import * as Notifications from 'expo-notifications';

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
        trigger: null, // Trigger immediately
    });
};

