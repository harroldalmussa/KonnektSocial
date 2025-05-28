// screens/AuthScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { AuthContext } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showUsernameLogin, setShowUsernameLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const { signIn } = useContext(AuthContext);

  const titleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const descriptionColor = colorScheme === 'dark' ? '#cbd5e0' : '#374151';
  const privacyTextColor = colorScheme === 'dark' ? '#a0aec0' : '#4b5563';
  const labelColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const inputBackgroundColor = colorScheme === 'dark' ? 'rgba(74, 85, 104, 0.7)' : 'white';
  const inputBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const inputTextColor = colorScheme === 'dark' ? '#e2e8f0' : '#1f2937';
  const errorTextColor = colorScheme === 'dark' ? '#fca5a5' : '#ef4444';
  const registerTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const registerLinkColor = colorScheme === 'dark' ? '#93c5fd' : '#61469B';
  const dividerColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const buttonPrimaryColor = '#61469B';

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID_FROM_GOOGLE_CLOUD_CONSOLE',
    iosClientId: 'YOUR_IOS_CLIENT_ID_FROM_GOOGLE_CLOUD_CONSOLE',
    webClientId: 'YOUR_WEB_CLIENT_ID_FROM_GOOGLE_CLOUD_CONSOLE',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Google Auth Success:', authentication);
      handleGoogleAuthBackend(authentication.accessToken || authentication.idToken, authentication.type);
    } else if (response?.type === 'cancel') {
      Alert.alert('Google Sign-In Cancelled', 'You cancelled the sign-in process.');
    } else if (response?.type === 'error') {
      console.error('Google Sign-In Error:', response.error);
      Alert.alert('Google Sign-In Error', `An error occurred: ${response.error?.message || 'Unknown error'}`);
    }
  }, [response]);

  const handleGoogleAuthBackend = async (token, tokenType) => {
    try {
      const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

      const backendResponse = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          tokenType: tokenType,
        }),
      });

      const data = await backendResponse.json();

      if (backendResponse.ok) {
        if (data.access_token) {
          await signIn(data.access_token, data.user);
        } else {
          console.warn("Google login successful but no access_token received from server.");
          Alert.alert('Login Warning', 'Could not retrieve session token. Please try logging in again.');
          return;
        }

        Alert.alert('Success', 'Google Sign-In successful!');
        console.log("Google Login: AsyncStorage updated, AppNavigator will handle the transition.");
      } else {
        console.error('Google Login error:', data);
        Alert.alert('Google Login Failed', data.detail || 'An unexpected error occurred during Google login.');
      }
    } catch (error) {
      console.error('Network or API Error during Google Auth Backend Call:', error);
      Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
    }
  };

  const handleEmailLogin = async () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

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
    }

    if (isValid) {
      console.log('Attempting login with email:', email, password);

      try {
        const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

        const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/login`, {
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
          if (data.access_token) {
            await signIn(data.access_token, data.user);
          } else {
            console.warn("Login successful but no access_token received from server.");
            Alert.alert('Login Warning', 'Could not retrieve session token. Please try logging in again.');
            return;
          }

          Alert.alert('Success', 'Login successful!');
          console.log("Email Login: AsyncStorage updated, AppNavigator will handle the transition.");
        } else {
          console.error('Login error:', data);
          Alert.alert('Login Failed', data.detail || 'An unexpected error occurred.');
        }
      } catch (error) {
        console.error('Network or API Error:', error);
        Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
      }
    }
  };

  const handleUsernameLogin = async () => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');

    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    if (isValid) {
      console.log('Attempting login with username:', username, password);

      try {
        const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

        const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/login-username`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.access_token) {
            await signIn(data.access_token, data.user);
          } else {
            console.warn("Login successful but no access_token received from server.");
            Alert.alert('Login Warning', 'Could not retrieve session token. Please try logging in again.');
            return;
          }

          Alert.alert('Success', 'Login successful!');
          console.log("Username Login: AsyncStorage updated, AppNavigator will handle the transition.");
        } else {
          console.error('Login error:', data);
          Alert.alert('Login Failed', data.detail || 'An unexpected error occurred.');
        }
      } catch (error) {
        console.error('Network or API Error:', error);
        Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
      }
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'white' }]}>
        {!showEmailLogin && !showUsernameLogin && (
          <>
            <View style={styles.imageContainer}>
              <Image source={require('../../assets/razom-logo.png')} style={styles.razomLogo} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: titleColor }]}>Login to your account.</Text>
              <Text style={{ color: descriptionColor }}>
                KonnektSocial
              </Text>
              <Text style={[styles.description, { color: descriptionColor }]}>
                designed to better connect you with your friends and family.
              </Text>
            </View>
          </>
        )}

        {!showEmailLogin && !showUsernameLogin ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.signInEmailButton, { backgroundColor: buttonPrimaryColor }]} onPress={() => { setShowUsernameLogin(true); setEmail(''); setPassword(''); }}>
              <Text style={styles.buttonText}>Sign in with Username</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.signInEmailButton, { backgroundColor: buttonPrimaryColor }]} onPress={() => { setShowEmailLogin(true); setUsername(''); setPassword(''); }}>
              <Text style={styles.buttonText}>Sign in with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueGoogleButton, { backgroundColor: buttonPrimaryColor }]}
              disabled={!request}
              onPress={() => {
                promptAsync();
              }}
            >
              <Text style={styles.buttonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        ) : showEmailLogin ? (
          <>
            <Text style={[styles.title, { color: titleColor, marginBottom: 24 }]}>Login with Email</Text>
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
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
              {passwordError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity style={[styles.loginButton, { backgroundColor: buttonPrimaryColor }]} onPress={handleEmailLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setShowEmailLogin(false)}>
              <Text style={[styles.registerLink, { color: registerLinkColor }]}>Back to Welcome</Text>
            </TouchableOpacity>
          </>
        ) : (
            <>
            <Text style={[styles.title, { color: titleColor, marginBottom: 24 }]}>Login with Username</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: labelColor }]}>Username:</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: inputTextColor },
                ]}
                placeholder="Username"
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#6b7280'}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                value={username}
                onChangeText={setUsername}
              />
              {usernameError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{usernameError}</Text> : null}
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
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
              {passwordError ? <Text style={[styles.errorText, { color: errorTextColor }]}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity style={[styles.loginButton, { backgroundColor: buttonPrimaryColor }]} onPress={handleUsernameLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setShowUsernameLogin(false)}>
              <Text style={[styles.registerLink, { color: registerLinkColor }]}>Back to Welcome</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.dividerContainer, (showEmailLogin || showUsernameLogin) && { marginTop: 20 }]}>
          <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
          <Text style={[styles.dividerText, { color: registerTextColor }]}>Don't have an account?</Text>
          <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
        </View>
        <Text style={[styles.registerLink, { color: registerLinkColor, textAlign: 'center' }]} onPress={() => navigation.navigate('UsernameCheck')}>
          Register
        </Text>

        {!showEmailLogin && !showUsernameLogin && (
          <Text style={[styles.privacyText, { color: privacyTextColor }]}>Your privacy is our priority.</Text>
        )}
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
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  razomLogo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    borderRadius: 20,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  signInEmailButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  continueGoogleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
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
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  privacyText: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
  },
  registerLink: {
    fontWeight: 'bold',
  },
});