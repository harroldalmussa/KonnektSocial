// App.js (at the root of your project)
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

// Import LinearGradient for the background
import { LinearGradient } from 'expo-linear-gradient'; // Make sure this is installed: npx expo install expo-linear-gradient

// Import your screen components
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabs from './screens/main/MainTabs';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <LinearGradient
      colors={['#ffffff', '#3B82F6']} // Gradient colors: white to blue-500
      style={styles.gradientBackground}
    >
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Join Now' }}
          />
          {/* 'Main' route now points to the Tab Navigator for the main authenticated flow */}
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }} // Hide header for the tab navigator itself
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1, // Make sure it takes up the full screen
  },
});