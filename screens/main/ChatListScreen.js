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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

// Dummy data for chat list (replace with actual data later)
const initialDummyChats = [
  { id: '1', user: 'Larry Machigo', lastMessage: 'Ok. Let me check', time: '09:38 AM', img: 'https://randomuser.me/api/portraits/men/1.jpg', pinned: true },
  { id: '2', user: 'Natalie Nora', lastMessage: 'Natalie is typing...', time: 'Now', img: 'https://randomuser.me/api/portraits/women/2.jpg', unread: 2 },
  { id: '3', user: 'Jennifer Jones', lastMessage: 'Voice message', time: '02:03 PM', img: 'https://randomuser.me/api/portraits/women/3.jpg' },
  { id: '4', user: 'Larry Machigo', lastMessage: 'See you tomorrow, take..', time: 'Yesterday', img: 'https://randomuser.me/api/portraits/men/4.jpg' },
  { id: '5', user: 'Sofia', lastMessage: 'Oh... thank you so...', time: '26 May', img: 'https://randomuser.me/api/portraits/women/5.jpg' },
  { id: '6', user: 'Haider Lve', lastMessage: 'Sticker', time: '12 Jun', img: 'https://randomuser.me/api/portraits/men/6.jpg' },
  { id: '7', user: 'Mr. elon', lastMessage: 'Cool :-)))', time: '12 Jun', img: 'https://randomuser.me/api/portraits/men/7.jpg' },
];

export default function ChatListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme(); // Get current color scheme

  const [userName, setUserName] = useState('User');
  const [activeCategory, setActiveCategory] = useState('All Chats');
  const [chats, setChats] = useState(initialDummyChats);

  // Define dynamic colors based on color scheme
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937'; // For general dark text
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563'; // For muted text (time, last message)
  const headerIconColor = colorScheme === 'dark' ? '#93c5fd' : '#5b4285'; // Header icon color

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user_data');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserName(parsedUserData.name || 'User');
        }
      } catch (error) {
        console.error('Failed to load user name for chat list:', error);
      }
    };

    if (isFocused) {
      loadUserName();
    }
  }, [isFocused]);

  const handleNewMessage = () => {
    navigation.navigate('NewChat');
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
            console.log(`Chat ${chatId} deleted.`);
            // In a real app: make API call to delete chat from backend
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const ChatListItem = ({ chat }) => (
    <TouchableOpacity
      style={styles.chatListItem}
      onPress={() => navigation.navigate('ChatWindow', { user: chat.user, img: chat.img })}
      onLongPress={() => handleDeleteChat(chat.id)}
    >
      <Image source={{ uri: chat.img }} style={styles.chatAvatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatUserName, { color: textColor }]}>{chat.user}</Text>
          <Text style={[styles.chatTime, { color: mutedTextColor }]}>{chat.time}</Text>
        </View>
        <Text style={[styles.chatLastMessage, { color: mutedTextColor }]} numberOfLines={1}>{chat.lastMessage}</Text>
      </View>
      {chat.pinned && <Ionicons name="bookmark" size={16} color={headerIconColor} style={styles.chatPinIcon} />}
      {chat.unread && <View style={styles.unreadBubble}><Text style={styles.unreadText}>{chat.unread}</Text></View>}
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
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

      {/* Category Buttons - Still applying BlurView for glassmorphism here, or you can remove it */}
      <BlurView intensity={20} tint="light" style={styles.categoryContainerBlur}>
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
                  activeCategory === category && styles.activeCategoryButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>

      {/* Chat List */}
      <ScrollView
        style={styles.chatListScroll}
        contentContainerStyle={styles.chatListContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {chats.map((chat) => (
          <ChatListItem key={chat.id} chat={chat} />
        ))}
      </ScrollView>

      {/* Floating Action Button for New Message */}
      <TouchableOpacity style={styles.newMessageButton} onPress={handleNewMessage}>
        <Ionicons name="pencil" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
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
  categoryContainerBlur: { // Keeping BlurView here for category buttons
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#4b5563', // Inactive text color (consider dark mode)
  },
  activeCategoryButtonText: {
    color: 'white',
  },
  chatListScroll: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20, // Keep padding for the list to breathe
  },
  chatListContentContainer: {
    paddingBottom: 100,
  },
  // --- Simplified Chat List Item (Blends with background) ---
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // Removed backgroundColor, borderRadius, padding, and shadows to blend in
    marginBottom: 15, // Slightly increased margin bottom for more separation
    paddingVertical: 8, // Vertical padding to give space around content
    paddingHorizontal: 0, // No horizontal padding, as it's handled by ScrollView
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d1d5db', // Avatar border (consider dark mode for this too)
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
    bottom: 115,
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
});