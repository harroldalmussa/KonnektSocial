// screens/main/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Keep useNavigation for logout

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleLogout = () => {
    // This will be called from the simple logout button
    console.log('Logout button pressed from Simplified Profile Screen!');
    navigation.replace('Login'); // Go back to Login
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentCard}>
        <Text style={styles.title}>Profile Screen (Simplified)</Text>
        <Text>If you see this, the issue is within ProfileScreen's original complex code.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Keep transparent for gradient
    paddingHorizontal: 20,
    paddingTop: 60, // Sufficient top padding
    paddingBottom: 100, // Sufficient bottom padding for tab bar
  },
  contentCard: { // Basic card style
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});