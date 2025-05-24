// screens/navigation/AppNavigator.js
import React, { useState, useEffect, createContext } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';

// Corrected Import paths for your screen components
import AuthScreen from '../AuthScreen';
import RegisterScreen from '../RegisterScreen';
import MainTabs from '../main/MainTabs';
import ChatWindowScreen from '../main/ChatWindowScreen';
import NewChatScreen from '../main/NewChatScreen';
import AddContactScreen from '../AddContactScreen';
import SettingsScreen from '../SettingsScreen';
import AppearanceSettingsScreen from '../../screens/AppearanceSettingsScreen';
import HomeScreen from '../main/HomeScreen';
import EditProfileScreen from '../main/EditProfileScreen'; // Corrected import path for EditProfileScreen

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Create AuthContext
export const AuthContext = createContext();

// Placeholder components for drawer screens
const ForYouScreen = () => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  return (
    <View style={[styles.drawerScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.drawerScreenText, { color: textColor }]}>For You Content</Text>
    </View>
  );
};

const FavouritesScreen = () => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  return (
    <View style={[styles.drawerScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.drawerScreenText, { color: textColor }]}>Favourites Content</Text>
    </View>
  );
};

const CollectionsScreen = () => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  return (
    <View style={[styles.drawerScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.drawerScreenText, { color: textColor }]}>Collections Content</Text>
    </View>
  );
};

// Helper function for temporary screens
const getTempScreenContent = (title) => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return (
    <View style={[styles.tempScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.tempText, { color: textColor }]}>{title}</Text>
    </View>
  );
};

// Authentication Stack: Screens for login/registration
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main App Stack: Screens accessible after login
function MainAppStack() {
  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ChatWindow" component={ChatWindowScreen} />
      <Stack.Screen name="NewChat" component={NewChatScreen} />
      <Stack.Screen name="AddContact" component={AddContactScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AccountSettings" options={{ title: 'Account', headerShown: false }}>
        {() => getTempScreenContent('Account Settings')}
      </Stack.Screen>
      <Stack.Screen name="SecuritySettings" options={{ title: 'Security', headerShown: false }}>
        {() => getTempScreenContent('Security Settings')}
      </Stack.Screen>
      <Stack.Screen name="NotificationSettings" options={{ title: 'Notifications', headerShown: false }}>
        {() => getTempScreenContent('Notification Settings')}
      </Stack.Screen>
      <Stack.Screen name="StorageDataSettings" options={{ title: 'Storage and Data', headerShown: false }}>
        {() => getTempScreenContent('Storage and Data Settings')}
      </Stack.Screen>
      <Stack.Screen name="LanguageSettings" options={{ title: 'App Language', headerShown: false }}>
        {() => getTempScreenContent('App Language Settings')}
      </Stack.Screen>
      <Stack.Screen name="HelpCenter" options={{ title: 'Help Center', headerShown: false }}>
        {() => getTempScreenContent('Help Center')}
      </Stack.Screen>
      <Stack.Screen name="ReferFriend" options={{ title: 'Refer a Friend', headerShown: false }}>
        {() => getTempScreenContent('Refer a Friend')}
      </Stack.Screen>
      <Stack.Screen name="PrivacyPolicy" options={{ title: 'Privacy Policy', headerShown: false }}>
        {() => getTempScreenContent('Privacy Policy')}
      </Stack.Screen>
      <Stack.Screen name="ChatBackup" options={{ title: 'Chat Backup', headerShown: false }}>
        {() => getTempScreenContent('Chat Backup')}
      </Stack.Screen>
      <Stack.Screen name="TransferChats" options={{ title: 'Transfer Chats', headerShown: false }}>
        {() => getTempScreenContent('Transfer Chats')}
      </Stack.Screen>
      <Stack.Screen name="ChatHistory" options={{ title: 'Chat History', headerShown: false }}>
        {() => getTempScreenContent('Chat History')}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Root Navigator: Manages authentication state
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null); // Will store the access_token

  // Sign-in function to be exposed via context
  const signIn = async (token, userData) => {
    try {
      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUserToken(token); // Update state to trigger re-render
    } catch (error) {
      console.error('Failed to set login data in AsyncStorage:', error);
    }
  };

  // Sign-out function to be exposed via context
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_data');
      setUserToken(null); // Update state to trigger re-render
    } catch (error) {
      console.error('Failed to clear data from AsyncStorage:', error);
    }
  };

  useEffect(() => {
    const checkUserToken = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        setUserToken(token); // Set initial token state
      } catch (error) {
        console.error('Failed to load access token from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserToken();
  }, []); // Empty dependency array means this runs only once on mount

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5b4285" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ userToken, signIn, signOut }}>
      {userToken ? (
        // User is logged in, show the main app drawer
        <Drawer.Navigator initialRouteName="HomeStack" screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="HomeStack" component={MainAppStack} options={{ drawerLabel: 'Home' }} />
          <Drawer.Screen name="For You" component={ForYouScreen} />
          <Drawer.Screen name="Favourites" component={FavouritesScreen} />
          <Drawer.Screen name="Collections" component={CollectionsScreen} />
        </Drawer.Navigator>
      ) : (
        // No user token, show the authentication stack
        <AuthStack />
      )}
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  drawerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerScreenText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tempScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  tempText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5b4285',
  },
});