// App.js
import * as React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StyleSheet, useColorScheme, Appearance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import AppNavigator from './screens/navigation/AppNavigator'; 

export default function App() {
  const systemColorScheme = useColorScheme();
  const [appTheme, setAppTheme] = React.useState(systemColorScheme);

  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) {
          if (storedTheme === 'system') {
            setAppTheme(systemColorScheme);
          } else {
            setAppTheme(storedTheme);
          }
        } else {
          setAppTheme(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load app theme:', error);
      }
    };

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (appTheme === 'system') {
        setAppTheme(colorScheme);
      }
    });

    loadTheme();

    return () => {
      subscription.remove();
    };
  }, [systemColorScheme, appTheme]);

  const gradientColors = appTheme === 'dark'
    ? ['#1a202c', '#000000']
    : ['#ffffff', '#3B82F6'];

  // Apply dark/default theme to NavigationContainer
  const navTheme = appTheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradientBackground}
    >
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
});