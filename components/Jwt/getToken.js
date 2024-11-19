import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('@userToken');

    if (token) {
      const encodedToken = encodeURIComponent(token);
      const response = await fetch(`http://103.185.184.35:6969/api/Auth/token-decode?token=${encodedToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result && result.data && result.data.decodedClaims) {
        return result.data.decodedClaims;
      } else {
        console.error('Invalid token decode response:', result);
        throw new Error('Invalid token decode response');
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve or decode token:', error);
    return null;
  }
};

export default getToken;
