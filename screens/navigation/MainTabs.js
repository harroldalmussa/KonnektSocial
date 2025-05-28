// screens/main/MainTabs.js
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

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../main/HomeScreen';
import ChatListScreen from '../main/ChatListScreen';
import ProfileScreen from '../main/ProfileScreen';
import AIScreen from '../main/AIScreen'; 
import CreateScreen from '../main/CreateScreen';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();

function ChatFlow() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
    </ChatStack.Navigator>
  );
}

export default function MainTabs() {
  const colorScheme = useColorScheme();

  const tabBackgroundColor = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const inactiveTintColor = colorScheme === 'dark' ? '#cbd5e0' : 'gray';
  const activeTintColor = '#5b4285';

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
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'AI') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={25} color={color} />;
        },
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: tabBackgroundColor,
          position: 'absolute',
          bottom: 50,
          marginHorizontal: 30,
          borderRadius: 999,
          height: 65,
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 8,
          alignSelf: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          paddingTop: 12,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatFlow} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({});