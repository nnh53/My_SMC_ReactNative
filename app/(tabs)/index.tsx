import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated,Alert } from 'react-native';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000, // Fade in over 2 seconds
      useNativeDriver: true,
    }).start(() => {
     
      router.push('../Authen/LoginScreen');
    
    });
  },[fadeAnim]);
  return (
    
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/Layer-1.png')} // Replace with your image path
        style={styles.image}
      />
      <Text style={styles.version}>Version: 1.0.0</Text>
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#003366', // Background color matching the image
  },
  image: {
    width: width * 0.525, // 52.5% of screen width
    height: width * 0.185, // Maintain aspect ratio
    marginBottom: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff', // White text color
  },
  version: {
    fontSize: 12,
    color: '#fff', // White text color
    marginTop: 10,
  },
});