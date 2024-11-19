import AsyncStorage from '@react-native-async-storage/async-storage';
import getToken from './Jwt/getToken'; // Adjust the path according to your project structure

// Fetch account data using the given account ID
export const fetchAccountData = async (accID) => {
  try {
    const response = await fetch(`http://103.185.184.35:6969/api/Account/${accID}`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
      },
    });

    const result = await response.json();

    if (response.ok && result.data) {
      await AsyncStorage.setItem('@accountData', JSON.stringify(result.data));
      console.log('Account data stored successfully');
    } else {
      console.error('Failed to fetch account data:', result.message);
      throw new Error(result.message || 'Failed to fetch account data');
    }
  } catch (error) {
    console.error('Error fetching account data:', error);
    throw error;
  }
};

export default fetchAccountData;
