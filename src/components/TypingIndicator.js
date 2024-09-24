// TypingIndicator.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { stylesAssistente } from '../screens/Styles/styles'; 

const TypingIndicator = ({ isTyping }) => {
    const animations = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

    useEffect(() => {
        if (isTyping) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.stagger(200, animations.map((anim) => 
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: false,
                        })
                    )),
                    Animated.stagger(200, animations.map((anim) => 
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: false,
                        })
                    )),
                ])
            );

            animation.start();

            return () => animation.stop();
        } else {
            animations.forEach(anim => anim.setValue(0));
        }
    }, [isTyping]);

    const animatedDots = () => {
        return animations.map((anim, index) => {
            const opacity = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
            });

            return (
                <Animated.Text key={index} style={[stylesAssistente.typingIndicatorText, { opacity }]}>
                    {'.'}
                </Animated.Text>
            );
        });
    };

    return (
        isTyping && (
            <View style={stylesAssistente.typingIndicator}>
                <Text style={stylesAssistente.typingIndicatorText}>Botly está digitando</Text>
                {animatedDots()}
            </View>
        )
    );
};

export default TypingIndicator;