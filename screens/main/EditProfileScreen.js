// screens/main/EditProfileScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

import { AuthContext } from '../context/AuthContext';

const DEFAULT_PROFILE_PIC = require('../../assets/razom-logo.png');
const MAX_BIO_LENGTH = 200;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  useContext(AuthContext); 

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+33');

  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const inputBg = colorScheme === 'dark' ? '#2d3748' : '#e2e8f0';
  const inputBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const buttonBg = '#5b4285';
  const buttonTextColor = '#ffffff';
  const headerBg = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const iconColor = colorScheme === 'dark' ? '#93c5fd' : '#1f2937';
  const glowColor = '#c6a4fa';
  const pickerBg = colorScheme === 'dark' ? '#374151' : 'white';
  const pickerItemColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';


  useEffect(() => {
    const loadCurrentUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user_data');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setName(parsedUserData.name || '');
          setEmail(parsedUserData.email || '');
          setBio(parsedUserData.bio || '');
          setProfilePicture(parsedUserData.profilePicture || null);
          setPhoneNumber(parsedUserData.phoneNumber || '');
          setCountryCode(parsedUserData.countryCode || '+33');
        }
      } catch (error) {
        console.error('Failed to load current user data for editing:', error);
      }
    };
    loadCurrentUserData();
  }, []);

  const handleChoosePhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updatedUserData = {
        name,
        email,
        bio,
        profilePicture,
        phoneNumber,
        countryCode,
      };

      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUserData));
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save user data:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const countries = [
    { label: 'France (+33)', value: '+33' },
    { label: 'United Kingdom (+44)', value: '+44' },
    { label: 'United States (+1)', value: '+1' },
    { label: 'Canada (+1)', value: '+1' },
    { label: 'Germany (+49)', value: '+49' },
    { label: 'Spain (+34)', value: '+34' },
    { label: 'Italy (+39)', value: '+39' },
    { label: 'Australia (+61)', value: '+61' },
    { label: 'India (+91)', value: '+91' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.container}>
            <TouchableOpacity onPress={handleChoosePhoto} style={styles.profilePictureContainer}>
              <Image
                source={profilePicture ? { uri: profilePicture } : DEFAULT_PROFILE_PIC}
                style={styles.profilePicture}
              />
              <View style={styles.cameraIconOverlay}>
                <Ionicons name="camera" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.label, { color: textColor }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: textColor,
                shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 10,
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={mutedTextColor}
            />

            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: textColor,
                shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 10,
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={mutedTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: textColor }]}>Phone Number</Text>
            <View style={[styles.phoneNumberContainer, { borderColor: inputBorderColor, backgroundColor: inputBg,
              shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 10,
            }]}>
              <View style={[styles.pickerContainer, { backgroundColor: pickerBg, borderColor: inputBorderColor }]}>
                <Picker
                  selectedValue={countryCode}
                  onValueChange={(itemValue) => setCountryCode(itemValue)}
                  dropdownIconColor={textColor}
                  style={[styles.countryCodePicker, { color: pickerItemColor }]}
                >
                  {countries.map((country, index) => (
                    <Picker.Item key={index} label={country.label} value={country.value} color={pickerItemColor} />
                  ))}
                </Picker>
              </View>
              <TextInput
                style={[styles.phoneInput, { color: textColor }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor={mutedTextColor}
                keyboardType="phone-pad"
              />
            </View>


            <Text style={[styles.label, { color: textColor }]}>Bio ({bio.length}/{MAX_BIO_LENGTH})</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: inputBg, borderColor: inputBorderColor, color: textColor,
                shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 10,
              }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={mutedTextColor}
              multiline
              numberOfLines={4}
              maxLength={MAX_BIO_LENGTH}
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: buttonBg,
                borderColor: glowColor, borderWidth: 2.5,
                shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 15,
              }]}
              onPress={handleSaveChanges}
            >
              <Text style={[styles.saveButtonText, { color: buttonTextColor }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
    padding: 20,
    alignItems: 'center',
  },
  profilePictureContainer: {
    marginBottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    resizeMode: 'cover',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 15,
    overflow: 'hidden',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '35%',
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  countryCodePicker: {
    height: '100%',
    width: '100%',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    height: '100%',
  },
  saveButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 35,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});