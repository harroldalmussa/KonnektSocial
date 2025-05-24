// screens/main/NewChatScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174'; // !!! IMPORTANT: REPLACE WITH YOUR ACTUAL LOCAL IP ADDRESS !!!

export default function NewChatScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [myContacts, setMyContacts] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const headerTitleColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const inputBgColor = colorScheme === 'dark' ? '#4a5568' : 'white';
  const inputBorderColor = colorScheme === 'dark' ? '#2d3748' : '#e0e0e0';
  const dividerColor = colorScheme === 'dark' ? '#4a5568' : '#d1d5db';

  // Function to fetch my contacts
  const fetchMyContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        // Handle case where token is missing, e.g., redirect to Auth
        console.warn('Access token missing. Cannot fetch contacts.');
        setMyContacts([]);
        return;
      }
      const response = await fetch(`http://192.168.1.174:8081/contacts/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMyContacts(Array.isArray(data.contacts) ? data.contacts : []);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch contacts.');
        setMyContacts([]);
      }
    } catch (error) {
      console.error('Fetch contacts error:', error);
      Alert.alert('Error', 'Network error fetching contacts.');
      setMyContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [YOUR_LOCAL_IP_ADDRESS]); // Added dependency

  // Function to search users
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('Access token missing. Cannot search users.');
        setSearchResults([]);
        return;
      }
      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:8081/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const users = Array.isArray(data.users) ? data.users : [];
        const storedUserData = await AsyncStorage.getItem('user_data');
        // Ensure user_data is parsed safely
        let currentUserId = null;
        if (storedUserData) {
          try {
            currentUserId = JSON.parse(storedUserData).userId;
          } catch (e) {
            console.error('Error parsing user_data from AsyncStorage:', e);
          }
        }

        const filteredResults = users.filter(
          user => !myContacts.some(contact => contact.user_id === user.id) && user.id !== currentUserId
        );
        setSearchResults(filteredResults);
      } else {
        Alert.alert('Error', data.error || 'Failed to search users.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Network error searching users.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchQuery, myContacts, YOUR_LOCAL_IP_ADDRESS]); // Added dependencies

  // Function to add a contact
  const handleAddContact = async (userToAddId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('Access token missing. Cannot add contact.');
        return;
      }
      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:8081/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contact_user_id: userToAddId }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Contact added!');
        fetchMyContacts(); // Refresh contact list
        setSearchQuery(''); // Clear search query
        setSearchResults([]); // Clear search results
      } else {
        Alert.alert('Error', data.error || 'Failed to add contact.');
      }
    } catch (error) {
      console.error('Add contact error:', error);
      Alert.alert('Error', 'Network error adding contact.');
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchMyContacts();
    }
  }, [isFocused, fetchMyContacts]);


  const ContactListItem = ({ contact, isSearchItem }) => (
    <TouchableOpacity
      style={styles.contactListItem}
      onPress={() => navigation.navigate('ChatWindow', { user: contact.first_name, img: contact.profile_picture_url || 'https://randomuser.me/api/portraits/men/99.jpg' })}
    >
      <Image source={{ uri: contact.profile_picture_url || 'https://randomuser.me/api/portraits/men/99.jpg' }} style={styles.contactAvatar} />
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: textColor }]}>{contact.first_name}</Text>
        <Text style={[styles.contactEmail, { color: mutedTextColor }]}>{contact.email}</Text>
      </View>
      {isSearchItem && (
        <TouchableOpacity onPress={() => handleAddContact(contact.id)} style={styles.addContactButton}>
          <Ionicons name="person-add" size={20} color="white" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : 'transparent' }]}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={headerTitleColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTitleColor }]}>New Message</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBarContainer, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}>
          <Ionicons name="search" size={20} color={mutedTextColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search users by email or name..."
            placeholderTextColor={mutedTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContainer}>

          {/* Search Results */}
          {loadingSearch ? (
            <Text style={[styles.loadingText, { color: mutedTextColor }]}>Searching...</Text>
          ) : (
            // Conditional rendering for search results
            searchResults.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Search Results</Text>
                {searchResults.map((user) => (
                  <ContactListItem key={user.id} contact={user} isSearchItem={true} />
                ))}
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
              </View>
            ) : searchQuery.length >= 2 ? ( // Only show "No users found" if search query is at least 2 chars
              <Text style={[styles.noResultsText, { color: mutedTextColor }]}>No users found.</Text>
            ) : null
          )}

          {/* Add Contact Manually Option */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>New Contact</Text>
            <TouchableOpacity
              style={styles.addContactRow}
              onPress={() => navigation.navigate('AddContact')}
            >
              <View style={styles.addContactIconCircle}>
                <Ionicons name="person-add-outline" size={24} color="white" />
              </View>
              <Text style={[styles.addContactText, { color: textColor }]}>Add New Contact</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          </View>

          {/* My Contacts List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>My Contacts</Text>
            {loadingContacts ? (
              <Text style={[styles.loadingText, { color: mutedTextColor }]}>Loading contacts...</Text>
            ) : myContacts.length > 0 ? (
              myContacts.map((contact) => (
                <ContactListItem key={contact.contact_id} contact={contact} isSearchItem={false} />
              ))
            ) : (
              <Text style={[styles.noResultsText, { color: mutedTextColor }]}>No contacts yet. Add someone!</Text>
            )}
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
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentScrollContainer: {
    paddingBottom: 100, // Space for the tab bar
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 15,
    marginHorizontal: 0,
  },
  contactListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactEmail: {
    fontSize: 13,
  },
  addContactButton: {
    backgroundColor: '#5b4285',
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addContactIconCircle: {
    backgroundColor: '#22c55e',
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addContactText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
    fontStyle: 'italic',
  }
});