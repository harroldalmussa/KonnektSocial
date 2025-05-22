// screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, useColorScheme, Platform } from 'react-native'; // <--- Add Platform here
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  // Dynamic colors for dark/light mode
  const headerTitleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const itemTextColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const itemBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const backIconColor = colorScheme === 'dark' ? '#93c5fd' : '#1f2937';

  const settingsOptions = [
    { name: 'Account', icon: 'person-outline', screen: 'AccountSettings' },
    { name: 'Security', icon: 'lock-closed-outline', screen: 'SecuritySettings' },
    { name: 'Appearance', icon: 'color-palette-outline', screen: 'AppearanceSettings' },
    { name: 'Notifications', icon: 'notifications-outline', screen: 'NotificationSettings' },
    { name: 'Storage and Data', icon: 'server-outline', screen: 'StorageDataSettings' },
    { name: 'App Language', icon: 'language-outline', screen: 'LanguageSettings' },
    { name: 'Help Center', icon: 'help-circle-outline', screen: 'HelpCenter' },
    { name: 'Refer a Friend', icon: 'gift-outline', screen: 'ReferFriend' },
    { name: 'Privacy Policy', icon: 'shield-checkmark-outline', screen: 'PrivacyPolicy' },
  ];

  const handleOptionPress = (screenName) => {
    if (screenName) {
      navigation.navigate(screenName);
    } else {
      Alert.alert('Coming Soon', `This feature is under development!`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={backIconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTitleColor }]}>Settings</Text>
          <View style={{ width: 24 }} /> {/* Placeholder for alignment */}
        </View>

        <ScrollView style={styles.scrollView}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.settingItem, { borderBottomColor: itemBorderColor }]}
              onPress={() => handleOptionPress(option.screen)}
            >
              <Ionicons name={option.icon} size={24} color={itemTextColor} style={styles.itemIcon} />
              <Text style={[styles.itemText, { color: itemTextColor }]}>{option.name}</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={itemTextColor} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure gradient from App.js shows through
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent background for content
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: Platform.OS === 'android' ? 30 : 0, // Space from status bar/notch
    overflow: 'hidden', // Crucial for borderRadius
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Light border
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  itemIcon: {
    marginRight: 15,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
});