// screens/main/ProfileScreen.js
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';

import { AuthContext } from '../context/AuthContext';

const DEFAULT_PROFILE_PIC = require('../../assets/razom-logo.png');
const { width, height } = Dimensions.get('window');

const MOMENT_THUMBNAIL_COLUMNS = 3;
const HORIZONTAL_SCREEN_PADDING = 20;
const GAP_BETWEEN_THUMBNAILS = 4;

const MOMENT_THUMBNAIL_WIDTH = (width - (HORIZONTAL_SCREEN_PADDING * 2) - (GAP_BETWEEN_THUMBNAILS * (MOMENT_THUMBNAIL_COLUMNS - 1))) / MOMENT_THUMBNAIL_COLUMNS;
const MOMENT_THUMBNAIL_HEIGHT = MOMENT_THUMBNAIL_WIDTH * (16 / 9);

const MOMENT_ASPECT_RATIO = 16 / 9;
const VIDEO_ASPECT_RATIO_UPLOAD = 9 / 16;

const YOUR_LOCAL_IP_ADDRESS = '****';
const API_BASE_URL = `http://${YOUR_LOCAL_IP_ADDRESS}:3000`;


export default function ProfileScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const videoRef = useRef(null);
  const expandedVideoRef = useRef(null);

  const { signOut, userToken, userData, updateUserData } = useContext(AuthContext);

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

  const modalHeaderBg = colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)';
  const momentExpandedBg = colorScheme === 'dark' ? '#1a202c' : 'white';

  const [userName, setUserName] = useState('Loading...');
  const [userUsername, setUserUsername] = useState('');
  const [userBio, setUserBio] = useState('No bio yet.');
  const [profilePicture, setProfilePicture] = useState(DEFAULT_PROFILE_PIC);
  const [postsCount, setPostsCount] = useState(0);
  const [momentsCount, setMomentsCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  const [activeTab, setActiveTab] = useState('Posts');
  const [userPosts, setUserPosts] = useState([]);
  const [userMoments, setUserMoments] = useState([]);
  const [userCollections, setUserCollections] = useState([]);

  const [showMomentExpandedModal, setShowMomentExpandedModal] = useState(false);
  const [expandedMoment, setExpandedMoment] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMoments, setLoadingMoments] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      if (userData) {
        setUserName(userData.name || 'User');
        setUserUsername(userData.username || '');
        setUserBio(userData.bio || 'No bio yet.');
        setProfilePicture(userData.profile_picture_url ? { uri: userData.profile_picture_url } : DEFAULT_PROFILE_PIC);
        fetchFriendsCount();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoadingProfile(false);
    }
  }, [userData, fetchFriendsCount]);

  const fetchUserPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No token found for fetching posts.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/posts/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        data.posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setUserPosts(data.posts);
        setPostsCount(data.posts.length);
      } else {
        Alert.alert('Error', `Failed to load posts: ${data.error || 'Unknown error'}`);
        setUserPosts([]);
        setPostsCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      Alert.alert('Error', 'Failed to load posts from server.');
      setUserPosts([]);
      setPostsCount(0);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const fetchUserMoments = useCallback(async () => {
    setLoadingMoments(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No token found for fetching moments.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/moments/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        data.moments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setUserMoments(data.moments);
        setMomentsCount(data.moments.length);
      } else {
        Alert.alert('Error', `Failed to load moments: ${data.error || 'Unknown error'}`);
        setUserMoments([]);
        setMomentsCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch user moments:', error);
      Alert.alert('Error', 'Failed to load moments from server.');
      setUserMoments([]);
      setMomentsCount(0);
    } finally {
      setLoadingMoments(false);
    }
  }, []);

  const fetchUserCollections = useCallback(async () => {
    const mockCollections = [
      { id: 'col1', name: 'Summer 2023 Highlights', moment_ids: ['m1', 'm2', 'm3'], thumbnail_src: null },
      { id: 'col2', name: 'Coding Projects', moment_ids: ['m4', 'm5'], thumbnail_src: null },
    ];
    const validCollections = mockCollections.map(collection => {
        const validMomentIds = collection.moment_ids.filter(momentId => userMoments.some(m => m.id === momentId));
        return { ...collection, moment_ids: validMomentIds };
    }).filter(collection => collection.moment_ids.length > 0);
    setUserCollections(validCollections);
  }, [userMoments]);

  const fetchFriendsCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No token found for fetching contacts.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/contacts/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setFriendsCount(data.contacts.length);
      } else {
        console.error('Failed to fetch friends count:', data.error || 'Unknown error');
        setFriendsCount(0);
      }
    } catch (error) {
      console.error('Network error fetching friends count:', error);
      setFriendsCount(0);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      if (route.params?.initialTab) {
        setActiveTab(route.params.initialTab);
        navigation.setParams({ initialTab: undefined });
      }
      fetchUserProfile();
      fetchUserPosts();
      fetchUserMoments();
    }
  }, [isFocused, fetchUserProfile, fetchUserPosts, fetchUserMoments, route.params?.initialTab]);

  useEffect(() => {
    if (isFocused && userMoments.length > 0) {
      fetchUserCollections();
    }
  }, [isFocused, userMoments, fetchUserCollections]);

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
              const token = await AsyncStorage.getItem('access_token');
              const response = await fetch(`${API_BASE_URL}/users/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
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

  const handleLike = (id, type) => {
    Alert.alert('Feature Coming Soon', `Like function for ${type} ID: ${id} is not yet implemented on the backend.`);
  };

  const handleComment = (id, type) => {
    Alert.alert('Feature Coming Soon', `Comment function for ${type} ID: ${id} is not yet implemented on the backend.`);
  };

  const handleShare = (id, type) => {
    Alert.alert('Feature Coming Soon', `Share function for ${type} ID: ${id} is not yet implemented on the backend.`);
  };

  const handleEditPost = (postId) => {
    const postToEdit = userPosts.find(p => p.id === postId);
    if (!postToEdit) return;

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
            if (newText && newText.trim().length >= 10 && newText.trim().length <= 500) {
              setLoadingPosts(true);
              try {
                const token = await AsyncStorage.getItem('access_token');
                const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    content: newText.trim(),
                    image: postToEdit.image,
                    feeling: postToEdit.feeling,
                  }),
                });
                const data = await response.json();
                if (response.ok) {
                  Alert.alert('Success', 'Post updated successfully!');
                  fetchUserPosts();
                } else {
                  Alert.alert('Error', data.error || 'Failed to update post.');
                }
              } catch (error) {
                console.error('Failed to edit post:', error);
                Alert.alert('Error', 'Failed to update post. Network error?');
              } finally {
                setLoadingPosts(false);
              }
            } else {
              Alert.alert('Invalid Input', 'Post text must be between 10 and 500 characters.');
            }
          }
        },
      ],
      'plain-text',
      postToEdit.content
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
            setLoadingPosts(true);
            try {
              const token = await AsyncStorage.getItem('access_token');
              const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Deleted', 'Post has been deleted.');
                fetchUserPosts();
              } else {
                Alert.alert('Error', data.error || 'Failed to delete post.');
              }
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post. Network error?');
            } finally {
              setLoadingPosts(false);
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
            setLoadingMoments(true);
            try {
              const token = await AsyncStorage.getItem('access_token');
              const response = await fetch(`${API_BASE_URL}/moments/${momentId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Deleted', 'Moment has been deleted.');
                fetchUserMoments();
                fetchUserCollections();
              } else {
                Alert.alert('Error', data.error || 'Failed to delete moment.');
              }
            } catch (error) {
              console.error('Failed to delete moment:', error);
              Alert.alert('Error', 'Failed to delete moment. Network error?');
            } finally {
              setLoadingMoments(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleMomentPress = (moment) => {
    setExpandedMoment(moment);
    setShowMomentExpandedModal(true);
  };

  const closeMomentExpandedModal = () => {
    setShowMomentExpandedModal(false);
    setExpandedMoment(null);
  };

  const getCollectionThumbnail = (collection) => {
    if (collection.moment_ids && collection.moment_ids.length > 0) {
      const firstMomentId = collection.moment_ids[0];
      const moment = userMoments.find(m => m.id === firstMomentId);
      if (moment) {
        return moment.type === 'image' ?
               { uri: `data:image/png;base64,${moment.src}` } :
               { uri: `data:video/mp4;base64,${moment.src}` };
      }
    }
    return DEFAULT_PROFILE_PIC;
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

        {loadingProfile ? (
          <ActivityIndicator size="large" color={iconColor} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.profileInfoSection}>
            <View style={styles.profilePictureContainerCentered}>
              <Image source={profilePicture} style={styles.profilePicture} />
            </View>

            <View style={styles.profileTextInfo}>
              <View style={styles.nameAndUsernameContainer}>
                  <Text style={[styles.userName, { color: textColor }]}>{userName}</Text>
                  {userUsername ? (
                      <Text style={[styles.usernameText, { color: mutedTextColor }]}> | @{userUsername}</Text>
                  ) : null}
              </View>

              <View style={styles.profileStats}>
                <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{postsCount}</Text> Posts</Text>
                <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{friendsCount}</Text> Friends</Text>
                <Text style={[styles.statText, { color: mutedTextColor }]}><Text style={[styles.statCount, { color: textColor }]}>{momentsCount}</Text> Moments</Text>
              </View>
              <Text style={[styles.userBio, { color: mutedTextColor }]}>{userBio}</Text>
            </View>
          </View>
        )}

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
              onPress={() => navigation.navigate('ShareProfile')}
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
              {loadingPosts ? (
                <ActivityIndicator size="large" color={iconColor} style={{ marginTop: 20 }} />
              ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <View key={post.id} style={[styles.postCard, { backgroundColor: postCardBg, borderColor: postBorderColor }]}>
                    <Text style={[styles.postText, { color: textColor }]}>{post.content}</Text>
                    <Text style={[styles.postFeeling, { color: mutedTextColor }]}>Feeling: {post.feeling}</Text>
                    <Text style={[styles.postDate, { color: mutedTextColor }]}>
                      {formatPostDate(post.timestamp)}
                    </Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity onPress={() => handleLike(post.id, 'post')} style={styles.postActionButton}>
                        <Ionicons name="heart-outline" size={20} color={iconColor} />
                        <Text style={[styles.postActionText, { color: mutedTextColor }]}>0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleComment(post.id, 'post')} style={styles.postActionButton}>
                        <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
                        <Text style={[styles.postActionText, { color: mutedTextColor }]}>0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleShare(post.id, 'post')} style={styles.postActionButton}>
                        <Ionicons name="share-outline" size={20} color={iconColor} />
                        <Text style={[styles.postActionText, { color: mutedTextColor }]}>0</Text>
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
              {loadingMoments ? (
                <ActivityIndicator size="large" color={iconColor} style={{ marginTop: 20 }} />
              ) : userMoments.length > 0 ? (
                <View style={styles.momentsGrid}>
                  {userMoments.map((moment) => (
                    <TouchableOpacity
                      key={moment.id}
                      style={[styles.momentThumbnailCard, { backgroundColor: postCardBg, borderColor: postBorderColor }]}
                      onPress={() => handleMomentPress(moment)}
                    >
                      {moment.type === 'image' ? (
                        <Image
                          source={{ uri: `data:image/png;base64,${moment.src}` }}
                          style={styles.momentThumbnailMedia}
                          resizeMode="cover"
                          fadeDuration={0}
                        />
                      ) : (
                        <Video
                          source={{ uri: `data:video/mp4;base64,${moment.src}` }}
                          style={styles.momentThumbnailMedia}
                          useNativeControls={false}
                          resizeMode="cover"
                          isLooping
                          shouldPlay
                        />
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteMoment(moment.id)}
                        style={styles.deleteMomentButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={'#ef4444'} />
                      </TouchableOpacity>
                    </TouchableOpacity>
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
              {userCollections.length > 0 ? (
                userCollections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={[styles.collectionCard, { backgroundColor: postCardBg, borderColor: postBorderColor }]}
                    onPress={() => Alert.alert('View Collection', `You clicked on collection: ${collection.name}`)}
                  >
                    <Image
                      source={getCollectionThumbnail(collection)}
                      style={styles.collectionThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.collectionInfo}>
                      <Text style={[styles.collectionName, { color: textColor }]}>{collection.name}</Text>
                      <Text style={[styles.collectionMomentCount, { color: mutedTextColor }]}>
                        {collection.moment_ids.length} Moments
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Delete Collection', `Delete ${collection.name}?`)}
                      style={styles.deleteCollectionButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={'#ef4444'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.tabContentText, { color: mutedTextColor }]}>
                  You haven't created any collections yet.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showMomentExpandedModal}
        onRequestClose={closeMomentExpandedModal}
      >
        <View style={[styles.expandedMomentOverlay, { backgroundColor: momentExpandedBg }]}>
          <SafeAreaView style={styles.expandedMomentSafeArea}>
            <View style={styles.expandedMomentHeader}>
              <TouchableOpacity onPress={closeMomentExpandedModal} style={styles.expandedMomentCloseButton}>
                <Ionicons name="close-circle" size={30} color={textColor} />
              </TouchableOpacity>
            </View>

            {expandedMoment && (
              <ScrollView contentContainerStyle={styles.expandedMomentContent}>
                <View style={styles.expandedMomentMediaContainer}>
                  {expandedMoment.type === 'image' ? (
                    <Image
                      source={{ uri: `data:image/png;base64,${expandedMoment.src}` }}
                      style={styles.expandedMomentMedia}
                      resizeMode="contain"
                      fadeDuration={0}
                    />
                  ) : (
                    <Video
                      ref={expandedVideoRef}
                      source={{ uri: `data:video/mp4;base64,${expandedMoment.src}` }}
                      style={styles.expandedMomentMedia}
                      useNativeControls
                      resizeMode="contain"
                      isLooping
                      shouldPlay
                    />
                  )}
                </View>

                <View style={styles.expandedMomentDetails}>
                  <View style={styles.expandedMomentUserInfo}>
                    <Image source={profilePicture} style={styles.expandedMomentUserPic} />
                    <View>
                      <Text style={[styles.expandedMomentUserName, { color: textColor }]}>{userName}</Text>
                      {userUsername ? (
                        <Text style={[styles.expandedMomentUsernameText, { color: mutedTextColor }]}>@{userUsername}</Text>
                      ) : null}
                      <Text style={[styles.expandedMomentDate, { color: mutedTextColor }]}>
                        {formatPostDate(expandedMoment.timestamp)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.expandedMomentDescription, { color: textColor }]}>
                    {expandedMoment.note || 'No description provided.'}
                  </Text>

                  <View style={styles.expandedMomentActions}>
                    <TouchableOpacity onPress={() => handleLike(expandedMoment.id, 'moment')} style={styles.expandedMomentActionButton}>
                      <Ionicons name="heart-outline" size={24} color={iconColor} />
                      <Text style={[styles.expandedMomentActionText, { color: mutedTextColor }]}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleComment(expandedMoment.id, 'moment')} style={styles.expandedMomentActionButton}>
                      <Ionicons name="chatbubble-outline" size={24} color={iconColor} />
                      <Text style={[styles.expandedMomentActionText, { color: mutedTextColor }]}>Comment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShare(expandedMoment.id, 'moment')} style={styles.expandedMomentActionButton}>
                      <Ionicons name="share-outline" size={24} color={iconColor} />
                      <Text style={[styles.expandedMomentActionText, { color: mutedTextColor }]}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
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
  nameAndUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  usernameText: {
    fontSize: 18,
    marginLeft: 5,
    fontWeight: 'normal',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  statText: {
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  statCount: {
    fontWeight: 'bold',
  },
  userBio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
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
    justifyContent: 'flex-start',
    marginHorizontal: -GAP_BETWEEN_THUMBNAILS / 2,
  },
  momentThumbnailCard: {
    width: MOMENT_THUMBNAIL_WIDTH,
    height: MOMENT_THUMBNAIL_HEIGHT + 30,
    marginBottom: GAP_BETWEEN_THUMBNAILS,
    marginHorizontal: GAP_BETWEEN_THUMBNAILS / 2,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  momentThumbnailMedia: {
    width: '100%',
    height: MOMENT_THUMBNAIL_HEIGHT,
    backgroundColor: 'transparent',
    resizeMode: 'cover',
  },
  deleteMomentButton: {
    alignSelf: 'flex-end',
    padding: 5,
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    zIndex: 1,
  },

  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  collectionThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#ccc',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  collectionMomentCount: {
    fontSize: 14,
  },
  deleteCollectionButton: {
    padding: 8,
  },

  expandedMomentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedMomentSafeArea: {
    flex: 1,
    width: '100%',
  },
  expandedMomentHeader: {
    width: '100%',
    alignItems: 'flex-end',
    padding: 10,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  expandedMomentCloseButton: {
    padding: 5,
  },
  expandedMomentContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  expandedMomentMediaContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedMomentMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    resizeMode: 'contain',
  },
  expandedMomentDetails: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  expandedMomentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  expandedMomentUserPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  expandedMomentUserName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedMomentUsernameText: {
    fontSize: 14,
    color: '#cbd5e0',
    marginTop: 2,
  },
  expandedMomentDate: {
    fontSize: 12,
  },
  expandedMomentDescription: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  expandedMomentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.3)',
    paddingTop: 15,
  },
  expandedMomentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  expandedMomentActionText: {
    marginLeft: 5,
    fontSize: 14,
  },
});