import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Notification = ({ message, onDismiss }) => {
    return (
        <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>{message}</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
                <Text style={styles.dismissButtonText}>Ignorar</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    notificationContainer: {
        backgroundColor: '#ffdd57',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationText: {
        color: '#333',
        fontSize: 16,
    },
    dismissButton: {
        backgroundColor: '#e74c3c',
        borderRadius: 4,
        padding: 5,
    },
    dismissButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default Notification;
