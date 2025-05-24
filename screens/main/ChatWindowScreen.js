// screens/main/ChatWindowScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  useColorScheme,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define some color options for chat background
const chatBackgroundColors = {
  purple: ['#5b4285', '#7f58a7'],
  darkPurple: ['#3a0050', '#1a0028'], // Darker purple gradient
  blue: ['#3B82F6', '#60a5fa'],
  ivoryCream: ['#f5f5dc', '#fffafa'], // Creamy white to almost white
  green: ['#10b981', '#34d399'],
};

export default function ChatWindowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Ensure we receive chatId and recipient details
  const { chatId, user: recipientName, email: recipientEmail, img: recipientImg } = route.params || {};

  const colorScheme = useColorScheme();

  const [chatGradientColors, setChatGradientColors] = useState(chatBackgroundColors.purple);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);

  const scrollViewRef = useRef();

  // Define dynamic colors based on color scheme for message bubbles and other elements
  const receivedBubbleBg = colorScheme === 'dark' ? '#374151' : 'white';
  const receivedMessageTextColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const fileDetailsColor = colorScheme === 'dark' ? '#cbd5e0' : '#6b7280';
  const placeholderTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#a0aec0'; // Use placeholderTextColor for placeholder

  // Dynamic colors for header text based on color scheme
  const headerTitleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const headerStatusColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';

  // Function to fetch messages
  const fetchMessages = useCallback(async () => {
    if (!chatId) {
      console.warn('No chatId provided to ChatWindowScreen.');
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUserData = await AsyncStorage.getItem('user_data');

      if (!storedToken || !storedUserData) {
        navigation.replace('Auth'); // Redirect if not authenticated
        return;
      }
      setCurrentUserData(JSON.parse(storedUserData)); // Store current user's data

      const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/${chatId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Assuming data is an array of message objects {id, text, sender_id, timestamp}
        setMessages(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      } else {
        console.error('Failed to fetch messages:', data);
        Alert.alert('Error', data.detail || 'Failed to load messages.');
        setMessages([]);
      }
    } catch (error) {
      console.error('Network or API Error fetching messages:', error);
      Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [chatId, navigation]);

  useEffect(() => {
    // Load wallpaper on mount
    const loadDefaultWallpaper = async () => {
      try {
        const storedWallpaperKey = await AsyncStorage.getItem('app_wallpaper');
        if (storedWallpaperKey && chatBackgroundColors[storedWallpaperKey]) {
          setChatGradientColors(chatBackgroundColors[storedWallpaperKey]);
        } else {
          setChatGradientColors(chatBackgroundColors.purple); // Default to purple if nothing saved
        }
      } catch (error) {
        console.error('Failed to load default wallpaper:', error);
      }
    };
    loadDefaultWallpaper();

    // Fetch messages periodically (simple polling for real-time-like effect)
    fetchMessages();
    const messagePollingInterval = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(messagePollingInterval); // Clear interval on unmount
  }, [fetchMessages, colorScheme]); // Added colorScheme to dependencies to re-render on theme change

  useEffect(() => {
    // Scroll to end when messages load or change
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const selectChatBackground = () => {
    Alert.alert(
      "Choose Chat Background",
      "Select a color scheme for this chat.",
      [
        { text: "Purple", onPress: () => setChatGradientColors(chatBackgroundColors.purple) },
        { text: "Dark Purple", onPress: () => setChatGradientColors(chatBackgroundColors.darkPurple) },
        { text: "Blue", onPress: () => setChatGradientColors(chatBackgroundColors.blue) },
        { text: "Ivory Cream", onPress: () => setChatGradientColors(chatBackgroundColors.ivoryCream) },
        { text: "Green", onPress: () => setChatGradientColors(chatBackgroundColors.green) },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleSendMessage = async () => {
    if (messageText.trim() === '' || !currentUserData || !chatId) {
      return;
    }

    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          text: messageText.trim(),
          // sender_id: currentUserData.uid, // Backend should get sender_id from token
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageText('');
        Keyboard.dismiss();
        // Immediately update local state or refetch messages
        fetchMessages(); // Re-fetch all messages to ensure real-time update
      } else {
        console.error('Failed to send message:', data);
        Alert.alert('Error', data.detail || 'Failed to send message.');
      }
    } catch (error) {
      console.error('Network or API Error sending message:', error);
      Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}.`);
    }
  };

  const renderMessage = (message) => {
    // Assuming message.sender_id is the UID of the sender
    const isMyMessage = message.sender_id === currentUserData?.uid;
    const bubbleStyle = isMyMessage ? styles.sentMessageBubble : [styles.receivedMessageBubble, { backgroundColor: receivedBubbleBg }];
    const textStyle = isMyMessage ? styles.sentMessageText : [styles.receivedMessageText, { color: receivedMessageTextColor }];

    // Example for file messages (you'd need backend support for file uploads)
    if (message.type === 'file') {
      return (
        <View key={message.id} style={bubbleStyle}>
          <Ionicons name="document-text-outline" size={20} color={isMyMessage ? 'white' : receivedMessageTextColor} style={styles.fileIcon} />
          <View>
            <Text style={textStyle}>{message.text}</Text>
            <Text style={[styles.fileSizeText, { color: fileDetailsColor }]}>{message.fileSize}</Text>
          </View>
          <TouchableOpacity style={styles.downloadIconContainer}>
            <Ionicons name="download-outline" size={20} color={isMyMessage ? 'white' : receivedMessageTextColor} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={message.id} style={bubbleStyle}>
        <Text style={textStyle}>{message.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <LinearGradient
        colors={chatGradientColors}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // Adjust this offset if keyboard covers input on iOS
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.chatWindowMainContent, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)' }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={headerTitleColor} /> {/* Dynamic back button color */}
              </TouchableOpacity>
              <Image source={{ uri: recipientImg || 'https://randomuser.me/api/portraits/men/99.jpg' }} style={styles.headerAvatar} />
              <View style={styles.headerInfo}>
                <Text style={[styles.headerTitle, { color: headerTitleColor }]}>{recipientName || 'Someone'}</Text>
                <Text style={[styles.headerStatus, { color: headerStatusColor }]}>Online</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="videocam" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="call" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={selectChatBackground}>
                  <Ionicons name="color-palette" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {loadingMessages ? (
              <View style={styles.loadingMessagesContainer}>
                <ActivityIndicator size="large" color="#5b4285" />
                <Text style={[styles.loadingMessagesText, { color: mutedTextColor }]}>Loading messages...</Text>
              </View>
            ) : messages.length === 0 ? (
              <ScrollView
                ref={scrollViewRef}
                style={styles.chatArea}
                contentContainerStyle={styles.chatAreaContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.placeholderText, { color: mutedTextColor }]}>
                  Start a conversation!
                </Text>
              </ScrollView>
            ) : (
              <ScrollView
                ref={scrollViewRef}
                style={styles.chatArea}
                contentContainerStyle={styles.chatAreaContent}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="interactive"
              >
                <View style={styles.chatAreaTopPadding} />
                {messages.map((msg) => (
                  // Assuming your message object has an 'id' and 'sender_id'
                  <React.Fragment key={msg.id}>
                    {renderMessage(msg)}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#4a5568' : (Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : 'white'), borderColor: colorScheme === 'dark' ? '#2d3748' : '#e0e0e0' }]}>
              <TouchableOpacity style={styles.inputIconButton}>
                <Ionicons name="mic-outline" size={24} color={colorScheme === 'dark' ? '#cbd5e0' : '#a0aec0'} />
              </TouchableOpacity>
              <TextInput
                style={[styles.textInput, { color: colorScheme === 'dark' ? '#f7fafc' : '#1f2937' }]}
                placeholder="Type your message..."
                placeholderTextColor={placeholderTextColor}
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={styles.inputIconButton}>
                <Ionicons name="at-outline" size={24} color={colorScheme === 'dark' ? '#cbd5e0' : '#a0aec0'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Ionicons name="send" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  chatWindowMainContent: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? 30 : 0,
    paddingTop: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 0,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(91, 66, 133, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatAreaContent: {
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  chatAreaTopPadding: {
    height: 20,
  },
  placeholderText: {
    marginTop: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessagesText: {
    marginTop: 10,
    fontSize: 16,
  },
  sentMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#5b4285',
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  receivedMessageBubble: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentMessageText: {
    fontSize: 15,
    color: 'white',
  },
  receivedMessageText: {
    fontSize: 15,
  },
  fileIcon: {
    marginRight: 8,
  },
  fileSizeText: {
    fontSize: 12,
  },
  downloadIconContainer: {
    marginLeft: 10,
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    height: 40,
  },
  inputIconButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#5b4285',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
});