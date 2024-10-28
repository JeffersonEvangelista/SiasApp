
export const sendPushNotification = async (token, title, body) => {
    const message = {
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: { someData: 'goes here' },
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const data = await response.json();
        console.log('Push notification response:', data);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};
