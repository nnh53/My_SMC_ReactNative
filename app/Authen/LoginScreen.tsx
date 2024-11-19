import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, TouchableOpacity } from 'react-native';
import Auth from '../../components/Auth';
import { useRouter } from 'expo-router';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

const { width } = Dimensions.get('window');
const LoginScreen = () => {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500, // Slide in over 0.5 seconds
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const navigateToStaffLogin = () => {
    router.push('/Authen/LoginStaffScreen');
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/Layer-1.png')} // Replace with your image path
          style={styles.logo}
        />
        <Text style={styles.welcome}>WELCOME BACK</Text>
        <Auth />
        <TouchableOpacity style={styles.button} onPress={navigateToStaffLogin}>
          <Text style={styles.buttonText}>Event Staff Login</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10, // Reduced margin to bring it closer to the button
  },
  welcome: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 30, // Adjusted margin to position it closer to the button
  },
  googleButton: {
    marginVertical: 20,
  },
  button: {
    width: '80%', // Match the width of the GoogleSigninButton
    paddingVertical: 10,
    backgroundColor: '#00cc00',
    borderRadius: 5,
    marginTop:50,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});

export default LoginScreen;
