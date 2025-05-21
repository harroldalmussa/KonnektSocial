// screens/main/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; 

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Still transparent for gradient
    // Removed specific padding here to make it as simple as possible
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});