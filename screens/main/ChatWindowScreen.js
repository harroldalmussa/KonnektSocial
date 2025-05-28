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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const chatBackgroundColors = {
  purple: ['#5b4285', '#7f58a7'],
  darkPurple: ['#3a0050', '#1a0028'],
  blue: ['#3B82F6', '#60a5fa'],
  ivoryCream: ['#f5f5dc', '#fffafa'],
  green: ['#10b981', '#34d399'],
};

const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';
const SOCKET_SERVER_URL = `http://${YOUR_LOCAL_IP_ADDRESS}:3000`;

export default function ChatWindowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { chatId, user: recipientName, email: recipientEmail, img: recipientImg } = route.params || {};

  const colorScheme = useColorScheme();

  const [chatGradientColors, setChatGradientColors] = useState(chatBackgroundColors.purple);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);

  const scrollViewRef = useRef();
  const socketRef = useRef(null);

  const receivedBubbleBg = colorScheme === 'dark' ? '#374151' : 'white';
  const receivedMessageTextColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const fileDetailsColor = colorScheme === 'dark' ? '#cbd5e0' : '#6b7280';
  const placeholderTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#a0aec0';

  const headerTitleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const headerStatusColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';

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
        navigation.replace('Auth');
        return;
      }
      setCurrentUserData(JSON.parse(storedUserData));

      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/${chatId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response from server: ${text}`);
      }

      if (response.ok) {
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
    const loadDefaultWallpaper = async () => {
      try {
        const storedWallpaperKey = await AsyncStorage.getItem('app_wallpaper');
        if (storedWallpaperKey && chatBackgroundColors[storedWallpaperKey]) {
          setChatGradientColors(chatBackgroundColors[storedWallpaperKey]);
        } else {
          setChatGradientColors(chatBackgroundColors.purple);
        }
      } catch (error) {
        console.error('Failed to load default wallpaper:', error);
      }
    };
    loadDefaultWallpaper();

    const setupWebSocket = async () => {
      if (!isFocused || socketRef.current) return;

      const storedToken = await AsyncStorage.getItem('access_token');
      if (!storedToken) {
        console.warn('No access token for WebSocket, skipping connection.');
        return;
      }

      socketRef.current = io(SOCKET_SERVER_URL, {
        auth: {
          token: storedToken
        },
        transports: ['websocket']
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket server');
        if (chatId) {
          socketRef.current.emit('join_chat', chatId);
        }
      });

      socketRef.current.on('receiveMessage', (newMessage) => {
        console.log('Received new message via WebSocket:', newMessage);
        setMessages((prevMessages) => {
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages.map(msg =>
              msg.id === newMessage.id ? { ...newMessage, status: 'sent' } : msg
            ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          }
          return [...prevMessages, newMessage].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        Alert.alert('WebSocket Error', `Could not connect to chat server: ${error.message}`);
      });
    };

    if (isFocused) {
      setupWebSocket();
      fetchMessages();
    }

    return () => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('Disconnecting WebSocket on unmount/unfocus');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchMessages, colorScheme, chatId, isFocused]);

  useEffect(() => {
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

    const messageToSend = messageText.trim();
    setMessageText('');
    Keyboard.dismiss();

    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      id: tempMessageId,
      chat_id: chatId,
      sender_id: currentUserData.uid,
      text: messageToSend,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prevMessages) =>
      [...prevMessages, optimisticMessage].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    );

    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          text: messageToSend,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Message sent via REST API:', data.data);
      } else {
        console.error('Failed to send message via REST:', data);
        Alert.alert('Error', data.detail || 'Failed to send message.');
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
          )
        );
      }
    } catch (error) {
      console.error('Network or API Error sending message:', error);
      Alert.alert('Error', `Network or API Error: ${error.message || 'Unknown error'}.`);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const renderMessage = (message) => {
    const isMyMessage = message.sender_id === currentUserData?.uid;
    const bubbleStyle = isMyMessage ? styles.sentMessageBubble : [styles.receivedMessageBubble, { backgroundColor: receivedBubbleBg }];
    const textStyle = isMyMessage ? styles.sentMessageText : [styles.receivedMessageText, { color: receivedMessageTextColor }];

    return (
      <View key={message.id} style={bubbleStyle}>
        <Text style={textStyle}>{message.text}</Text>
        <Text style={[styles.messageTimestamp, { color: isMyMessage ? 'rgba(255,255,255,0.7)' : fileDetailsColor }]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {message.status === 'sending' && (
          <ActivityIndicator size="small" color={isMyMessage ? 'rgba(255,255,255,0.7)' : fileDetailsColor} style={{ marginLeft: 5 }} />
        )}
        {message.status === 'failed' && (
          <Ionicons name="alert-circle" size={16} color="red" style={{ marginLeft: 5 }} />
        )}
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.chatWindowMainContent, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)' }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={headerTitleColor} />
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
                <Text style={[styles.loadingMessagesText, { color: placeholderTextColor }]}>Loading messages...</Text>
              </View>
            ) : messages.length === 0 ? (
              <ScrollView
                ref={scrollViewRef}
                style={styles.chatArea}
                contentContainerStyle={styles.chatAreaContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.placeholderText, { color: placeholderTextColor }]}>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  sentMessageText: {
    fontSize: 15,
    color: 'white',
    marginRight: 8,
  },
  receivedMessageText: {
    fontSize: 15,
    marginRight: 8,
  },
  messageTimestamp: {
    fontSize: 10,
    opacity: 0.8,
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