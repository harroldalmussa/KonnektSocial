// screens/main/ShareProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme,
  Clipboard, 
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // To get username

const { width } = Dimensions.get('window');

export default function ShareProfileScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const [username, setUsername] = useState('');
  const [profileLink, setProfileLink] = useState('https://your-app.com/profile/'); 

  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const screenBgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const iconColor = colorScheme === 'dark' ? '#93c5fd' : '#1f2937';
  const buttonBg = '#5b4285'; 
  const buttonTextColor = '#ffffff';
  const glowColor = '#c6a4fa'; 


  useEffect(() => {
    const loadUsername = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user_data');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          const loadedUsername = parsedUserData.username || 'user_handle'; 
          setUsername(loadedUsername);
          setProfileLink(`https://your-app.com/profile/${loadedUsername}`);
        }
      } catch (error) {
        console.error('Failed to load username:', error);
        setUsername('user_handle'); 
      }
    };
    loadUsername();
  }, []);

  const handleCopyLink = () => {
    Clipboard.setString(profileLink);
    Alert.alert('Link Copied!', 'Your profile link has been copied to clipboard.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Share Profile</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.container}>
        <Text style={[styles.shareInstruction, { color: textColor }]}>
          Share your profile with friends!
        </Text>

        <View style={[styles.qrCodeContainer, {
          shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 15, // Glow effect
        }]}>
          {username ? (
            <QRCode
              value={profileLink} 
              size={width * 0.6} 
              color={textColor}
              backgroundColor={screenBgColor === '#1a202c' ? 'black' : 'white'}
            />
          ) : (
            <Text style={[styles.loadingText, { color: mutedTextColor }]}>Loading QR Code...</Text>
          )}
        </View>

        <View style={styles.usernameHandleContainer}>
          <Text style={[styles.usernameHandleLabel, { color: mutedTextColor }]}>Your Username Handle:</Text>
          <Text style={[styles.usernameHandleText, { color: textColor }]}>@{username}</Text>
        </View>

        <TouchableOpacity
          style={[styles.copyLinkButton, { backgroundColor: buttonBg,
            borderColor: glowColor, borderWidth: 2.5, 
            shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 15,
          }]}
          onPress={handleCopyLink}
        >
          <Ionicons name="copy-outline" size={20} color={buttonTextColor} style={styles.buttonIcon} />
          <Text style={[styles.copyLinkButtonText, { color: buttonTextColor }]}>Copy Profile Link</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  shareInstruction: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '600',
  },
  qrCodeContainer: {
    marginBottom: 40,
    padding: 10,
    backgroundColor: 'white', 
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 16,
  },
  usernameHandleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  usernameHandleLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  usernameHandleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  buttonIcon: {
    marginRight: 10,
  },
  copyLinkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});