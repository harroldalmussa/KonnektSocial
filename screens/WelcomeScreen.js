// screens/WelcomeScreen.js
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo section, now placed first for the screenshot-like layout */}
        <View style={styles.imageContainer}>
          <Image source={require('../assets/razom-logo.png')} style={styles.razomLogo} />
        </View>

        {/* Text and Buttons section */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Connect with Freedom and Security</Text>
          <Text style={styles.description}>
            Razom is designed to empower you with secure and private communication.
            We believe in connecting people while prioritizing the safety and confidentiality of your data.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinNowButton} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.buttonText}>Join Now</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.privacyText}>Your privacy is our priority.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure gradient from App.js shows through
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glassmorphism background
    borderRadius: 16, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // Android shadow
    padding: 24,
    width: '100%',
    maxWidth: 768,
    flexDirection: 'column',
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Space below the image
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
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  signInButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  joinNowButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  privacyText: {
    color: '#4b5563',
    fontSize: 12,
    textAlign: 'center',
  },
});