// screens/main/ProfileScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  useColorScheme,
  ScrollView,
  Dimensions,
  Modal, // Import Modal
  TextInput,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker
import { Picker } from '@react-native-picker/picker'; // Import Picker

import { AuthContext } from '../navigation/AppNavigator';

const DEFAULT_PROFILE_PIC = require('../../assets/razom-logo.png');
const { width } = Dimensions.get('window');
const MOMENT_ASPECT_RATIO = 9 / 16;
const MOMENT_ITEM_WIDTH = (width - 40 - 20) / 3;

// Constants for CreatePost/Moment part (moved from CreatePostScreen)
const VIDEO_ASPECT_RATIO = 9 / 16; // For 9:16 vertical video

export default function ProfileScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const videoRef = useRef(null); // Ref for video component

  const { signOut } = useContext(AuthContext);

  // Dynamic colors (combined from both screens)
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const iconColor = colorScheme === 'dark' ? '#93c5fd' : '#1f2937';
  const buttonBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const screenBgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const dividerColor = colorScheme === 'dark' ? '#4a5568' : '#e5e7eb';
  const actionButtonBg = '#5b4285';
  const blurContainerBaseBg = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(240, 240, 240, 0.9)';
  const postCardBg = colorScheme === 'dark' ? '#2d3748' : '#f8fafc';
  const postBorderColor = colorScheme === 'dark' ? '#4a5568' : '#e2e8f0';

  // Colors for the Create Post/Moment Modal
  const modalHeaderBg = colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)';
  const inputBg = colorScheme === 'dark' ? '#4a5568' : 'white';
  const inputBorder = colorScheme === 'dark' ? '#2d3748' : '#e0e0e0';
  const activeTabBgCreate = '#5b4285'; // Renamed to avoid clash
  const inactiveTabBgCreate = colorScheme === 'dark' ? '#4a5568' : '#e2e8f0'; // Renamed
  const activeTabTextCreate = 'white'; // Renamed
  const inactiveTabTextCreate = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563'; // Renamed
  const pickerBg = colorScheme === 'dark' ? '#374151' : 'white';
  const pickerItemColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';


  const [userName, setUserName] = useState('Loading...');
  const [userBio, setUserBio] = useState('No bio yet.');
  const [profilePicture, setProfilePicture] = useState(DEFAULT_PROFILE_PIC);
  const [postsCount, setPostsCount] = useState(0);
  const [momentsCount, setMomentsCount] = useState(0);
  const [connectionsCount] = useState(5); // No longer changing, can be const
  const [followingCount] = useState(10); // No longer changing, can be const

  const [activeTab, setActiveTab] = useState('Posts');
  const [userPosts, setUserPosts] = useState([]);
  const [userMoments, setUserMoments] = useState([]);

  // State for Create Post/Moment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalActiveTab, setCreateModalActiveTab] = useState('Post'); // 'Post' or 'Moment' for modal
  const [postText, setPostText] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('Happy');
  const [momentUri, setMomentUri] = useState(null);
  const [momentType, setMomentType] = useState(null);
  const [momentDescription, setMomentDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Gaming');

  const feelings = ['Happy', 'Sad', 'Excited', 'Relaxed', 'Angry', 'Grateful', 'Motivated'];
  const categories = ['Gaming', 'Comedy', 'Productivity', 'Fashion', 'Art', 'Music', 'Travel', 'Food'];

  // Function to refresh content on focus
  const loadUserDataAndContent = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('user_data');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserName(parsedUserData.name || 'User');
        setUserBio(parsedUserData.bio || 'No bio yet.');
        setProfilePicture(parsedUserData.profilePicture ? { uri: parsedUserData.profilePicture } : DEFAULT_PROFILE_PIC);
      }

      const storedPosts = await AsyncStorage.getItem('user_posts');
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        parsedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setUserPosts(parsedPosts);
        setPostsCount(parsedPosts.length);
      } else {
        setUserPosts([]);
        setPostsCount(0);
      }

      const storedMoments = await AsyncStorage.getItem('user_moments');
      if (storedMoments) {
        const parsedMoments = JSON.parse(storedMoments);
        parsedMoments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setUserMoments(parsedMoments);
        setMomentsCount(parsedMoments.length);
      } else {
        setUserMoments([]);
        setMomentsCount(0);
      }

    } catch (error) {
      console.error('Failed to load user data or content for profile:', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadUserDataAndContent();
    }
  }, [isFocused]);

  // Create Post/Moment Functions (moved from CreatePostScreen)
  const pickMedia = async (mediaType) => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant access to your media library to upload photos/videos.');
        return;
      }
    }

    let result;
    if (mediaType === 'image') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });
    } else { // 'video'
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });
    }

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setMomentUri(selectedAsset.uri);
      setMomentType(selectedAsset.type);
    }
  };

  const handleCreatePost = async () => {
    if (postText.trim().length === 0) {
      Alert.alert('Empty Post', 'Please write something for your post.');
      return;
    }

    const newPost = {
      id: Date.now(),
      text: postText.trim(),
      feeling: selectedFeeling,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
      shares: 0,
    };

    try {
      const existingPosts = await AsyncStorage.getItem('user_posts');
      const posts = existingPosts ? JSON.parse(existingPosts) : [];
      const updatedPosts = [newPost, ...posts];
      await AsyncStorage.setItem('user_posts', JSON.stringify(updatedPosts));
      console.log('Post saved successfully:', newPost);
      Alert.alert('Post Created', `Your post about being "${selectedFeeling}" has been published!`);
      setPostText('');
      setSelectedFeeling('Happy');
      setShowCreateModal(false); // Close modal
      loadUserDataAndContent(); // Refresh posts on profile screen
    } catch (error) {
      console.error('Failed to save post:', error);
      Alert.alert('Error', 'Failed to save your post. Please try again.');
    }
  };

  const handleCreateMoment = async () => {
    if (!momentUri) {
      Alert.alert('No Media Selected', 'Please select a photo or video for your moment.');
      return;
    }

    const newMoment = {
      id: Date.now(),
      uri: momentUri,
      type: momentType,
      description: momentDescription.trim(),
      category: selectedCategory,
      timestamp: new Date().toISOString(),
    };

    try {
      const existingMoments = await AsyncStorage.getItem('user_moments');
      const moments = existingMoments ? JSON.parse(existingMoments) : [];
      const updatedMoments = [newMoment, ...moments];
      await AsyncStorage.setItem('user_moments', JSON.stringify(updatedMoments));
      console.log('Moment saved successfully:', newMoment);
      Alert.alert('Moment Uploaded', `Your ${momentType} moment has been uploaded!`);
      setMomentUri(null);
      setMomentType(null);
      setMomentDescription('');
      setSelectedCategory('Gaming');
      setShowCreateModal(false); // Close modal
      loadUserDataAndContent(); // Refresh moments on profile screen
    } catch (error) {
      console.error('Failed to save moment:', error);
      Alert.alert('Error', 'Failed to save your moment. Please try again.');
    }
  };


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
              // Ensure this IP is correct for your local setup or use a deployed backend URL
              const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';
              const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + await AsyncStorage.getItem('access_token')
                },
              });

              if (response.ok) {
                console.log('Backend logout successful (if applicable)');
              } else {
                console.warn('Backend logout failed or responded with an error, but proceeding with client-side logout:', await response.text());
              }
            } catch (error) {
              console.error('Error during backend logout:', error);
            } finally {
              signOut();
              console.log('Client-side logout: signOut function called. AppNavigator should re-render.');
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const formatPostDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleLike = (postId) => {
    Alert.alert('Like', `You liked post ID: ${postId}`);
  };

  const handleComment = (postId) => {
    Alert.alert('Comment', `You want to comment on post ID: ${postId}`);
  };

  const handleShare = (postId) => {
    Alert.alert('Share', `You shared post ID: ${postId}`);
  };

  const handleEditPost = (postId) => {
    Alert.prompt(
      "Edit Post",
      "Enter new text for your post:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save",
          onPress: async (newText) => {
            if (newText && newText.trim().length > 0) {
              try {
                const updatedPosts = userPosts.map(post =>
                  post.id === postId ? { ...post, text: newText.trim() } : post
                );
                await AsyncStorage.setItem('user_posts', JSON.stringify(updatedPosts));
                setUserPosts(updatedPosts);
                Alert.alert('Success', 'Post updated successfully!');
              } catch (error) {
                console.error('Failed to edit post:', error);
                Alert.alert('Error', 'Failed to update post.');
              }
            } else {
              Alert.alert('Invalid Input', 'Post text cannot be empty.');
            }
          }
        },
      ],
      'plain-text',
      userPosts.find(p => p.id === postId)?.text || ''
    );
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const updatedPosts = userPosts.filter(post => post.id !== postId);
              await AsyncStorage.setItem('user_posts', JSON.stringify(updatedPosts));
              setUserPosts(updatedPosts);
              setPostsCount(updatedPosts.length);
              Alert.alert('Deleted', 'Post has been deleted.');
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleDeleteMoment = (momentId) => {
    Alert.alert(
      "Delete Moment",
      "Are you sure you want to delete this moment?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const updatedMoments = userMoments.filter(moment => moment.id !== momentId);
              await AsyncStorage.setItem('user_moments', JSON.stringify(updatedMoments));
              setUserMoments(updatedMoments);
              setMomentsCount(updatedMoments.length);
              Alert.alert('Deleted', 'Moment has been deleted.');
            } catch (error) {
              console.error('Failed to delete moment:', error);
              Alert.alert('Error', 'Failed to delete moment.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Function to reset modal state on close
  const resetCreateModalState = () => {
    setPostText('');
    setSelectedFeeling('Happy');
    setMomentUri(null);
    setMomentType(null);
    setMomentDescription('');
    setSelectedCategory('Gaming');
    setCreateModalActiveTab('Post'); // Reset to default 'Post' tab
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBgColor }]}>
      <ScrollView contentContainerStyle={[styles.mainContentWrapper, { backgroundColor: screenBgColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.headerIconButton, { borderColor: buttonBorderColor }]}>
            <Ionicons name="settings-outline" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.headerIconButton, { borderColor: buttonBorderColor }]}>
            <Ionicons name="log-out-outline" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfoSection}>
          <View style={styles.profilePictureContainerCentered}>
            <Image source={profilePicture} style={styles.profilePicture} />
          </View>

          <View style={styles.profileTextInfo}>
            <Text style={[styles.userName, { color: textColor }]}>{userName}</Text>
            <View style={styles.profileStats}>
              <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{postsCount}</Text> Posts</Text>
              <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{connectionsCount}</Text> Connections</Text>
              <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{momentsCount}</Text> Moments</Text>
              <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{followingCount}</Text> Following</Text>
            </View>
            <Text style={[styles.userBio, { color: mutedTextColor }]}>Bio: {userBio}</Text>
          </View>
        </View>

        <BlurView
          intensity={20}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.profileActionsBlurContainer,
            { backgroundColor: blurContainerBaseBg },
            styles.profileActionButtonGlow,
          ]}
        >
          <View style={styles.profileActionsInnerContainer}>
            <TouchableOpacity
              style={[
                styles.profileActionButton,
                { backgroundColor: actionButtonBg, borderColor: actionButtonBg }
              ]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={[styles.profileActionButtonText, { color: 'white' }]}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.profileActionButton,
                { backgroundColor: actionButtonBg, borderColor: actionButtonBg }
              ]}
              onPress={() => Alert.alert('Share Profile', 'Share functionality coming soon!')}
            >
              <Text style={[styles.profileActionButtonText, { color: 'white' }]}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Posts' && styles.activeTab]}
            onPress={() => setActiveTab('Posts')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'Posts' ? '#3b82f6' : mutedTextColor }]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Moments' && styles.activeTab]}
            onPress={() => setActiveTab('Moments')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'Moments' ? '#3b82f6' : mutedTextColor }]}>Moments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Collections' && styles.activeTab]}
            onPress={() => setActiveTab('Collections')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'Collections' ? '#3b82f6' : mutedTextColor }]}>Collections</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'Posts' && (
            <View>
              <TouchableOpacity
                style={styles.newContentButton} // Renamed for generic content creation
                onPress={() => {
                  setShowCreateModal(true);
                  setCreateModalActiveTab('Post'); // Ensure 'Post' tab is active in modal
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color={'white'} />
                <Text style={styles.newContentButtonText}>Create New Post</Text>
              </TouchableOpacity>
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <View key={post.id} style={[styles.postCard, { backgroundColor: postCardBg, borderColor: postBorderColor }]}>
                    <Text style={[styles.postText, { color: textColor }]}>{post.text}</Text>
                    <Text style={[styles.postFeeling, { color: mutedTextColor }]}>Feeling: {post.feeling}</Text>
                    <Text style={[styles.postDate, { color: mutedTextColor }]}>
                      {formatPostDate(post.timestamp)}
                    </Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.postActionButton}>
                        <Ionicons name="heart-outline" size={20} color={iconColor} />
                        <Text style={[styles.postActionText, { color: mutedTextColor }]}>{post.likes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleComment(post.id)} style={styles.postActionButton}>
                        <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
                        <Text style={[styles.postActionText, { color: mutedTextColor }]}>{post.comments.length}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleShare(post.id)} style={styles.postActionButton}>
                        <Ionicons name="share-outline" size={20} color={iconColor} />
                        <Text style={[styles.postActionText, { color: mutedTextColor }]}>{post.shares}</Text>
                      </TouchableOpacity>
                      <View style={styles.postEditDeleteContainer}>
                        <TouchableOpacity onPress={() => handleEditPost(post.id)} style={styles.postActionButton}>
                          <Ionicons name="create-outline" size={20} color={iconColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={styles.postActionButton}>
                          <Ionicons name="trash-outline" size={20} color={'#ef4444'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.tabContentText, { color: mutedTextColor, marginTop: 20 }]}>
                  You haven't created any posts yet.
                </Text>
              )}
            </View>
          )}
          {activeTab === 'Moments' && (
            <View>
              <TouchableOpacity
                style={styles.newContentButton} // Renamed for generic content creation
                onPress={() => {
                  setShowCreateModal(true);
                  setCreateModalActiveTab('Moment'); // Ensure 'Moment' tab is active in modal
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color={'white'} />
                <Text style={styles.newContentButtonText}>Upload New Moment</Text>
              </TouchableOpacity>
              {userMoments.length > 0 ? (
                <View style={styles.momentsGrid}>
                  {userMoments.map((moment) => (
                    <View key={moment.id} style={[styles.momentCard, { backgroundColor: postCardBg, borderColor: postBorderColor }]}>
                      {moment.type === 'image' ? (
                        <Image source={{ uri: moment.uri }} style={styles.momentMedia} />
                      ) : (
                        <Video
                          source={{ uri: moment.uri }}
                          style={styles.momentMedia}
                          useNativeControls
                          resizeMode="cover"
                          isLooping
                        />
                      )}
                      <Text style={[styles.momentDescription, { color: textColor }]} numberOfLines={2}>
                        {moment.description || 'No description'}
                      </Text>
                      <Text style={[styles.momentCategory, { color: mutedTextColor }]}>
                        Category: {moment.category}
                      </Text>
                      <Text style={[styles.momentDate, { color: mutedTextColor }]}>
                        {formatPostDate(moment.timestamp)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteMoment(moment.id)}
                        style={styles.deleteMomentButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={'#ef4444'} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.tabContentText, { color: mutedTextColor, marginTop: 20 }]}>
                  You haven't uploaded any moments yet.
                </Text>
              )}
            </View>
          )}
          {activeTab === 'Collections' && (
            <View>
              <Text style={[styles.tabContentTitle, { color: textColor }]}>Your Collections</Text>
              <Text style={[styles.tabContentText, { color: mutedTextColor }]}>Here you can create albums from your moments.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Post/Moment Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCreateModal}
        onRequestClose={() => {
          setShowCreateModal(!showCreateModal);
          resetCreateModalState(); // Reset state when modal is closed
        }}
      >
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : 'transparent' }]}>
          <View style={[styles.modalContainer, { backgroundColor: modalHeaderBg }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                resetCreateModalState();
              }} style={styles.modalBackButton}>
                <Ionicons name="close" size={28} color={textColor} />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: textColor }]}>Create New</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.modalTabSelectionContainer}>
              <TouchableOpacity
                style={[styles.modalTabButton, createModalActiveTab === 'Post' && { backgroundColor: activeTabBgCreate }]}
                onPress={() => setCreateModalActiveTab('Post')}
              >
                <Text style={[styles.modalTabButtonText, { color: createModalActiveTab === 'Post' ? activeTabTextCreate : inactiveTabTextCreate }]}>
                  New Post
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTabButton, createModalActiveTab === 'Moment' && { backgroundColor: activeTabBgCreate }]}
                onPress={() => setCreateModalActiveTab('Moment')}
              >
                <Text style={[styles.modalTabButtonText, { color: createModalActiveTab === 'Moment' ? activeTabTextCreate : inactiveTabTextCreate }]}>
                  New Moment
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContentScroll} contentContainerStyle={styles.modalContentScrollContainer}>
              {createModalActiveTab === 'Post' && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: textColor }]}>Write your Post</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    placeholder="What's on your mind?"
                    placeholderTextColor={mutedTextColor}
                    multiline
                    numberOfLines={6}
                    value={postText}
                    onChangeText={setPostText}
                  />
                  <Text style={[styles.modalSectionTitle, { color: textColor, marginTop: 20 }]}>How are you feeling?</Text>
                  <View style={[styles.modalPickerContainer, { backgroundColor: pickerBg, borderColor: inputBorder }]}>
                    <Picker
                      selectedValue={selectedFeeling}
                      onValueChange={(itemValue) => setSelectedFeeling(itemValue)}
                      dropdownIconColor={textColor}
                      style={{ color: pickerItemColor }}
                    >
                      {feelings.map((feeling) => (
                        <Picker.Item key={feeling} label={feeling} value={feeling} color={pickerItemColor} />
                      ))}
                    </Picker>
                  </View>

                  <TouchableOpacity style={styles.modalCreateButton} onPress={handleCreatePost}>
                    <Text style={styles.modalCreateButtonText}>Publish Post</Text>
                  </TouchableOpacity>
                </View>
              )}

              {createModalActiveTab === 'Moment' && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: textColor }]}>Upload a Photo or Video</Text>
                  <View style={styles.modalMediaUploadContainer}>
                    <TouchableOpacity
                      style={[styles.modalUploadButton, { backgroundColor: inactiveTabBgCreate }]}
                      onPress={() => pickMedia('image')}
                    >
                      <Ionicons name="image-outline" size={30} color={inactiveTabTextCreate} />
                      <Text style={[styles.modalUploadButtonText, { color: inactiveTabTextCreate }]}>Select Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalUploadButton, { backgroundColor: inactiveTabBgCreate }]}
                      onPress={() => pickMedia('video')}
                    >
                      <Ionicons name="videocam-outline" size={30} color={inactiveTabTextCreate} />
                      <Text style={[styles.modalUploadButtonText, { color: inactiveTabTextCreate }]}>Select Video (9:16)</Text>
                    </TouchableOpacity>
                  </View>

                  {momentUri && (
                    <View style={styles.modalMediaPreviewContainer}>
                      {momentType === 'image' ? (
                        <Image source={{ uri: momentUri }} style={styles.modalPreviewMedia} />
                      ) : (
                        <Video
                          ref={videoRef}
                          source={{ uri: momentUri }}
                          style={[styles.modalPreviewMedia, { height: (width - 40) * VIDEO_ASPECT_RATIO }]}
                          useNativeControls
                          resizeMode="contain"
                          isLooping
                        />
                      )}
                      <View style={styles.modalEditingControls}>
                        <Text style={[styles.modalEditingText, { color: mutedTextColor }]}>Basic edits (saturation, brightness, vibrancy) would apply here on upload.</Text>
                      </View>
                    </View>
                  )}

                  <Text style={[styles.modalSectionTitle, { color: textColor, marginTop: 20 }]}>Description (max 200 chars)</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    placeholder="Add a description for your moment..."
                    placeholderTextColor={mutedTextColor}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    value={momentDescription}
                    onChangeText={setMomentDescription}
                  />
                  <Text style={[styles.modalCharacterCount, { color: mutedTextColor }]}>
                    {momentDescription.length}/200
                  </Text>

                  <Text style={[styles.modalSectionTitle, { color: textColor, marginTop: 20 }]}>Select Category</Text>
                  <View style={[styles.modalPickerContainer, { backgroundColor: pickerBg, borderColor: inputBorder }]}>
                    <Picker
                      selectedValue={selectedCategory}
                      onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                      dropdownIconColor={textColor}
                      style={{ color: pickerItemColor }}
                    >
                      {categories.map((category) => (
                        <Picker.Item key={category} label={category} value={category} color={pickerItemColor} />
                      ))}
                    </Picker>
                  </View>

                  <TouchableOpacity style={styles.modalCreateButton} onPress={handleCreateMoment}>
                    <Text style={styles.modalCreateButtonText}>Upload Moment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContentWrapper: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    marginTop: 20,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
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
  profileTextInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  statCount: {
    fontWeight: 'bold',
  },
  userBio: {
    fontSize: 14,
    textAlign: 'center',
  },
  profileActionsBlurContainer: {
    marginHorizontal: 0,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileActionsInnerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  profileActionButton: {
    flex: 0.45,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileActionButtonGlow: {
    borderWidth: 2.5,
    borderColor: '#c6a4fa',
    shadowColor: '#c6a4fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  profileActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 15,
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 15,
    width: '100%',
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
  },
  tabContent: {
    flex: 1,
    width: '100%',
  },
  tabContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tabContentText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // New styles for Posts and Moments
  newContentButton: { // Renamed from newPostButton
    backgroundColor: '#5b4285',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    marginTop: 10,
  },
  newContentButtonText: { // Renamed from newPostButtonText
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  postCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  postText: {
    fontSize: 16,
    marginBottom: 8,
  },
  postFeeling: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  postDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    marginTop: 10,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  postActionText: {
    marginLeft: 5,
    fontSize: 12,
  },
  postEditDeleteContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
  },
  momentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  momentCard: {
    width: MOMENT_ITEM_WIDTH,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  momentMedia: {
    width: '100%',
    height: MOMENT_ITEM_WIDTH * MOMENT_ASPECT_RATIO,
    backgroundColor: '#ccc',
  },
  momentDescription: {
    fontSize: 12,
    padding: 8,
    paddingBottom: 2,
  },
  momentCategory: {
    fontSize: 10,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  momentDate: {
    fontSize: 9,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  deleteMomentButton: {
    alignSelf: 'flex-end',
    padding: 5,
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
  },

  // Modal Styles (moved and adapted from CreatePostScreen styles)
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: Platform.OS === 'android' ? 30 : 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalBackButton: {
    padding: 5,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTabSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    padding: 5,
  },
  modalTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  modalTabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalContentScrollContainer: {
    paddingBottom: 100,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalTextInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalPickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalCreateButton: {
    backgroundColor: '#5b4285',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCreateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalMediaUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalUploadButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUploadButtonText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  modalMediaPreviewContainer: {
    marginTop: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalPreviewMedia: {
    width: '100%',
    height: width * 16 / 9,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  modalEditingControls: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    width: '100%',
    alignItems: 'center',
  },
  modalEditingText: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  modalCharacterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 5,
  },
});