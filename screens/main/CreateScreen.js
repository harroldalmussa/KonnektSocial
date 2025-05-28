// screens/main/CreateScreen.js
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    Platform,
    Alert,
    Dimensions,
    Image,
    ActivityIndicator,
    Modal,
} from 'react-native';

import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker'; 
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import Slider from '@react-native-community/slider';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = '****'; 

const { width } = Dimensions.get('window');
const VIDEO_ASPECT_RATIO_UPLOAD = 9 / 16;

export default function CreateScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const colorScheme = useColorScheme();
    const { userToken, userData } = useContext(AuthContext);

    const videoRef = useRef(null);
    const collectionPreviewVideoRef = useRef(null);

    const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
    const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
    const headerBgColor = colorScheme === 'dark' ? '#2d3748' : 'white';
    const screenBgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
    const inputBg = colorScheme === 'dark' ? '#4a5568' : 'white';
    const inputBorder = colorScheme === 'dark' ? '#2d3748' : '#e0e0e0';
    const activeTabBg = '#5b4285';
    const inactiveTabBg = colorScheme === 'dark' ? '#4a5568' : '#e2e8f0';
    const activeTabText = 'white';
    const inactiveTabText = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
    const pickerBg = colorScheme === 'dark' ? '#374151' : 'white';
    const pickerItemColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
    const thumbnailBg = colorScheme === 'dark' ? '#2d3748' : '#f0f0f0';
    const thumbnailBorder = colorScheme === 'dark' ? '#4a5568' : '#e0e0e0';

    const [activeCreationTab, setActiveCreationTab] = useState('New Post');
    const [postText, setPostText] = useState('');
    const [selectedFeeling, setSelectedFeeling] = useState('Happy');
    const [loadingPost, setLoadingPost] = useState(false);

    const [originalMediaUri, setOriginalMediaUri] = useState(null);
    const [momentType, setMomentType] = useState(null);
    const [momentDescription, setMomentDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Gaming');
    const [isUploadingMoment, setIsUploadingMoment] = useState(false);
    const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);

    const [adjustedImageBase64, setAdjustedImageBase64] = useState(null);
    const [brightnessValue, setBrightnessValue] = useState(1.0);
    const [contrastValue, setContrastValue] = useState(1.0);
    const [saturationValue, setSaturationValue] = useState(1.0);
    const [grayscaleFilterActive, setGrayscaleFilterActive] = useState(false);
    const [isProcessingLive, setIsProcessingLive] = useState(false);

    const [userMoments, setUserMoments] = useState([]);
    const [loadingMoments, setLoadingMoments] = useState(false);
    const [selectedMomentsForCollection, setSelectedMomentsForCollection] = useState([]);
    const [collectionName, setCollectionName] = useState('');
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);

    const feelings = ['Happy', 'Sad', 'Excited', 'Relaxed', 'Angry', 'Grateful', 'Motivated'];
    const categories = ['Gaming', 'Comedy', 'Productivity', 'Fashion', 'Art', 'Music', 'Travel', 'Food'];

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
            } else {
                Alert.alert('Error', `Failed to load moments: ${data.error || 'Unknown error'}`);
                setUserMoments([]);
            }
        } catch (error) {
            console.error('Failed to fetch user moments:', error);
            Alert.alert('Error', 'Failed to load moments from server.');
            setUserMoments([]);
        } finally {
            setLoadingMoments(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused && activeCreationTab === 'New Collection') {
            fetchUserMoments();
        }
    }, [isFocused, activeCreationTab, fetchUserMoments]);

    const handleCreatePost = async () => {
        if (postText.trim().length < 10 || postText.trim().length > 500) {
            Alert.alert('Invalid Post', 'Post content must be between 10 and 500 characters.');
            return;
        }

        setLoadingPost(true);
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                Alert.alert('Authentication Error', 'You are not logged in.');
                setLoadingPost(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: postText.trim(),
                    feeling: selectedFeeling,
                    image: null,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('Post Created', `Your post about being "${selectedFeeling}" has been published!`);
                setPostText('');
                setSelectedFeeling('Happy');
            } else {
                Alert.alert('Error Creating Post', data.error || 'Failed to create post. Please try again.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
        } finally {
            setLoadingPost(false);
        }
    };

    const pickMedia = async (mediaType) => {
        console.log('Attempting to pick media of type:', mediaType);

        if (Platform.OS !== 'web') {
            const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('Media library permission status:', mediaLibraryStatus);
            if (mediaLibraryStatus !== 'granted') {
                Alert.alert('Permission required', 'Please grant access to your media library to upload photos/videos.');
                return;
            }
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            console.log('Camera permission status:', cameraStatus);

        }

        let result;
        try {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos, 
                allowsEditing: true,
                aspect: mediaType === 'image' ? [4, 3] : [9, 16],
                quality: 1,
                base64: false,
            });

            console.log('ImagePicker result:', result);

            if (!result.canceled) {
                console.log('Media selection successful, asset URI:', result.assets[0].uri);
                const selectedAsset = result.assets[0];
                setOriginalMediaUri(selectedAsset.uri);
                setMomentType(selectedAsset.type);
                setAdjustedImageBase64(null);
                setBrightnessValue(1.0);
                setContrastValue(1.0);
                setSaturationValue(1.0);
                setGrayscaleFilterActive(false);
                setShowImagePreviewModal(true);
            } else {
                console.log('Media selection cancelled by user.');
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Media Picker Error', 'An error occurred while trying to open the media library. Please try again.');
        }
    };

    const applyImageAdjustments = useCallback(async () => {
        if (!originalMediaUri || momentType !== 'image') {
            setAdjustedImageBase64(null);
            return;
        }

        setIsProcessingLive(true);
        setAdjustedImageBase64(null);

        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                 console.warn('No token found for image processing. Skipping processing.');
                 setIsProcessingLive(false);
                 return;
            }

            const fileResponse = await fetch(originalMediaUri);
            const blob = await fileResponse.blob();

            const formData = new FormData();
            formData.append('image', blob, 'original_image.jpg');
            formData.append('brightness', brightnessValue.toFixed(2));
            formData.append('contrast', contrastValue.toFixed(2));
            formData.append('saturation', saturationValue.toFixed(2));
            formData.append('grayscale', grayscaleFilterActive.toString());

            console.log('Sending image for processing to backend...');
            const apiResponse = await axios.post(`${API_BASE_URL}/process-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
                timeout: 30000,
            });

            if (apiResponse.data && apiResponse.data.processedImage) {
                setAdjustedImageBase64(`data:image/png;base64,${apiResponse.data.processedImage}`);
            } else {
                Alert.alert('Processing Error', 'Backend did not return a processed image.');
                setAdjustedImageBase64(null);
            }

        } catch (error) {
            console.error('Error applying image adjustments:', error.response?.data || error.message || error);
            Alert.alert('Processing Failed', `Could not apply adjustments: ${error.message || 'Unknown error'}`);
            setAdjustedImageBase64(null);
        } finally {
            setIsProcessingLive(false);
        }
    }, [originalMediaUri, momentType, brightnessValue, contrastValue, saturationValue, grayscaleFilterActive]);

    useEffect(() => {
        if (originalMediaUri && momentType === 'image') {
            const handler = setTimeout(() => {
                applyImageAdjustments();
            }, 300);
            return () => clearTimeout(handler);
        } else if (originalMediaUri && momentType === 'video') {
            setAdjustedImageBase64(null);
        } else {
            setAdjustedImageBase64(null);
        }
    }, [brightnessValue, contrastValue, saturationValue, grayscaleFilterActive, originalMediaUri, momentType, applyImageAdjustments]);


    const handleApplyEditsAndSubmitMoment = async () => {
        if (!originalMediaUri) {
            Alert.alert('No Media Selected', 'Please select a photo or video for your moment.');
            return;
        }
        if (momentDescription.trim().length > 200) {
            Alert.alert('Description Too Long', 'Moment description cannot exceed 200 characters.');
            return;
        }

        setIsUploadingMoment(true);
        setShowImagePreviewModal(false);

        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                Alert.alert('Authentication Error', 'You are not logged in.');
                return;
            }

            let finalMediaUriToUpload;
            let finalMediaType = momentType;

            if (momentType === 'image') {
                if (adjustedImageBase64) {
                    const tempFilePath = FileSystem.cacheDirectory + `processed_image_${Date.now()}.png`;
                    const base64Data = adjustedImageBase64.split(',')[1];
                    await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    finalMediaUriToUpload = tempFilePath;
                } else {
                    finalMediaUriToUpload = originalMediaUri;
                }
            } else {
                finalMediaUriToUpload = originalMediaUri;
            }

            if (!finalMediaUriToUpload) {
                Alert.alert('Error', 'Failed to prepare media for upload.');
                return;
            }

            const formData = new FormData();
            formData.append('momentFile', {
                uri: finalMediaUriToUpload,
                name: `moment_${userData.id}_${Date.now()}.${finalMediaType === 'image' ? 'png' : 'mp4'}`,
                type: `${finalMediaType}/${finalMediaType === 'image' ? 'png' : 'mp4'}`,
            });
            formData.append('note', momentDescription.trim());
            formData.append('category', selectedCategory);

            const response = await axios.post(
                `${API_BASE_URL}/moments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                    timeout: 60000,
                }
            );

            if (response.data) {
                Alert.alert('Moment Uploaded', `Your ${finalMediaType} moment has been uploaded!`);
                setOriginalMediaUri(null);
                setMomentType(null);
                setMomentDescription('');
                setSelectedCategory('Gaming');
                setAdjustedImageBase64(null);
                setBrightnessValue(1.0);
                setContrastValue(1.0);
                setSaturationValue(1.0);
                setGrayscaleFilterActive(false);

                navigation.navigate('Profile', { initialTab: 'Moments' });
            } else {
                Alert.alert('Error Uploading Moment', 'Failed to upload moment. Please try again.');
            }
        } catch (error) {
            console.error('Error during moment upload:', error.response?.data || error.message || error);
            Alert.alert('Upload Error', `Failed to upload moment: ${error.message || 'Unknown error'}.`);
        } finally {
            setIsUploadingMoment(false);
        }
    };

    const handleCancelMomentUpload = () => {
        setOriginalMediaUri(null);
        setMomentType(null);
        setMomentDescription('');
        setAdjustedImageBase64(null);
        setShowImagePreviewModal(false);
        setBrightnessValue(1.0);
        setContrastValue(1.0);
        setSaturationValue(1.0);
        setGrayscaleFilterActive(false);
        setIsProcessingLive(false);
    };

    const toggleMomentSelection = (momentId) => {
        setSelectedMomentsForCollection((prevSelected) => {
            if (prevSelected.includes(momentId)) {
                return prevSelected.filter((id) => id !== momentId);
            } else {
                return [...prevSelected, momentId];
            }
        });
    };

    const handleCreateCollection = async () => {
        if (collectionName.trim().length < 3) {
            Alert.alert('Invalid Name', 'Collection name must be at least 3 characters.');
            return;
        }
        if (selectedMomentsForCollection.length === 0) {
            Alert.alert('No Moments Selected', 'Please select at least one moment for your collection.');
            return;
        }

        setIsCreatingCollection(true);
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                Alert.alert('Authentication Error', 'You are not logged in.');
                setIsCreatingCollection(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/collections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: collectionName.trim(),
                    momentIds: selectedMomentsForCollection,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('Collection Created', `Collection "${collectionName}" has been created with ${selectedMomentsForCollection.length} moments!`);
                setCollectionName('');
                setSelectedMomentsForCollection([]);
            } else {
                Alert.alert('Error Creating Collection', data.error || 'Failed to create collection. Please try again.');
            }

        } catch (error) {
            console.error('Error creating collection:', error);
            Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
        } finally {
            setIsCreatingCollection(false);
        }
    };

    const getMomentThumbnailSource = (moment) => {
        if (moment.type === 'image') {
            return { uri: `data:image/png;base64,${moment.src}` };
        } else if (moment.type === 'video') {
            return { uri: moment.src };
        }
        return null;
    };


    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBgColor }]}>
            <View style={[styles.header, { backgroundColor: headerBgColor }]}>
                <Text style={[styles.headerTitle, { color: textColor }]}>Create</Text>
            </View>

            <View style={styles.tabSelectionContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeCreationTab === 'New Post' && { backgroundColor: activeTabBg }]}
                    onPress={() => setActiveCreationTab('New Post')}
                >
                    <Text style={[styles.tabButtonText, { color: activeCreationTab === 'New Post' ? activeTabText : inactiveTabText }]}>
                        New Post
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeCreationTab === 'New Moment' && { backgroundColor: activeTabBg }]}
                    onPress={() => setActiveCreationTab('New Moment')}
                >
                    <Text style={[styles.tabButtonText, { color: activeCreationTab === 'New Moment' ? activeTabText : inactiveTabText }]}>
                        New Moment
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeCreationTab === 'New Collection' && { backgroundColor: activeTabBg }]}
                    onPress={() => setActiveCreationTab('New Collection')}
                >
                    <Text style={[styles.tabButtonText, { color: activeCreationTab === 'New Collection' ? activeTabText : inactiveTabText }]}>
                        New Collection
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContainer}>
                {activeCreationTab === 'New Post' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Write your Post</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            placeholder="What's on your mind? (10-500 characters)"
                            placeholderTextColor={mutedTextColor}
                            multiline
                            numberOfLines={6}
                            value={postText}
                            onChangeText={setPostText}
                            maxLength={500}
                        />
                        <Text style={[styles.characterCount, { color: mutedTextColor }]}>
                            {postText.length}/500
                        </Text>
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

                        <TouchableOpacity
                            style={[styles.createButton, loadingPost && { opacity: 0.5 }]}
                            onPress={handleCreatePost}
                            disabled={loadingPost}
                        >
                            {loadingPost ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.createButtonText}>Publish Post</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {activeCreationTab === 'New Moment' && (
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
                    </View>
                )}

                {activeCreationTab === 'New Collection' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Create New Collection</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            placeholder="Collection Name (e.g., 'Summer Adventures', 'Coding Journey')"
                            placeholderTextColor={mutedTextColor}
                            value={collectionName}
                            onChangeText={setCollectionName}
                        />
                        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 20 }]}>Select Moments for Collection</Text>
                        {loadingMoments ? (
                            <ActivityIndicator size="large" color={textColor} style={{ marginTop: 20 }} />
                        ) : userMoments.length > 0 ? (
                            <View style={styles.momentsGrid}>
                                {userMoments.map((moment) => (
                                    <TouchableOpacity
                                        key={moment.id}
                                        style={[
                                            styles.momentSelectThumbnail,
                                            { backgroundColor: thumbnailBg, borderColor: thumbnailBorder },
                                            selectedMomentsForCollection.includes(moment.id) && styles.selectedMomentThumbnail,
                                        ]}
                                        onPress={() => toggleMomentSelection(moment.id)}
                                    >
                                        {moment.type === 'image' ? (
                                            <Image
                                                source={getMomentThumbnailSource(moment)}
                                                style={styles.momentSelectMedia}
                                            />
                                        ) : (
                                            <Video
                                                source={getMomentThumbnailSource(moment)}
                                                style={styles.momentSelectMedia}
                                                useNativeControls={false}
                                                resizeMode="cover"
                                                isLooping
                                                shouldPlay={false}
                                            />
                                        )}
                                        {selectedMomentsForCollection.includes(moment.id) && (
                                            <View style={styles.selectedOverlay}>
                                                <Ionicons name="checkmark-circle" size={30} color="white" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={[styles.noMomentsText, { color: mutedTextColor }]}>
                                You have no moments to create a collection from. Upload some first!
                            </Text>
                        )}

                        {selectedMomentsForCollection.length > 0 && (
                            <View style={styles.selectedMomentsPreview}>
                                <Text style={[styles.sectionSubtitle, { color: textColor }]}>
                                    Selected Moments ({selectedMomentsForCollection.length})
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {selectedMomentsForCollection.map((momentId) => {
                                        const moment = userMoments.find((m) => m.id === momentId);
                                        if (!moment) return null;
                                        return (
                                            <View key={moment.id} style={[styles.selectedMomentItem, { backgroundColor: thumbnailBg }]}>
                                                {moment.type === 'image' ? (
                                                    <Image
                                                        source={getMomentThumbnailSource(moment)}
                                                        style={styles.selectedMomentItemMedia}
                                                    />
                                                ) : (
                                                    <Video
                                                        source={getMomentThumbnailSource(moment)}
                                                        style={styles.selectedMomentItemMedia}
                                                        useNativeControls={false}
                                                        resizeMode="cover"
                                                        isLooping
                                                        shouldPlay={false}
                                                    />
                                                )}
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.createButton, (isCreatingCollection || selectedMomentsForCollection.length === 0 || collectionName.trim().length < 3) && { opacity: 0.5 }]}
                            onPress={handleCreateCollection}
                            disabled={isCreatingCollection || selectedMomentsForCollection.length === 0 || collectionName.trim().length < 3}
                        >
                            {isCreatingCollection ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Collection</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            <Modal
                animationType="slide"
                transparent={true}
                visible={showImagePreviewModal}
                onRequestClose={handleCancelMomentUpload}
            >
                <View style={[styles.imagePreviewModalOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
                    <SafeAreaView style={[styles.imagePreviewModalContent, { backgroundColor: screenBgColor }]}>
                        <View style={[styles.imagePreviewModalHeader, { backgroundColor: headerBgColor }]}>
                            <TouchableOpacity onPress={handleCancelMomentUpload} style={styles.imagePreviewModalCloseButton}>
                                <Ionicons name="close" size={30} color={textColor} />
                            </TouchableOpacity>
                            <Text style={[styles.imagePreviewModalTitle, { color: textColor }]}>Review Moment</Text>
                            <View style={{ width: 30 }} />
                        </View>
                        <ScrollView contentContainerStyle={styles.imagePreviewScrollContent}>
                            <View style={styles.imagePreviewContainer}>
                                {momentType === 'image' && (adjustedImageBase64 || originalMediaUri) ? (
                                    <Image
                                        source={{ uri: adjustedImageBase64 || originalMediaUri }}
                                        style={styles.previewImage}
                                        resizeMode="contain"
                                    />
                                ) : momentType === 'video' && originalMediaUri ? (
                                    <Video
                                        ref={collectionPreviewVideoRef}
                                        source={{ uri: originalMediaUri }}
                                        style={styles.previewImage}
                                        useNativeControls
                                        resizeMode="contain"
                                        isLooping
                                        shouldPlay
                                    />
                                ) : (
                                    <Text style={{ color: mutedTextColor }}>No media selected</Text>
                                )}
                                {isProcessingLive && momentType === 'image' && (
                                    <View style={styles.processingOverlay}>
                                        <ActivityIndicator size="large" color="#5b4285" />
                                        <Text style={{ color: '#5b4285', marginTop: 10 }}>Applying adjustments...</Text>
                                    </View>
                                )}
                            </View>
                            {momentType === 'image' && (
                                <View style={styles.imageEditingTools}>
                                    <Text style={[styles.editingToolText, { color: mutedTextColor }]}>
                                        Adjustments:
                                    </Text>

                                    <View style={styles.sliderRow}>
                                        <Ionicons name="sunny-outline" size={24} color={textColor} />
                                        <Text style={[styles.sliderLabel, { color: textColor }]}>Brightness</Text>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0.1}
                                            maximumValue={3.0}
                                            step={0.05}
                                            value={brightnessValue}
                                            onValueChange={setBrightnessValue}
                                            minimumTrackTintColor="#5b4285"
                                            maximumTrackTintColor={mutedTextColor}
                                            thumbTintColor="#5b4285"
                                        />
                                        <Text style={[styles.sliderValue, { color: textColor }]}>{brightnessValue.toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.sliderRow}>
                                        <Ionicons name="contrast-outline" size={24} color={textColor} />
                                        <Text style={[styles.sliderLabel, { color: textColor }]}>Contrast</Text>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0.1}
                                            maximumValue={3.0}
                                            step={0.05}
                                            value={contrastValue}
                                            onValueChange={setContrastValue}
                                            minimumTrackTintColor="#5b4285"
                                            maximumTrackTintColor={mutedTextColor}
                                            thumbTintColor="#5b4285"
                                        />
                                        <Text style={[styles.sliderValue, { color: textColor }]}>{contrastValue.toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.sliderRow}>
                                        <Ionicons name="color-palette-outline" size={24} color={textColor} />
                                        <Text style={[styles.sliderLabel, { color: textColor }]}>Saturation</Text>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0.0}
                                            maximumValue={3.0}
                                            step={0.05}
                                            value={saturationValue}
                                            onValueChange={setSaturationValue}
                                            minimumTrackTintColor="#5b4285"
                                            maximumTrackTintColor={mutedTextColor}
                                            thumbTintColor="#5b4285"
                                        />
                                        <Text style={[styles.sliderValue, { color: textColor }]}>{saturationValue.toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.filterToggleRow}>
                                        <Text style={[styles.sliderLabel, { color: textColor }]}>Grayscale Filter</Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.toggleButton,
                                                grayscaleFilterActive ? { backgroundColor: '#5b4285' } : { backgroundColor: inactiveTabBg }
                                            ]}
                                            onPress={() => setGrayscaleFilterActive(prev => !prev)}
                                        >
                                            <Ionicons
                                                name={grayscaleFilterActive ? "checkmark-circle" : "close-circle-outline"}
                                                size={24}
                                                color={grayscaleFilterActive ? "white" : inactiveTabText}
                                            />
                                            <Text style={{ color: grayscaleFilterActive ? "white" : inactiveTabText, marginLeft: 5 }}>
                                                {grayscaleFilterActive ? "Active" : "Inactive"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                </View>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.submitPreviewButton, isUploadingMoment && { opacity: 0.5 }]}
                            onPress={handleApplyEditsAndSubmitMoment}
                            disabled={isUploadingMoment || isProcessingLive || !originalMediaUri}
                        >
                            {isUploadingMoment ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitPreviewButtonText}>Submit Moment</Text>
                            )}
                        </TouchableOpacity>
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
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.1)',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabSelectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 20,
        marginTop: 20,
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
        fontSize: 15,
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
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 10,
    },
    textInput: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 15,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 120,
    },
    characterCount: {
        textAlign: 'right',
        fontSize: 12,
        marginTop: 5,
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
        minHeight: 100,
    },
    uploadButtonText: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    momentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    momentSelectThumbnail: {
        width: (width - 40 - 20) / 3,
        aspectRatio: 9 / 16,
        marginVertical: 5,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    momentSelectMedia: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        backgroundColor: '#ccc',
    },
    selectedMomentThumbnail: {
        borderColor: '#5b4285',
    },
    selectedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(91, 66, 133, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMomentsText: {
        textAlign: 'center',
        marginTop: 20,
    },
    selectedMomentsPreview: {
        marginTop: 20,
        marginBottom: 10,
    },
    selectedMomentItem: {
        width: 80,
        height: 80 * VIDEO_ASPECT_RATIO_UPLOAD,
        borderRadius: 8,
        marginRight: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.2)',
    },
    selectedMomentItemMedia: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePreviewModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreviewModalContent: {
        flex: 1,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    imagePreviewModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.1)',
    },
    imagePreviewModalCloseButton: {
        padding: 5,
    },
    imagePreviewModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    imagePreviewScrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    imagePreviewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: Dimensions.get('window').height * 0.5,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    imageEditingTools: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    editingToolText: {
        fontSize: 15,
        fontStyle: 'italic',
        marginBottom: 15,
        fontWeight: 'bold',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    sliderLabel: {
        fontSize: 14,
        width: 80,
        marginRight: 10,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    sliderValue: {
        fontSize: 14,
        width: 40,
        textAlign: 'right',
        marginLeft: 10,
    },
    filterToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    submitPreviewButton: {
        backgroundColor: '#5b4285',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    submitPreviewButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});