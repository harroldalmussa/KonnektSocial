// screens/AppearanceSettingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, useColorScheme, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const wallpaperGradients = {
  purple: ['#5b4285', '#7f58a7'],
  darkPurple: ['#3a0050', '#1a0028'], 
  blue: ['#3B82F6', '#60a5fa'],
  ivoryCream: ['#f5f5dc', '#fffafa'], 
  green: ['#10b981', '#34d399'],
};

export default function AppearanceSettingsScreen() {
  const navigation = useNavigation();
  const systemColorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [selectedWallpaper, setSelectedWallpaper] = useState('purple');

  const headerTitleColor = systemColorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const sectionTitleColor = systemColorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const itemTextColor = systemColorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const itemBorderColor = systemColorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const backIconColor = systemColorScheme === 'dark' ? '#93c5fd' : '#1f2937';
  const containerBg = systemColorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const optionGroupBg = systemColorScheme === 'dark' ? 'rgba(74, 85, 104, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const activeOptionColor = systemColorScheme === 'dark' ? '#93c5fd' : '#3b82f6'; 

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) setSelectedTheme(storedTheme);

        const storedWallpaper = await AsyncStorage.getItem('app_wallpaper');
        if (storedWallpaper) setSelectedWallpaper(storedWallpaper);
      } catch (error) {
        console.error('Failed to load appearance preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const handleThemeChange = async (theme) => {
    setSelectedTheme(theme);
    try {
      await AsyncStorage.setItem('app_theme', theme);
      Alert.alert("Theme Updated", `App theme set to ${theme}. Restart required for full effect.`);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const handleWallpaperChange = async (wallpaperKey) => {
    setSelectedWallpaper(wallpaperKey);
    try {
      await AsyncStorage.setItem('app_wallpaper', wallpaperKey);
      Alert.alert("Wallpaper Updated", "Default chat wallpaper color updated!");
    } catch (error) {
      console.error('Failed to save wallpaper:', error);
    }
  };

  const chatOptions = [
    { name: 'Chat Backup', icon: 'cloud-upload-outline', screen: 'ChatBackup' },
    { name: 'Transfer Chats', icon: 'sync-outline', screen: 'TransferChats' },
    { name: 'Chat History', icon: 'time-outline', screen: 'ChatHistory' },
  ];

  const handleOptionPress = (screenName) => {
    if (screenName) {
      navigation.navigate(screenName);
    } else {
      Alert.alert('Coming Soon', `This feature is under development!`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: systemColorScheme === 'dark' ? '#1a202c' : 'transparent' }]}>
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={backIconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTitleColor }]}>Appearance</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Theme</Text>
          <View style={[styles.optionGroup, { borderBottomColor: itemBorderColor, backgroundColor: optionGroupBg }]}>
            {['system', 'light', 'dark'].map((theme) => (
              <TouchableOpacity
                key={theme}
                style={styles.optionItem}
                onPress={() => handleThemeChange(theme)}
              >
                <Text style={[styles.itemText, { color: itemTextColor }]}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)} Default
                </Text>
                {selectedTheme === theme && (
                  <Ionicons name="checkmark-circle" size={20} color={activeOptionColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor, marginTop: 20 }]}>Default Wallpaper Color</Text>
          <View style={[styles.optionGroup, { borderBottomColor: itemBorderColor, backgroundColor: optionGroupBg }]}>
            {Object.keys(wallpaperGradients).map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.optionItem}
                onPress={() => handleWallpaperChange(key)}
              >
                <View style={[styles.colorPreview, { backgroundColor: wallpaperGradients[key][0] }]} />
                <Text style={[styles.itemText, { color: itemTextColor }]}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Gradient
                </Text>
                {selectedWallpaper === key && (
                  <Ionicons name="checkmark-circle" size={20} color={activeOptionColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor, marginTop: 20 }]}>Chat Settings</Text>
          <View style={[styles.optionGroup, { backgroundColor: optionGroupBg }]}>
            {chatOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, index === chatOptions.length -1 ? {} : { borderBottomColor: itemBorderColor }]}
                onPress={() => handleOptionPress(option.screen)}
              >
                <Ionicons name={option.icon} size={24} color={itemTextColor} style={styles.itemIcon} />
                <Text style={[styles.itemText, { color: itemTextColor }]}>{option.name}</Text>
                <Ionicons name="chevron-forward-outline" size={20} color={itemTextColor} />
              </TouchableOpacity>
            ))}
          </View>
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
    marginTop: Platform.OS === 'android' ? 30 : 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  optionGroup: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  itemIcon: {
    marginRight: 15,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
});