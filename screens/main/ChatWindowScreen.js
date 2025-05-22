// screens/main/ChatWindowScreen.js
import React, { useState, useEffect, useRef } from 'react'; // Import useEffect for loading wallpaper
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

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
  const { user, email, img } = route.params || {};
  // Initialize with default or loaded wallpaper
  const [chatGradientColors, setChatGradientColors] = useState(chatBackgroundColors.purple);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey 👋', sender: 'other' },
    { id: '2', text: 'Are you available for a New UI Project', sender: 'me' },
    { id: '3', text: 'Hello!', sender: 'other' },
    { id: '4', text: 'yes, have some space for the new task', sender: 'me' },
    { id: '5', text: 'Cool, should I share the details now?', sender: 'other' },
    { id: '6', text: 'Yes Sure, please', sender: 'me' },
    { id: '7', text: 'Great, here is the SOW of the Project', sender: 'other' },
    { id: '8', text: 'UI Brief.docx', sender: 'other', type: 'file', fileSize: '289.18 KB' },
    { id: '9', text: 'Ok. Let me check', sender: 'me' },
  ]);

  const scrollViewRef = useRef();

  useEffect(() => {
    // Load default wallpaper from AsyncStorage when component mounts
    const loadDefaultWallpaper = async () => {
      try {
        const storedWallpaperKey = await AsyncStorage.getItem('app_wallpaper');
        if (storedWallpaperKey && wallpaperGradients[storedWallpaperKey]) {
          setChatGradientColors(wallpaperGradients[storedWallpaperKey]);
        }
      } catch (error) {
        console.error('Failed to load default wallpaper:', error);
      }
    };
    loadDefaultWallpaper();

    // Scroll to bottom on messages change
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]); // messages in dependency array for auto-scroll

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

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        id: String(messages.length + 1),
        text: messageText.trim(),
        sender: 'me',
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessageText('');
      Keyboard.dismiss();
    }
  };

  const renderMessage = (message) => {
    const isMyMessage = message.sender === 'me';
    const bubbleStyle = isMyMessage ? styles.sentMessageBubble : styles.receivedMessageBubble;
    const textStyle = isMyMessage ? styles.sentMessageText : styles.receivedMessageText;

    if (message.type === 'file') {
      return (
        <View key={message.id} style={bubbleStyle}>
          <Ionicons name="document-text-outline" size={20} color={isMyMessage ? 'white' : '#1f2937'} style={styles.fileIcon} />
          <View>
            <Text style={textStyle}>{message.text}</Text>
            <Text style={styles.fileSizeText}>{message.fileSize}</Text>
          </View>
          <TouchableOpacity style={styles.downloadIconContainer}>
            <Ionicons name="download-outline" size={20} color={isMyMessage ? 'white' : '#1f2937'} />
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.chatWindowMainContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Image source={{ uri: img || 'https://randomuser.me/api/portraits/men/99.jpg' }} style={styles.headerAvatar} />
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{user || 'Someone'}</Text>
                <Text style={styles.headerStatus}>Online</Text>
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

            <ScrollView
              ref={scrollViewRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chatAreaContent}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
            >
              <View style={styles.chatAreaTopPadding} />
              {messages.map(renderMessage)}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.inputIconButton}>
                <Ionicons name="mic-outline" size={24} color="#a0aec0" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message..."
                placeholderTextColor="#a0aec0"
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={styles.inputIconButton}>
                <Ionicons name="at-outline" size={24} color="#a0aec0" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginTop: Platform.OS === 'android' ? 30 : 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    color: '#1f2937',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4b5563',
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
    flexGrow: 1, // Ensures content takes up minimum full height, pushes content to top
    justifyContent: 'flex-end', // Pushes messages to the bottom
  },
  chatAreaTopPadding: {
    height: 20,
  },
  placeholderText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
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
    backgroundColor: 'white',
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
    color: '#1f2937',
  },
  fileIcon: {
    marginRight: 8,
  },
  fileSizeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  downloadIconContainer: {
    marginLeft: 10,
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : 'white', // Glassmorphism for iOS, solid white on Android
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
    borderWidth: 1, // Add a subtle border
    borderColor: '#e0e0e0', // Light gray border
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1f2937',
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