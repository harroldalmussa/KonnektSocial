// screens/AuthScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  useColorScheme,
  Platform, 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  // Determine styles based on color scheme
  const cardBackgroundColor = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const titleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const descriptionColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const privacyTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const labelColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const inputBackgroundColor = colorScheme === 'dark' ? 'rgba(74, 85, 104, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const inputBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const inputTextColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const errorTextColor = colorScheme === 'dark' ? '#fca5a5' : '#ef4444';
  const registerTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const registerLinkColor = colorScheme === 'dark' ? '#93c5fd' : '#3b82f6';
  const dividerColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';


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
      console.log('Attempting login with:', email, password);

      try {
        const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

        const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:8081/users/login`, {
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
          console.log('Login successful:', data);
          Alert.alert('Success', 'Login successful!');
          navigation.replace('Main');
        } else {
          console.error('Login error:', data);
          Alert.alert('Login Failed', data.detail || 'An unexpected error occurred.');
        }
      } catch (error) {
        console.error('Network or API Error:', error);
        Alert.alert('Error', 'An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.authCard, { backgroundColor: cardBackgroundColor }]}>
          {/* Welcome Section */}
          {!showEmailLogin && (
            <>
              <View style={styles.imageContainer}>
                <Image source={require('../assets/razom-logo.png')} style={styles.razomLogo} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: titleColor }]}>Connect with Freedom and Security</Text>
                <Text style={[styles.description, { color: descriptionColor }]}>
                  Razom is designed to empower you with secure and private communication.
                  We believe in connecting people while prioritizing the safety and confidentiality of your data.
                </Text>
              </View>
            </>
          )}

          {/* Login Section */}
          {!showEmailLogin ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.signInEmailButton} onPress={() => setShowEmailLogin(true)}>
                <Text style={styles.buttonText}>Sign in with Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueGoogleButton} onPress={() => {/* Handle Continue with Google */ }}>
                <Text style={styles.buttonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Email/Password Input Fields when showEmailLogin is true
            <>
              <Text style={[styles.title, { color: titleColor, marginBottom: 24 }]}>Login</Text>
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

              <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => setShowEmailLogin(false)}>
                <Text style={[styles.registerLink, { color: registerLinkColor }]}>Back to Welcome</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Divider and Register Link */}
          <View style={[styles.dividerContainer, showEmailLogin && { marginTop: 20 }]}>
            <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
            <Text style={[styles.dividerText, { color: registerTextColor }]}>Don't have an account?</Text>
            <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
          </View>
          <Text style={[styles.registerLink, { color: registerLinkColor, textAlign: 'center' }]} onPress={() => navigation.navigate('Register')}>
            Register
          </Text>

          {/* Privacy Text */}
          {!showEmailLogin && (
            <Text style={[styles.privacyText, { color: privacyTextColor }]}>Your privacy is our priority.</Text>
          )}
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
  authCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
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
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  continueGoogleButton: {
    backgroundColor: '#ea4335',
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
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
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