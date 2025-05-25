// screens/navigation/AppNavigator.js (Corrected and Complete)
import React, { useState, useEffect, useMemo } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, useColorScheme, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import AuthScreen from '../auth/AuthScreen';
import RegisterScreen from '../auth/RegisterScreen';
import MainTabs from '../navigation/MainTabs';
import ChatWindowScreen from '../main/ChatWindowScreen';
import NewChatScreen from '../main/NewChatScreen'; // Correct import for NewChatScreen
import AddContactScreen from '../features/contacts/AddContactScreen';
import SettingsScreen from '../main/SettingsScreen';
import AppearanceSettingsScreen from '../settings/AppearanceSettingsScreen';
import EditProfileScreen from '../main/EditProfileScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// These are your existing temporary screens, no changes needed to them.
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

// Create dedicated components for your temporary screens
// This is the standard way to render components with Stack.Screen
const AccountSettingsScreen = () => getTempScreenContent('Account Settings');
const SecuritySettingsScreen = () => getTempScreenContent('Security Settings');
const NotificationSettingsScreen = () => getTempScreenContent('Notification Settings');
const StorageDataSettingsScreen = () => getTempScreenContent('Storage and Data Settings');
const LanguageSettingsScreen = () => getTempScreenContent('App Language Settings');
const HelpCenterScreen = () => getTempScreenContent('Help Center');
const ReferFriendScreen = () => getTempScreenContent('Refer a Friend');
const PrivacyPolicyScreen = () => getTempScreenContent('Privacy Policy');
const ChatBackupScreen = () => getTempScreenContent('Chat Backup');
const TransferChatsScreen = () => getTempScreenContent('Transfer Chats');
const ChatHistoryScreen = () => getTempScreenContent('Chat History');


// Authentication Stack: Screens for login/registration
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      {/* NewChatScreen moved to MainAppStack as it's typically accessed after login */}
    </Stack.Navigator>
  );
}

// Main App Stack: Screens accessible after login
function MainAppStack() {
  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ChatWindow" component={ChatWindowScreen} />
      {/* Corrected: NewChatScreen name is consistent and placed here */}
      <Stack.Screen name="NewChatScreen" component={NewChatScreen} />
      <Stack.Screen name="AddContact" component={AddContactScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      {/* Corrected: Pass component as prop instead of inline render function */}
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="StorageDataSettings" component={StorageDataSettingsScreen} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="ReferFriend" component={ReferFriendScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="ChatBackup" component={ChatBackupScreen} />
      <Stack.Screen name="TransferChats" component={TransferChatsScreen} />
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator: Manages authentication state
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null); // Will store the access_token
  const [userData, setUserData] = useState(null); // Added state to store user data

  // Sign-in function to be exposed via context
  const signIn = async (token, user) => {
    try {
      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      setUserToken(token); // Update state to trigger re-render
      setUserData(user); // Store user data
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
      setUserData(null); // Clear user data
    } catch (error) {
      console.error('Failed to clear data from AsyncStorage:', error);
    }
  };

  useEffect(() => {
    const checkUserToken = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const storedUserData = await AsyncStorage.getItem('user_data');
        setUserToken(token); // Set initial token state
        setUserData(storedUserData ? JSON.parse(storedUserData) : null); // Set initial user data state
      } catch (error) {
        console.error('Failed to load access token or user data from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserToken();
  }, []);

  const authContext = useMemo(() => ({
    userToken,
    userData,
    signIn,
    signOut,
  }), [userToken, userData]); // signIn and signOut are stable functions, so removing from dependency array is fine

  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5b4285" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {userToken ? (
        <Drawer.Navigator initialRouteName="HomeStack" screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="HomeStack" component={MainAppStack} options={{ drawerLabel: 'Home' }} />
          <Drawer.Screen name="For You" component={ForYouScreen} />
          <Drawer.Screen name="Favourites" component={FavouritesScreen} />
          <Drawer.Screen name="Collections" component={CollectionsScreen} />
        </Drawer.Navigator>
      ) : (
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