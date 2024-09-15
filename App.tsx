import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, StatusBar, Button } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import animationData from './path/to/your/animation.json';

import { createStackNavigator } from '@react-navigation/stack';
import AuthStack from './src/routes/AuthStack';

interface Slide {
  key: number;
  title: string;
  text: string;
  image: any;
}

const slides: Slide[] = [
  {
    key: 1,
    title: 'Comunicação Direta',
    text: 'Conecte o RH diretamente aos candidatos, um app que facilita a comunicação rápida e eficaz durante o processo seletivo',
    image : (
      <LottieView
        source={{ uri: 'https://lottie.host/5829f396-cd0d-435d-95b5-413243a789ca/NUZfAnTKj2.json' }}
        autoPlay
        loop
        style={{ width: 350, height: 400 }}
      />
    ),
  },
  {
    key: 2,
    title: 'Gerenciamento de Entrevistas',
    text: 'Agende entrevistas facilmente e visualize entrevistas anteriores, tudo em um só lugar',
    image: (
      <LottieView
        source={{ uri: 'https://lottie.host/44abec67-6a9d-4a9d-b211-95f293292210/VQMVRHbqJv.json' }}
        autoPlay
        loop
        style={{ width: 350, height: 400 }}
      />
    ),
  },
  {
    key: 3,
    title: 'Bot para as principais dúvidas',
    text: 'Tire suas principais dúvidas de forma fácil e rápida com o bot exclusivo para isso',
    image: (
      <LottieView
        source={{ uri: 'https://lottie.host/12b6782f-edfc-4b2c-91ad-fdc9419466b1/MttHHyP7Zv.json' }}
        autoPlay
        loop
        style={{ width: 400, height: 400 }}
      />
    ),
  },
];

function renderSlides({ item, index }: { item: Slide, index: number }) {
  const isLastSlide = index === slides.length - 1;

  return (
    <View style={styles.slide}>
      {typeof item.image === 'number' ? (
        <Image source={item.image} style={styles.image} />
      ) : (
        item.image
      )}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
      {isLastSlide && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={async () => {
              await AsyncStorage.setItem('hasViewedOnboarding', 'true');
              setShowAuth(true);

            }}
          >
            <Text style={styles.confirmButtonText}>Vomos La!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const Stack = createStackNavigator();

function AppNavigation() {
  const [showAuth, setShowAuth] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<AppIntroSlider>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const hasViewedOnboarding = await AsyncStorage.getItem('hasViewedOnboarding');
      if (hasViewedOnboarding === 'true') {
        setShowAuth(true);
      }
    };
    checkOnboardingStatus();
  }, []);

  const goToNextSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.goToSlide(currentIndex + 1, true);
    }
  };

  if (showAuth) {
    return <AuthStack />;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <AppIntroSlider
        ref={sliderRef}
        renderItem={renderSlides}
        data={slides}
        onDone={() => setShowAuth(true)}
        onSlideChange={(index) => setCurrentIndex(index)}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        showNextButton={false}
        showDoneButton={false}
      />
      <View style={styles.circularProgressContainer}>
        <AnimatedCircularProgress
          size={100}
          width={10}
          fill={(currentIndex / (slides.length - 1)) * 100}
          tintColor="#F07A26"
          backgroundColor="#ccc"
        >
          {
            () => (
              <TouchableOpacity style={styles.innerCircle} onPress={goToNextSlide}>
                <Ionicons name="arrow-forward" size={40} color="#F07A26" />
              </TouchableOpacity>
            )
          }
        </AnimatedCircularProgress>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={AppNavigation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1B',
    justifyContent: 'flex-start',
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',

    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    padding:20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    color: '#FFFFFF',
  },
  circularProgressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  innerCircle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confirmButton: {
    padding: 10,
    backgroundColor: '#F07A26',
    borderRadius: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dotStyle: {
    backgroundColor: 'transparent',
  },
  activeDotStyle: {
    backgroundColor: 'transparent',
  },
});
