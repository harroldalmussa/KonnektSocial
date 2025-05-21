// screens/main/MainTabs.js

// 1. Import necessary React and React Native components and hooks
import React from 'react';
import {
  Dimensions, // Potentially useful for dynamic sizing, though not strictly used in final tabBarStyle
  Platform,   // IMPORTANT: Added for correct rendering
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import ChatWindowScreen from './ChatWindowScreen'; // Screen to navigate to from ChatListScreen

// Initialize the main Tab Navigator
const Tab = createBottomTabNavigator();

// Initialize a Stack Navigator specifically for the Chat flow
// This allows you to navigate from ChatListScreen to ChatWindowScreen within the Chat tab
const ChatStack = createNativeStackNavigator();

function ChatFlow() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="ChatWindow" component={ChatWindowScreen} />
    </ChatStack.Navigator>
  );
}

// Main component for the bottom tab navigation
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home" // Sets the initial active tab to Profile
      screenOptions={({ route }) => ({
        // Function to define the icon for each tab
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          // Returns an Ionicons component for the tab icon
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        // Styling for the tab bar items and labels
        tabBarActiveTintColor: '#3b82f6', // Active tab color (blue-500 equivalent)
        tabBarInactiveTintColor: 'gray', // Inactive tab color
        headerShown: false, // Hides the header bar for individual screens within the tab navigator
        tabBarStyle: {
          // Styles for the entire tab bar container to make it floating and rounded
          backgroundColor: 'rgba(52, 52, 52, 0.9)', // Dark background with transparency (zinc-800)
          position: 'absolute', // Makes it float over content
          bottom: 25, // Lift it from the bottom edge
          left: 30, // Margin from the left side
          right: 30, // Margin from the right side
          borderRadius: 999, // High border-radius for a pill shape (rounded-full)
          height: 65, // Fixed height for the tab bar
          paddingBottom: 0, // Adjust padding at the bottom (useful for iOS safe area)
          shadowColor: '#000', // Shadow for floating effect
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8, // Android shadow property
        },
        tabBarLabelStyle: {
          // Styles for the text label below the icon
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 5, // Using Platform.OS here
        },
        tabBarItemStyle: {
          // Styles for each individual tab item (Home, Chat, Profile)
          paddingVertical: 5, // Add some vertical padding inside each tab item
        },
      })}
    >
      {/* Define each screen that belongs to a tab */}
      <Tab.Screen name="Home" component={HomeScreen} />
      {/* The Chat tab now renders our ChatFlow (nested Stack Navigator) */}
      <Tab.Screen name="Chat" component={ChatFlow} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // This StyleSheet can be empty or contain other common styles if needed by children
  // For this specific file, most styles are inline in screenOptions.
});