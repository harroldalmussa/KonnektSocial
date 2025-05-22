// screens/main/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Platform, 
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for profile picture if none is found
const DEFAULT_PROFILE_PIC = require('../../assets/razom-logo.png'); // Adjust path as needed

export default function ProfileScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // State for user data
  const [userName, setUserName] = useState('Loading...');
  const [userBio, setUserBio] = useState('No bio yet.');
  const [profilePicture, setProfilePicture] = useState(DEFAULT_PROFILE_PIC);
  const [postsCount, setPostsCount] = useState(0);
  const [momentsCount, setMomentsCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(5); // Dummy data
  const [followingCount, setFollowingCount] = useState(10); // Dummy data

  // State for active tab
  const [activeTab, setActiveTab] = useState('Posts');

  // Load user data when screen is focused
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user_data');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserName(parsedUserData.name || 'User');
          setUserBio(parsedUserData.bio || 'No bio yet.');
          setProfilePicture(parsedUserData.profilePicture ? { uri: parsedUserData.profilePicture } : DEFAULT_PROFILE_PIC);
        }
        const storedPosts = await AsyncStorage.getItem('user_posts');
        if (storedPosts) setPostsCount(JSON.parse(storedPosts).length);
        const storedMoments = await AsyncStorage.getItem('user_photos');
        if (storedMoments) setMomentsCount(JSON.parse(storedMoments).length);

      } catch (error) {
        console.error('Failed to load user data for profile:', error);
      }
    };

    if (isFocused) {
      loadUserData();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            console.log('Attempting logout from Profile Screen!');
            try {
              // Replace 'YOUR_IP_HERE' with your actual local IP address
              const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174'; // Example IP
              const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:8081/users/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + await AsyncStorage.getItem('access_token') // Send token if needed
                },
              });

              if (response.ok) {
                console.log('Logout successful');
                await AsyncStorage.clear(); // Clear all stored data
                navigation.replace('Auth'); // Go back to Auth screen after full logout
              } else {
                console.error('Logout failed');
                Alert.alert('Logout Failed', 'Could not log out. Please try again.');
              }
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'An error occurred during logout.');
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.profileCard}>
          {/* New Header with Settings and Logout Icons */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerIconButton}>
              <Ionicons name="settings-outline" size={24} color="#1f2937" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.headerIconButton}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Profile Picture (Centered) */}
          <View style={styles.profilePictureContainerCentered}>
            <Image source={profilePicture} style={styles.profilePicture} />
          </View>

          {/* User Name and Stats */}
          <View style={styles.profileInfoCentered}>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.profileStats}>
              <Text style={styles.statText}><Text style={styles.statCount}>{postsCount}</Text> Posts</Text>
              <Text style={styles.statText}><Text style={styles.statCount}>{connectionsCount}</Text> Connections</Text>
              <Text style={styles.statText}><Text style={styles.statCount}>{momentsCount}</Text> Moments</Text>
              <Text style={styles.statText}><Text style={styles.statCount}>{followingCount}</Text> Following</Text>
            </View>
            <Text style={styles.userBio}>Bio: {userBio}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Old Action Buttons Removed Here */}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Tabs for Posts, Moments, Collections */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Posts' && styles.activeTab]}
              onPress={() => setActiveTab('Posts')}
            >
              <Text style={[styles.tabText, activeTab === 'Posts' && styles.activeTabText]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Moments' && styles.activeTab]}
              onPress={() => setActiveTab('Moments')}
            >
              <Text style={[styles.tabText, activeTab === 'Moments' && styles.activeTabText]}>Moments</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Collections' && styles.activeTab]}
              onPress={() => setActiveTab('Collections')}
            >
              <Text style={[styles.tabText, activeTab === 'Collections' && styles.activeTabText]}>Collections</Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          <View style={styles.tabContent}>
            {activeTab === 'Posts' && (
              <View>
                <Text style={styles.tabContentTitle}>Your Posts</Text>
                <Text style={styles.tabContentText}>New Post button and list of posts will go here.</Text>
              </View>
            )}
            {activeTab === 'Moments' && (
              <View>
                <Text style={styles.tabContentTitle}>Your Moments</Text>
                <Text style={styles.tabContentText}>Upload photos/videos, 3 per row, delete functionality will go here.</Text>
              </View>
            )}
            {activeTab === 'Collections' && (
              <View>
                <Text style={styles.tabContentTitle}>Your Collections</Text>
                <Text style={styles.tabContentText}>Here you can create albums from your moments.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
    width: '100%',
    flex: 1,
  },
  // New Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 20, // Small circle buttons
    backgroundColor: 'transparent', // Transparent background
    borderWidth: 1, // Border
    borderColor: '#d1d5db', // Light gray border
  },
  profilePictureContainerCentered: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#d1d5db',
    resizeMode: 'cover',
  },
  profileInfoCentered: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 5,
  },
  statText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  statCount: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userBio: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 15,
  },
  // Removed actionButtonsContainer and related styles
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 15,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  tabContent: {
    flex: 1,
  },
  tabContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    textAlign: 'center',
  },
  tabContentText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
});