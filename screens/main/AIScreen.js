// screens/main/AIScreen.js
import React from 'react';
import { SafeAreaView, Text, View, StyleSheet, useColorScheme } from 'react-native';

export default function AIScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.title, { color: textColor }]}>AI Feature Coming Soon!</Text>
      <Text style={[styles.subtitle, { color: textColor }]}>This is where your AI search and interaction will happen.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
  },
});