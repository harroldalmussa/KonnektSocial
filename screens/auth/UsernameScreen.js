// screens/UsernameScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  useColorScheme, 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function UsernameScreen() {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const colorScheme = useColorScheme(); 
  const titleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const labelColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const inputBackgroundColor = colorScheme === 'dark' ? 'rgba(74, 85, 104, 0.7)' : 'white';
  const inputBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const inputTextColor = colorScheme === 'dark' ? '#e2e8f0' : '#1f2937';
  const errorTextColor = colorScheme === 'dark' ? '#fca5a5' : '#ef4444';
  const buttonPrimaryColor = '#61469B'; 
  const backButtonTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const backLinkColor = colorScheme === 'dark' ? '#93c5fd' : '#61469B';


  const handleCheckUsername = async () => {
    setUsernameError('');
    if (!username.trim()) {
      setUsernameError('Username is required');
      return;
    }
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    try {
      const YOUR_LOCAL_IP_ADDRESS = '****'; 

      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/check-username?username=${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.available) {
        Alert.alert('Success', data.message, [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Register', { username: username }), 
          },
        ]);
      } else {
        setUsernameError(data.message || 'Username check failed.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Network or API Error:', error);
      Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'white' }]}>
        <Text style={[styles.title, { color: titleColor, marginBottom: 24 }]}>Choose a Username</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: labelColor }]}>Username:</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: inputTextColor },
            ]}
            placeholder="Choose your unique username"
            placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#6b7280'}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          {usernameError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{usernameError}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.checkButton, { backgroundColor: buttonPrimaryColor }]}
          onPress={handleCheckUsername}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Check Availability</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backLink, { color: backLinkColor }]}>Back to Login</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 12, 
    paddingHorizontal: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  errorText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  checkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  backLink: {
    fontWeight: 'bold',
  },
});