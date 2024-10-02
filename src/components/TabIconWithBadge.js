import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

const TabIconWithBadge = ({ iconName, color, size, badgeCount }) => {
    return (
        <View style={styles.container}>
            <Feather name={iconName} color={color} size={size} />
            {badgeCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: 'red',
        borderRadius: 12, // Ajuste o raio para deixar a bolinha bem arredondada
        width: 20, // Ajuste o tamanho da bolinha
        height: 20, // Ajuste o tamanho da bolinha
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12, // Ajuste o tamanho do texto
    },
});

export default TabIconWithBadge;
