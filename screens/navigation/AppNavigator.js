// screens/navigation/AppNavigator.js
import { useState, useEffect, useMemo } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, useColorScheme, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import AuthScreen from '../auth/AuthScreen';
import RegisterDetailsScreen from '../auth/RegisterDetailsScreen';
import MainTabs from './MainTabs';
import ChatWindowScreen from '../main/ChatWindowScreen';
import NewChatScreen from '../main/NewChatScreen';
import AddContactScreen from '../features/contacts/AddContactScreen';
import SettingsScreen from '../main/SettingsScreen';
import AppearanceSettingsScreen from '../settings/AppearanceSettingsScreen';
import EditProfileScreen from '../main/EditProfileScreen';
import SecuritySettings from '../settings/SecuritySettings';
import UsernameScreen from '../auth/UsernameScreen';
import ShareProfileScreen from '../main/ShareProfileScreen';
import MomentsScreen from '../main/MomentsScreen'; 
import SavedScreen from '../main/SavedScreen'; 
import ArchivedScreen from '../main/ArchivedScreen'; 
import UserProfileScreen from '../main/UserProfileScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const FavouritesScreen = () => { 
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  return (
    <View style={[styles.drawerScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.drawerScreenText, { color: textColor }]}>Favourites Content (Will be Moments)</Text>
    </View>
  );
};

const CollectionsScreen = () => { 
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  return (
    <View style={[styles.drawerScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.drawerScreenText, { color: textColor }]}>Collections Content (Will be Saved)</Text>
    </View>
  );
};

const getTempScreenContent = (title, bgColor, textColor) => {
  return (
    <View style={[styles.tempScreen, { backgroundColor: bgColor }]}>
      <Text style={[styles.tempText, { color: textColor }]}>{title}</Text>
    </View>
  );
};

const AccountSettingsScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Account Settings', bgColor, textColor);
};
const NotificationSettingsScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Notification Settings', bgColor, textColor);
};
const StorageDataSettingsScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Storage and Data Settings', bgColor, textColor);
};
const LanguageSettingsScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('App Language Settings', bgColor, textColor);
};
const HelpCenterScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Help Center', bgColor, textColor);
};
const ReferFriendScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Refer a Friend', bgColor, textColor);
};
const PrivacyPolicyScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Privacy Policy', bgColor, textColor);
};
const ChatBackupScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Chat Backup', bgColor, textColor);
};
const TransferChatsScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Transfer Chats', bgColor, textColor);
};
const ChatHistoryScreen = () => {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  return getTempScreenContent('Chat History', bgColor, textColor);
};

// Screens for login/registration
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="UsernameCheck" component={UsernameScreen} />
      <Stack.Screen name="Register" component={RegisterDetailsScreen} />
    </Stack.Navigator>
  );
}

// Screens accessible after login
function MainAppStack() {
  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ChatWindow" component={ChatWindowScreen} />
      <Stack.Screen name="NewChatScreen" component={NewChatScreen} />
      <Stack.Screen name="AddContact" component={AddContactScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ShareProfile" component={ShareProfileScreen} />
      <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettings} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
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

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null); 

  const signIn = async (token, user) => {
    try {
      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      setUserToken(token); 
      setUserData(user); 
    } catch (error) {
      console.error('Failed to set login data in AsyncStorage:', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_data');
      setUserToken(null); 
      setUserData(null); 
    } catch (error) {
      console.error('Failed to clear data from AsyncStorage:', error);
    }
  };

  useEffect(() => {
    const checkUserToken = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const storedUserData = await AsyncStorage.getItem('user_data');
        setUserToken(token); 
        setUserData(storedUserData ? JSON.parse(storedUserData) : null); 
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
  }), [userToken, userData]); 

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
        <Drawer.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff',
            },
            drawerLabelStyle: {
              color: colorScheme === 'dark' ? '#f7fafc' : '#1f2937',
            },
            drawerActiveTintColor: '#5b4285', 
            drawerInactiveTintColor: colorScheme === 'dark' ? '#cbd5e0' : '#4b5563', 
          }}
        >
          <Drawer.Screen name="Home" component={MainAppStack} options={{ drawerLabel: 'Home' }} /> 
          <Drawer.Screen name="Moments" component={MomentsScreen || FavouritesScreen} options={{ drawerLabel: 'Moments' }} /> 
          <Drawer.Screen name="Saved" component={SavedScreen || CollectionsScreen} options={{ drawerLabel: 'Saved' }} /> 
          <Drawer.Screen name="Archived" component={ArchivedScreen || FavouritesScreen} options={{ drawerLabel: 'Archived' }} />
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