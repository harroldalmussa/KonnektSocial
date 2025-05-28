// screens/main/MomentsScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; 

const { height: windowHeight } = Dimensions.get('window');

// Placeholder video data 
const mockMoments = [
  {
    id: '1',
    videoUri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', 
    user: { name: 'NatureLover', profilePic: 'https://randomuser.me/api/portraits/men/1.jpg' },
    description: 'Beautiful sunset over the mountains!',
    likes: 123,
    comments: 45,
  },
  {
    id: '2',
    videoUri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
    user: { name: 'CodingGuru', profilePic: 'https://randomuser.me/api/portraits/women/2.jpg' },
    description: 'My latest coding project in action #devlife',
    likes: 240,
    comments: 88,
  },
  {
    id: '3',
    videoUri: 'http://techslides.com/demos/sample-videos/small.mp4',
    user: { name: 'TravelBug', profilePic: 'https://randomuser.me/api/portraits/men/3.jpg' },
    description: 'Exploring ancient ruins in Rome! #travel',
    likes: 310,
    comments: 112,
  },

];

const MomentItem = ({ item, isFocused }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const colorScheme = useColorScheme();
  useFocusEffect(
    React.useCallback(() => {
      if (videoRef.current) {
        if (isFocused) {
          videoRef.current.playAsync();
          setIsPlaying(true);
        } else {
          videoRef.current.pauseAsync();
          setIsPlaying(false);
        }
      }
      return () => {
        if (videoRef.current) {
          videoRef.current.pauseAsync();
        }
      };
    }, [isFocused])
  );

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const iconColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';

  return (
    <View style={styles.momentContainer}>
      <Video
        ref={videoRef}
        source={{ uri: item.videoUri }}
        style={styles.videoPlayer}
        resizeMode="cover"
        isLooping
        shouldPlay={isFocused} 
        onPlaybackStatusUpdate={status => setIsPlaying(status.isPlaying)}
      />
      <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseOverlay}>
        {!isPlaying && (
          <Ionicons name="play" size={60} color="rgba(255,255,255,0.7)" />
        )}
      </TouchableOpacity>

      <View style={styles.gradientOverlay} /> 

      <View style={styles.contentOverlay}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.user.profilePic }} style={styles.profilePic} />
          <Text style={styles.usernameText}>@{item.user.name}</Text>
        </View>
        <Text style={styles.descriptionText}>{item.description}</Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={24} color="white" />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="white" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color="white" />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function MomentsScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const colorScheme = useColorScheme();

  const handleScroll = (event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.y / windowHeight);
    setCurrentIndex(newIndex);
  };

  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const headerTextColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>Moments</Text>
      </View>
      <FlatList
        data={mockMoments}
        renderItem={({ item, index }) => (
          <MomentItem item={item} isFocused={index === currentIndex} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  momentContainer: {
    width: '100%',
    height: windowHeight,
    backgroundColor: 'black', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playPauseOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', 
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 80 : 60, 
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
    marginRight: 10,
  },
  usernameText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  descriptionText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 20,
  },
  actionsContainer: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 90 : 70, 
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
});