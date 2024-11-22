import React, { useState } from 'react';
import {
  GoogleSignin, GoogleSigninButton, statusCodes
} from '@react-native-google-signin/google-signin';
import getToken from '../components/Jwt/getToken';
import { View, Text, StyleSheet , ActivityIndicator} from 'react-native';
import { useRouter } from 'expo-router';
import storeToken from '../components/Jwt/storeToken';
import fetchAccountData from '../components/fetchAccountData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function () {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: "972526541482-rmn9q4stgoflejc9g9u2hnm382bgr51g.apps.googleusercontent.com",
  });

  const storeDecodedToken = async (token: any) => {
    try {
      await AsyncStorage.setItem('@decoded_token', JSON.stringify(token));
      console.log('Decoded token stored successfully');
    } catch (error) {
      console.error('Error storing decoded token: ', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        await GoogleSignin.signOut();
        setLoading(false);
        return;
      }

      const response = await fetch(`https://smnc.site/api/Auth/google-login?googleIdToken=${idToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        await GoogleSignin.signOut();
        setErrorMessage(data.errors);
        setLoading(false);
        return;
      }

      const { access_token: accessToken, status, message, errors } = data.data;

      if (status === false) {
        await GoogleSignin.signOut();
        setErrorMessage(errors);
        setLoading(false);
        return;
      }
      console.log('accesstoken:', accessToken);
      await storeToken(accessToken);
      const decodedToken = await getToken();
      console.log('id:', decodedToken.id);
      await fetchAccountData(decodedToken.id);
      console.log('decodedToken:', decodedToken);
      setLoading(false);
      router.push("/MenuScreen");

    } catch (error: any) {
      await GoogleSignin.signOut();
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.errors);
      } else {
        setErrorMessage('An unexpected error occurred during sign-in.');
      }
      handleSignInError(error);
      setLoading(false);
    }
  };


  const handleSignInError = (error: any) => {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        setErrorMessage("User cancelled the login flow");
        console.log("User cancelled the login flow");
        break;
      case statusCodes.IN_PROGRESS:
        setErrorMessage("Operation (e.g. sign in) is in progress already");
        console.log("Operation (e.g. sign in) is in progress already");
        break;
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        setErrorMessage("Play services not available or outdated");
        console.log("Play services not available or outdated");
        break;
      default:
        setErrorMessage('An unexpected error occurred during sign-in.');
        console.log("An unexpected error occurred:", error);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>

      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={handleSignIn}
      />
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});
