// screens/main/UserProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YOUR_LOCAL_IP_ADDRESS = '****';

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { userId } = route.params;

  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const headerBgColor = colorScheme === 'dark' ? '#2d3748' : 'white';
  const buttonBgColor = '#5b4285';
  const buttonTextColor = 'white';
  const privateProfileBg = colorScheme === 'dark' ? '#374151' : '#f0f0f0';

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [moments, setMoments] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState('not_friends');
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUserData = await AsyncStorage.getItem('user_data');

      if (!storedToken || !storedUserData) {
        navigation.replace('Auth');
        return;
      }
      setCurrentUserId(JSON.parse(storedUserData).uid);

      const userResponse = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/search?q=${encodeURIComponent(userId)}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${storedToken}` },
      });
      const userResult = await userResponse.json();

      if (userResponse.ok && userResult.success && userResult.users.length > 0) {
          const fetchedUser = userResult.users[0];
          setUserData(fetchedUser);
          setIsFriend(fetchedUser.is_friend);
          setFriendshipStatus(fetchedUser.friendshipStatus);

          if (fetchedUser.id === JSON.parse(storedUserData).uid) {
            fetchUserContent(fetchedUser.id, storedToken, false);
          } else if (!fetchedUser.is_private || fetchedUser.is_friend) {
            fetchUserContent(fetchedUser.id, storedToken, true);
          } else {
            setPosts([]);
            setMoments([]);
          }
      } else {
          Alert.alert('Error', userResult.error || 'Failed to load user profile.');
          setUserData(null);
      }
    } catch (error) {
      console.error('Fetch User Data Error:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  const fetchUserContent = useCallback(async (targetId, token, isOtherUser) => {
    try {
        const postsEndpoint = isOtherUser
            ? `http://${YOUR_LOCAL_IP_ADDRESS}:3000/posts/user/${targetId}`
            : `http://${YOUR_LOCAL_IP_ADDRESS}:3000/posts/my`;

        const momentsEndpoint = isOtherUser
            ? `http://${YOUR_LOCAL_IP_ADDRESS}:3000/moments/user/${targetId}`
            : `http://${YOUR_LOCAL_IP_ADDRESS}:3000/moments/my`;

        const [postsResponse, momentsResponse] = await Promise.all([
            fetch(postsEndpoint, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(momentsEndpoint, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        const postsData = await postsResponse.json();
        const momentsData = await momentsResponse.json();

        if (postsResponse.ok && postsData.success) {
            setPosts(postsData.posts);
        } else if (postsResponse.status === 403) {
            setPosts([]);
            Alert.alert('Profile Private', postsData.error || 'This user\'s posts are private.');
        } else {
            console.error('Failed to fetch posts:', postsData);
            setPosts([]);
        }

        if (momentsResponse.ok && momentsData.success) {
            setMoments(momentsData.moments);
        } else if (momentsResponse.status === 403) {
            setMoments([]);
            Alert.alert('Profile Private', momentsData.error || 'This user\'s moments are private.');
        } else {
            console.error('Failed to fetch moments:', momentsData);
            setMoments([]);
        }

    } catch (error) {
        console.error('Fetch User Content Error:', error);
        Alert.alert('Error', `Failed to load content: ${error.message}`);
        setPosts([]);
        setMoments([]);
    }
  }, []);

  useEffect(() => {
    if (isFocused && userId) {
      fetchUserData();
    }
  }, [isFocused, userId, fetchUserData]);


  const handleAddFriend = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/friend-requests/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setFriendshipStatus('pending');
      } else {
        Alert.alert('Error', data.error || 'Failed to send friend request.');
      }
    } catch (error) {
      console.error('Send Friend Request Error:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: headerBgColor }]}>
        <ActivityIndicator size="large" color={buttonBgColor} />
        <Text style={[styles.loadingText, { color: mutedTextColor }]}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: headerBgColor }]}>
        <Text style={[styles.loadingText, { color: mutedTextColor }]}>User profile not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isMyProfile = userData.id === currentUserId;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileInfoContainer}>
          <Image
            source={{ uri: userData.profile_picture_url || 'https://via.placeholder.com/150' }}
            style={styles.profileAvatar}
          />
          <Text style={[styles.profileName, { color: textColor }]}>{userData.first_name}</Text>
          <Text style={[styles.profileUsername, { color: mutedTextColor }]}>@{userData.username}</Text>
          <Text style={[styles.profileBio, { color: mutedTextColor }]}>{userData.bio || 'No bio available.'}</Text>

          {!isMyProfile && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: buttonBgColor }]}
              onPress={handleAddFriend}
              disabled={friendshipStatus === 'pending' || friendshipStatus === 'friends'}
            >
              <Text style={[styles.actionButtonText, { color: buttonTextColor }]}>
                {friendshipStatus === 'friends' ? 'Friends' : friendshipStatus === 'pending' ? 'Request Sent' : 'Add Friend'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.contentSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Content</Text>

          {userData.is_private && !isFriend && !isMyProfile ? (
            <View style={[styles.privateProfileContainer, { backgroundColor: privateProfileBg }]}>
              <Ionicons name="lock-closed" size={30} color={mutedTextColor} />
              <Text style={[styles.privateProfileText, { color: mutedTextColor }]}>This profile is private.</Text>
              <Text style={[styles.privateProfileText, { color: mutedTextColor }]}>Become friends to view their content.</Text>
            </View>
          ) : (
            <>
              {posts.length > 0 ? (
                <View style={styles.contentGrid}>
                  <Text style={[styles.contentSubTitle, { color: textColor }]}>Posts</Text>
                  {posts.map(post => (
                    <View key={post.id} style={styles.contentItem}>
                      <Text style={{ color: textColor }}>{post.content}</Text>
                      {post.image && <Image source={{ uri: post.image }} style={styles.contentImage} />}
                      <Text style={{ color: mutedTextColor, fontSize: 12 }}>{new Date(post.timestamp).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noContentText, { color: mutedTextColor }]}>No posts available.</Text>
              )}

              {moments.length > 0 ? (
                   <View style={styles.contentGrid}>
                      <Text style={[styles.contentSubTitle, { color: textColor }]}>Moments</Text>
                      {moments.map(moment => (
                        <View key={moment.id} style={styles.contentItem}>
                          <Image source={{ uri: moment.src }} style={styles.contentImage} />
                          <Text style={{ color: textColor }}>{moment.note || 'No note'}</Text>
                          <Text style={{ color: mutedTextColor, fontSize: 12 }}>{new Date(moment.timestamp).toLocaleDateString()}</Text>
                        </View>
                      ))}
                   </View>
              ) : (
                <Text style={[styles.noContentText, { color: mutedTextColor }]}>No moments available.</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  goBackButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#5b4285',
    borderRadius: 8,
  },
  goBackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfoContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#5b4285',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileUsername: {
    fontSize: 16,
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  contentSubTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  contentGrid: {},
  contentItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(91, 66, 133, 0.1)',
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
    resizeMode: 'cover',
  },
  privateProfileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  privateProfileText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  noContentText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  }
});