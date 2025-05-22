// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  useColorScheme,
  Platform,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  // Determine styles based on color scheme
  const registerCardBackgroundColor = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const titleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const labelColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const inputBackgroundColor = colorScheme === 'dark' ? 'rgba(74, 85, 104, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const inputBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const inputTextColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const errorTextColor = colorScheme === 'dark' ? '#fca5a5' : '#ef4444';
  const loginTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const loginLinkColor = colorScheme === 'dark' ? '#93c5fd' : '#3b82f6';

  const handleRegister = async () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword.trim()) {
        setConfirmPasswordError('Confirm Password is required');
        isValid = false;
    } else if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        isValid = false;
    }

    if (isValid) {
      console.log('Attempting registration with:', email, password);

      try {
        const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

        const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:8081/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Registration successful:', data);
          Alert.alert('Success', 'Registration successful! Please log in.');
          navigation.replace('Login');
        } else {
          console.error('Registration error:', data);
          Alert.alert('Registration Failed', data.detail || 'An unexpected error occurred.');
        }
      } catch (error) {
        console.error('Network or API Error:', error);
        Alert.alert('Error', 'An error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.registerCard, { backgroundColor: registerCardBackgroundColor }]}>
          <Text style={[styles.title, { color: titleColor }]}>Register</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Email:</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: inputTextColor },
              ]}
              placeholder="Email"
              placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#6b7280'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Password:</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: inputTextColor },
              ]}
              placeholder="Password"
              placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#6b7280'}
              secureTextEntry
              autoCorrect={false}
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
            />
            {passwordError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{passwordError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Confirm Password:</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: inputTextColor },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#6b7280'}
              secureTextEntry
              autoCorrect={false}
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {confirmPasswordError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{confirmPasswordError}</Text> : null}
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <Text style={[styles.loginText, { color: loginTextColor }]}>
            Already have an account?{' '}
            <Text style={[styles.loginLink, { color: loginLinkColor }]} onPress={() => navigation.navigate('Login')}>
              Login
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure it's always transparent to show App.js gradient
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent', // Ensure it's always transparent
  },
  registerCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  registerButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  loginLink: {
    fontWeight: 'bold',
  },
});