// App.js (at the root of your project)
import * as React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'; // <--- Ensure DefaultTheme and DarkTheme are imported here
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, useColorScheme, Appearance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your screen components
import AuthScreen from './screens/AuthScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabs from './screens/main/MainTabs';
import ChatWindowScreen from './screens/main/ChatWindowScreen';
import NewChatScreen from './screens/main/NewChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import AppearanceSettingsScreen from './screens/AppearanceSettingsScreen';

const Stack = createNativeStackNavigator();

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

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradientBackground}
    >
      <NavigationContainer theme={appTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator initialRouteName="Auth">
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Join Now' }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatWindow"
            component={ChatWindowScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewChat"
            component={NewChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AppearanceSettings"
            component={AppearanceSettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="AccountSettings" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Account Settings</Text></View>} options={{ title: 'Account', headerShown: false }} />
          <Stack.Screen name="SecuritySettings" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Security Settings</Text></View>} options={{ title: 'Security', headerShown: false }} />
          <Stack.Screen name="NotificationSettings" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Notification Settings</Text></View>} options={{ title: 'Notifications', headerShown: false }} />
          <Stack.Screen name="StorageDataSettings" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Storage and Data Settings</Text></View>} options={{ title: 'Storage and Data', headerShown: false }} />
          <Stack.Screen name="LanguageSettings" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>App Language Settings</Text></View>} options={{ title: 'App Language', headerShown: false }} />
          <Stack.Screen name="HelpCenter" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Help Center</Text></View>} options={{ title: 'Help Center', headerShown: false }} />
          <Stack.Screen name="ReferFriend" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Refer a Friend</Text></View>} options={{ title: 'Refer a Friend', headerShown: false }} />
          <Stack.Screen name="PrivacyPolicy" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Privacy Policy</Text></View>} options={{ title: 'Privacy Policy', headerShown: false }} />
          <Stack.Screen name="ChatBackup" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Chat Backup</Text></View>} options={{ title: 'Chat Backup', headerShown: false }} />
          <Stack.Screen name="TransferChats" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Transfer Chats</Text></View>} options={{ title: 'Transfer Chats', headerShown: false }} />
          <Stack.Screen name="ChatHistory" component={() => <View style={styles.tempScreen}><Text style={styles.tempText}>Chat History</Text></View>} options={{ title: 'Chat History', headerShown: false }} />

        </Stack.Navigator>
      </NavigationContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  tempScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginTop: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  tempText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});