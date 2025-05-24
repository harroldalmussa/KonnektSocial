// screens/main/CreatePostScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Image,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const { width } = Dimensions.get('window');
const VIDEO_ASPECT_RATIO = 9 / 16;

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const videoRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Post');
  const [postText, setPostText] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('Happy');
  const [momentUri, setMomentUri] = useState(null);
  const [momentType, setMomentType] = useState(null);
  const [momentDescription, setMomentDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Gaming');

  // Dynamic colors
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const headerBg = colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)';
  const inputBg = colorScheme === 'dark' ? '#4a5568' : 'white';
  const inputBorder = colorScheme === 'dark' ? '#2d3748' : '#e0e0e0';
  const activeTabBg = '#5b4285';
  const inactiveTabBg = colorScheme === 'dark' ? '#4a5568' : '#e2e8f0';
  const activeTabText = 'white';
  const inactiveTabText = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const pickerBg = colorScheme === 'dark' ? '#374151' : 'white';
  const pickerItemColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';

  const feelings = ['Happy', 'Sad', 'Excited', 'Relaxed', 'Angry', 'Grateful', 'Motivated'];
  const categories = ['Gaming', 'Comedy', 'Productivity', 'Fashion', 'Art', 'Music', 'Travel', 'Food'];

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
    } else {
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
      id: Date.now(), // Unique ID for the post
      text: postText.trim(),
      feeling: selectedFeeling,
      timestamp: new Date().toISOString(), // Store current timestamp
      likes: 0,
      comments: [],
      shares: 0,
    };

    try {
      const existingPosts = await AsyncStorage.getItem('user_posts');
      const posts = existingPosts ? JSON.parse(existingPosts) : [];
      const updatedPosts = [newPost, ...posts]; // Add new post to the beginning
      await AsyncStorage.setItem('user_posts', JSON.stringify(updatedPosts));
      console.log('Post saved successfully:', newPost);
      Alert.alert('Post Created', `Your post about being "${selectedFeeling}" has been published!`);
      setPostText('');
      setSelectedFeeling('Happy');
      navigation.navigate('Profile'); // Navigate to profile after creating post
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
      id: Date.now(), // Unique ID for the moment
      uri: momentUri,
      type: momentType,
      description: momentDescription.trim(),
      category: selectedCategory,
      timestamp: new Date().toISOString(), // Store current timestamp
    };

    try {
      const existingMoments = await AsyncStorage.getItem('user_moments'); // Changed key to 'user_moments' for clarity
      const moments = existingMoments ? JSON.parse(existingMoments) : [];
      const updatedMoments = [newMoment, ...moments]; // Add new moment to the beginning
      await AsyncStorage.setItem('user_moments', JSON.stringify(updatedMoments));
      console.log('Moment saved successfully:', newMoment);
      Alert.alert('Moment Uploaded', `Your ${momentType} moment has been uploaded!`);
      setMomentUri(null);
      setMomentType(null);
      setMomentDescription('');
      setSelectedCategory('Gaming');
      navigation.navigate('Profile'); // Navigate to profile after creating moment
    } catch (error) {
      console.error('Failed to save moment:', error);
      Alert.alert('Error', 'Failed to save your moment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : 'transparent' }]}>
      <View style={[styles.container, { backgroundColor: headerBg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Create New</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabSelectionContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Post' && { backgroundColor: activeTabBg }]}
            onPress={() => setActiveTab('Post')}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'Post' ? activeTabText : inactiveTabText }]}>
              New Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Moment' && { backgroundColor: activeTabBg }]}
            onPress={() => setActiveTab('Moment')}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'Moment' ? activeTabText : inactiveTabText }]}>
              New Moment
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContainer}>
          {activeTab === 'Post' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Write your Post</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                placeholder="What's on your mind?"
                placeholderTextColor={mutedTextColor}
                multiline
                numberOfLines={6}
                value={postText}
                onChangeText={setPostText}
              />
              <Text style={[styles.sectionTitle, { color: textColor, marginTop: 20 }]}>How are you feeling?</Text>
              <View style={[styles.pickerContainer, { backgroundColor: pickerBg, borderColor: inputBorder }]}>
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

              <TouchableOpacity style={styles.createButton} onPress={handleCreatePost}>
                <Text style={styles.createButtonText}>Publish Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'Moment' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Upload a Photo or Video</Text>
              <View style={styles.mediaUploadContainer}>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: inactiveTabBg }]}
                  onPress={() => pickMedia('image')}
                >
                  <Ionicons name="image-outline" size={30} color={inactiveTabText} />
                  <Text style={[styles.uploadButtonText, { color: inactiveTabText }]}>Select Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: inactiveTabBg }]}
                  onPress={() => pickMedia('video')}
                >
                  <Ionicons name="videocam-outline" size={30} color={inactiveTabText} />
                  <Text style={[styles.uploadButtonText, { color: inactiveTabText }]}>Select Video (9:16)</Text>
                </TouchableOpacity>
              </View>

              {momentUri && (
                <View style={styles.mediaPreviewContainer}>
                  {momentType === 'image' ? (
                    <Image source={{ uri: momentUri }} style={styles.previewMedia} />
                  ) : (
                    <Video
                      ref={videoRef}
                      source={{ uri: momentUri }}
                      style={[styles.previewMedia, { height: (width - 40) * VIDEO_ASPECT_RATIO }]}
                      useNativeControls
                      resizeMode="contain"
                      isLooping
                    />
                  )}
                  {/* Basic Editing Placeholders (Actual implementation would be complex) */}
                  <View style={styles.editingControls}>
                    <Text style={[styles.editingText, { color: mutedTextColor }]}>Basic edits (saturation, brightness, vibrancy) would apply here on upload.</Text>
                  </View>
                </View>
              )}

              <Text style={[styles.sectionTitle, { color: textColor, marginTop: 20 }]}>Description (max 200 chars)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                placeholder="Add a description for your moment..."
                placeholderTextColor={mutedTextColor}
                multiline
                numberOfLines={3}
                maxLength={200}
                value={momentDescription}
                onChangeText={setMomentDescription}
              />
              <Text style={[styles.characterCount, { color: mutedTextColor }]}>
                {momentDescription.length}/200
              </Text>

              <Text style={[styles.sectionTitle, { color: textColor, marginTop: 20 }]}>Select Category</Text>
              <View style={[styles.pickerContainer, { backgroundColor: pickerBg, borderColor: inputBorder }]}>
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

              <TouchableOpacity style={styles.createButton} onPress={handleCreateMoment}>
                <Text style={styles.createButtonText}>Upload Moment</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: Platform.OS === 'android' ? 30 : 0,
    overflow: 'hidden',
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
  tabSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentScrollContainer: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  createButton: {
    backgroundColor: '#5b4285',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mediaUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  mediaPreviewContainer: {
    marginTop: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewMedia: {
    width: '100%',
    height: width * 16 / 9,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  editingControls: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    width: '100%',
    alignItems: 'center',
  },
  editingText: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 5,
  },
});
