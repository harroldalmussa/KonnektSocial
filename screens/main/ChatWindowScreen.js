// screens/main/ChatWindowScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform // Added for potential platform-specific styling if needed
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Added for background consistency

export default function ChatWindowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, email, img } = route.params || {};

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <LinearGradient
        colors={['#ffffff', '#3B82F6']} // Consistent gradient background
        style={styles.gradientBackground}
      >
        {/* Chat window content will replace this */}
        <View style={styles.chatWindowContentCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>&lt; Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Chat with {user || 'Someone'}</Text>
          <Text>Email: {email || 'N/A'}</Text>
          <Text style={{ marginTop: 20, textAlign: 'center', color: '#333' }}>
            This will be your chat window content from chat-window.html
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 60 : 40, // Space from top status bar/notch area
    paddingBottom: 100, // Space for the bottom navigation bar
  },
  chatWindowContentCard: { // New style for the main content card
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glassmorphism background
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
    width: '100%',
    alignItems: 'center', // Center content horizontally within the card
  },
  backButton: {
    position: 'absolute',
    top: 20, // Adjusted top position within the card
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 50, // Space below back button
    color: '#1f2937',
  },
});