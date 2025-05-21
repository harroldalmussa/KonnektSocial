// screens/main/ChatListScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
// No other imports needed for this basic test

export default function ChatListScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentCard}>
        <Text style={styles.title}>Chat List Screen (Simplified)</Text>
        <Text>If you see this, the issue is within ChatListScreen's original complex code.</Text>
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
});