// screens/main/MainTabs.js

// 1. Import necessary React and React Native components and hooks
import React from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

// 2. Import React Navigation components
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

// 3. Import icons
import { Ionicons } from '@expo/vector-icons';

// 4. Import your screen components that will be part of the tabs
import HomeScreen from './HomeScreen';
import ChatListScreen from './ChatListScreen';
import ProfileScreen from './ProfileScreen';

// Initialize the main Tab Navigator
const Tab = createBottomTabNavigator();

// Initialize a Stack Navigator specifically for the Chat flow
const ChatStack = createNativeStackNavigator();

function ChatFlow() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
    </ChatStack.Navigator>
  );
}

// Main component for the bottom tab navigation
export default function MainTabs() {
  const colorScheme = useColorScheme();

  const tabBackgroundColor = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const inactiveTintColor = colorScheme === 'dark' ? '#cbd5e0' : 'gray';

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={25} color={color} />;
        },
        tabBarActiveTintColor: '#5b4285',
        tabBarInactiveTintColor: inactiveTintColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBackgroundColor,
          position: 'absolute',
          bottom: 30,
          marginHorizontal: 15, 
          borderRadius: 999,
          height: 65,
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1, // This is crucial for even spacing and letting margins constrain width
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatFlow} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Most styles are inline for tab bar options
});