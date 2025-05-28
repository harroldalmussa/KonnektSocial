// screens/main/ChatListScreen.js
import React, { useState, useEffect } from 'react';
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
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();

  const [userName, setUserName] = useState('User');
  const [activeCategory, setActiveCategory] = useState('All Chats');
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);

  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const headerIconColor = colorScheme === 'dark' ? '#93c5fd' : '#5b4285';
  const categoryBtnInactiveText = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const categoryContainerBaseBg = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(240, 240, 240, 0.9)';

  const headerBgColor = colorScheme === 'dark' ? '#1a202c' : 'white';

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUserData = await AsyncStorage.getItem('user_data');

      if (!storedToken || !storedUserData) {
        console.warn('No token or user data found, redirecting to Auth.');
        navigation.replace('Auth');
        return;
      }
      const parsedUserData = JSON.parse(storedUserData);
      setUserName(parsedUserData.name || parsedUserData.first_name || 'User');
      setCurrentUserData(parsedUserData);

      const YOUR_LOCAL_IP_ADDRESS = '****';

      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/my-chats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setChats(data);
        console.log("Fetched chats:", data);
      } else {
        console.error('Failed to fetch chats:', data);
        Alert.alert('Error', data.detail || 'Failed to load chats.');
        setChats([]);
      }
    } catch (error) {
      console.error('Network or API Error fetching chats:', error);
      Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchChats();
    }
  }, [isFocused]);

  const handleNewMessage = () => {
    navigation.navigate('NewChatScreen');
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem('access_token');
              const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

              const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                },
              });

              if (response.ok) {
                Alert.alert("Success", "Chat deleted.");
                fetchChats();
              } else {
                const errorData = await response.json();
                Alert.alert("Error", errorData.detail || "Failed to delete chat.");
              }
            } catch (error) {
              Alert.alert("Error", `Network error during delete: ${error.message}`);
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const ChatListItem = ({ chat }) => {
    const otherParticipant = chat.participants.find(p => p.id !== currentUserData?.uid);
    if (!otherParticipant) return null;

    return (
      <TouchableOpacity
        style={styles.chatListItem}
        onPress={() => navigation.navigate('ChatWindow', {
          chatId: chat.chat_id,
          user: otherParticipant.name || otherParticipant.first_name || 'Unknown User',
          email: otherParticipant.email,
          img: otherParticipant.profile_img_url || 'https://via.placeholder.com/150',
        })}
        onLongPress={() => handleDeleteChat(chat.chat_id)}
      >
        <Image source={{ uri: otherParticipant.profile_img_url || 'https://via.placeholder.com/150' }} style={styles.chatAvatar} />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatUserName, { color: textColor }]}>{otherParticipant.name || otherParticipant.first_name}</Text>
            <Text style={[styles.chatTime, { color: mutedTextColor }]}>{chat.last_message_timestamp ? new Date(chat.last_message_timestamp).toLocaleTimeString() : ''}</Text>
          </View>
          <Text style={[styles.chatLastMessage, { color: mutedTextColor }]} numberOfLines={1}>{chat.last_message_text || 'No messages yet'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : 'white' }]}>
      <View style={[styles.mainContentWrapper, { backgroundColor: headerBgColor }]}>
        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: mutedTextColor }]}>Hello,</Text>
          <Text style={[styles.userNameText, { color: textColor }]}>{userName}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconContainer}>
              <Ionicons name="search" size={24} color={headerIconColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconContainer}>
              <Ionicons name="ellipsis-vertical" size={24} color={headerIconColor} />
            </TouchableOpacity>
          </View>
        </View>

        <BlurView
          intensity={20}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.categoryContainerBlur,
            { backgroundColor: categoryContainerBaseBg },
            activeCategory && styles.categoryContainerGlow
          ]}
        >
          <View style={styles.categoryInnerContainer}>
            {['All Chats', 'Groups', 'Contacts'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  activeCategory === category && styles.activeCategoryButton,
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: activeCategory === category ? 'white' : categoryBtnInactiveText },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>

        {loadingChats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5b4285" />
            <Text style={[styles.loadingText, { color: mutedTextColor }]}>Loading chats...</Text>
          </View>
        ) : chats.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 50, color: mutedTextColor}}>
            No active chats. Start a new conversation!
          </Text>
        ) : (
          <ScrollView
            style={styles.chatListScroll}
            contentContainerStyle={styles.chatListContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {chats.map((chat) => (
              <ChatListItem key={chat.chat_id} chat={chat} />
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity style={styles.newMessageButton} onPress={handleNewMessage}>
        <Ionicons name="pencil" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  mainContentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 5,
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIconContainer: {
    marginLeft: 15,
    padding: 5,
  },
  categoryContainerBlur: {
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryContainerGlow: {
    borderWidth: 2.5,
    borderColor: '#c6a4fa',
    shadowColor: '#c6a4fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  categoryInnerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 5,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeCategoryButton: {
    backgroundColor: '#5b4285',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeCategoryButtonText: {
    color: 'white',
  },
  chatListScroll: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  chatListContentContainer: {
    paddingBottom: 100,
  },
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatUserName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatTime: {
    fontSize: 12,
  },
  chatLastMessage: {
    fontSize: 14,
  },
  chatPinIcon: {
    marginLeft: 10,
  },
  unreadBubble: {
    backgroundColor: '#5b4285',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    height: 24,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newMessageButton: {
    position: 'absolute',
    bottom: 130,
    right: 30,
    backgroundColor: '#5b4285',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});