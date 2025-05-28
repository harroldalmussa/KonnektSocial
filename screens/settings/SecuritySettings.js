// screens/SecuritySettings.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, useColorScheme, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SecuritySettings() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const headerTitleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const itemTextColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';
  const itemBorderColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';
  const backIconColor = colorScheme === 'dark' ? '#93c5fd' : '#1f2937';
  const containerBg = colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const headerBorderColor = colorScheme === 'dark' ? '#4a5568' : '#e0e0e0';

  const securityOptions = [
    { name: 'Change Password', icon: 'key-outline', action: 'changePassword' },
    { name: 'Two-Factor Authentication', icon: 'shield-checkmark-outline', action: 'twoFactorAuth' },
    { name: 'Login Alerts', icon: 'notifications-outline', action: 'loginAlerts' },
    { name: 'Account Privacy', icon: 'eye-outline', action: 'accountPrivacy' },
  ];

  const handleSecurityOptionPress = (action) => {
    switch (action) {
      case 'changePassword':
        Alert.alert('Change Password', 'Navigate to change password screen.');
        break;
      case 'twoFactorAuth':
        Alert.alert('Two-Factor Auth', 'Toggle or configure 2FA.');
        break;
      case 'loginAlerts':
        Alert.alert('Login Alerts', 'Enable/disable email or push notifications for new logins.');
        break;
      case 'accountPrivacy':
        Alert.alert('Account Privacy', 'Toggle between Public and Private account.');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature is under development!');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : 'transparent' }]}>
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={[styles.header, { borderBottomColor: headerBorderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={backIconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTitleColor }]}>Security Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          {securityOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.settingItem, { borderBottomColor: itemBorderColor }]}
              onPress={() => handleSecurityOptionPress(option.action)}
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
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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