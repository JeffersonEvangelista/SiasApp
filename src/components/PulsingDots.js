// PulsingDots.js
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const PulsingDots = () => {
    const dot1Ref = useRef(null);
    const dot2Ref = useRef(null);
    const dot3Ref = useRef(null);

    useEffect(() => {
        let isMounted = true; // Verifica se o componente ainda está montado
        const animateDots = async () => {
            // Espera o ponto 1 aparecer e desaparecer
            if (isMounted) {
                await dot1Ref.current.fadeIn(1000);
                await dot1Ref.current.fadeOut(1000);
            }

            // Espera o ponto 2 aparecer e desaparecer
            if (isMounted) {
                await dot2Ref.current.fadeIn(1000);
                await dot2Ref.current.fadeOut(1000);
            }

            // Espera o ponto 3 aparecer e desaparecer
            if (isMounted) {
                await dot3Ref.current.fadeIn(1000);
                await dot3Ref.current.fadeOut(1000);
            }

            // Reinicia a animação após um intervalo
            if (isMounted) {
                setTimeout(animateDots, 500); // Espera 500ms antes de reiniciar
            }
        };

        animateDots();

        // Limpeza para evitar problemas ao desmontar
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Animatable.Text
                ref={dot1Ref}
                style={{ fontSize: 24, margin: 2 }}
                animation="fadeIn"
                iterationCount="infinite"
                duration={1000}
            >
                •
            </Animatable.Text>
            <Animatable.Text
                ref={dot2Ref}
                style={{ fontSize: 24, margin: 2 }}
                animation="fadeIn"
                iterationCount="infinite"
                duration={1000}
            >
                •
            </Animatable.Text>
            <Animatable.Text
                ref={dot3Ref}
                style={{ fontSize: 24, margin: 2 }}
                animation="fadeIn"
                iterationCount="infinite"
                duration={1000}
            >
                •
            </Animatable.Text>
        </View>
    );
};

export default PulsingDots;
