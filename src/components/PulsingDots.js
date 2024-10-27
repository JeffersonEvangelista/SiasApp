import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const PulsingDots = () => {
    const dot1Ref = useRef(null);
    const dot2Ref = useRef(null);
    const dot3Ref = useRef(null);

    useEffect(() => {
        const animateDots = async () => {
            if (dot1Ref.current && dot2Ref.current && dot3Ref.current) {
                await dot1Ref.current.fadeIn(1000);
                await dot1Ref.current.fadeOut(1000);

                await dot2Ref.current.fadeIn(1000);
                await dot2Ref.current.fadeOut(1000);

                await dot3Ref.current.fadeIn(1000);
                await dot3Ref.current.fadeOut(1000);

                // Reinicia a animação
                animateDots();
            }
        };

        animateDots();
    }, []);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Animatable.Text
                ref={dot1Ref}
                style={{ fontSize: 24, margin: 2 }}
                animation="fadeIn"
            >
                •
            </Animatable.Text>
            <Animatable.Text
                ref={dot2Ref}
                style={{ fontSize: 24, margin: 2 }}
                animation="fadeIn"
            >
                •
            </Animatable.Text>
            <Animatable.Text
                ref={dot3Ref}
                style={{ fontSize: 24, margin: 2 }}
                animation="fadeIn"
            >
                •
            </Animatable.Text>
        </View>
    );
};

export default PulsingDots;
