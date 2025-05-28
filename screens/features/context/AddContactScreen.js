// screens/AddContactScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YOUR_LOCAL_IP_ADDRESS = '****'; 

export default function AddContactScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState(''); 
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const headerTitleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const inputBgColor = colorScheme === 'dark' ? '#4a5568' : 'white';
  const inputBorderColor = colorScheme === 'dark' ? '#2d3748' : '#e0e0e0';
  const labelColor = colorScheme === 'dark' ? '#e2e8f0' : '#374151';

  const handleAddContact = async () => {
    setEmailError('');
    if (!contactEmail.trim()) {
      setEmailError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setEmailError('Invalid email format.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }
      const searchResponse = await fetch(`http://192.168.1.174:8081/users/search?q=${encodeURIComponent(contactEmail.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const searchData = await searchResponse.json();
      if (!searchResponse.ok || !Array.isArray(searchData.users) || searchData.users.length === 0) {
        Alert.alert('Error', searchData.error || 'User not found. Please check the email.');
        setLoading(false);
        return;
      }

      const userToAdd = searchData.users[0];

      const addContactResponse = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:8081/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contact_user_id: userToAdd.id }),
      });
      const addContactData = await addContactResponse.json();

      if (addContactResponse.ok) {
        Alert.alert('Success', addContactData.message || 'Contact added!');
        navigation.goBack(); 
      } else {
        Alert.alert('Error', addContactData.error || 'Failed to add contact.');
      }
    } catch (error) {
      console.error('Add contact error:', error);
      Alert.alert('Error', 'Network error adding contact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : 'transparent' }]}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={headerTitleColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTitleColor }]}>Add New Contact</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formScroll} contentContainerStyle={styles.formScrollContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Contact Email:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBgColor, borderColor: inputBorderColor, color: textColor }]}
              placeholder="Enter contact's email"
              placeholderTextColor={mutedTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
              value={contactEmail}
              onChangeText={setContactEmail}
            />
            {emailError ? <Text style={[styles.errorText, { color: '#ef4444' }]}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Contact Name (Optional):</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBgColor, borderColor: inputBorderColor, color: textColor }]}
              placeholder="Enter contact's name (for display)"
              placeholderTextColor={mutedTextColor}
              value={contactName}
              onChangeText={setContactName}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: loading ? '#6b7280' : '#22c55e' }]} 
            onPress={handleAddContact}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>{loading ? 'Adding...' : 'Add Contact'}</Text>
          </TouchableOpacity>
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
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formScrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  errorText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  addButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});