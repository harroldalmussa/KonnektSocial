// server.js (Backend) - FULLY UPDATED AND CLEANED WITH WEBSOCKETS (Socket.IO)
const momentsTable = 'moments';
require('dotenv').config();

const express = require('express');
const http = require('http'); // Import http module for WebSocket server
const { Server } = require('socket.io'); // Import Server from socket.io
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceId = process.env.TWILIO_VERIFY_SERVICE_SID;
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const secretKey = process.env.JWT_SECRET_KEY;
console.log('Server starting. JWT_SECRET_KEY (loaded):', secretKey ? '****** (defined)' : 'UNDEFINED');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app); // Attach Express app to HTTP server
const port = 3000;

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // IMPORTANT: Adjust this to your React Native app's actual origin in production (e.g., 'exp://your-app-id-here')
    methods: ["GET", "POST"]
  }
});

// IMPORTANT: Increase payload limits for JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // Enable CORS for all routes (important for development)

// Database Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const usersTable = 'users';
const postsTable = 'posts';
const chatsTable = 'chats'; // Assuming a 'chats' table for chat metadata
const messagesTable = 'messages'; // Assuming a 'messages' table for actual chat messages

// --- Utility Functions ---
function generateVerificationCode(length) {
    return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
}

// Function to extract user ID from JWT token (for both REST and WebSocket contexts)
// In a real app, this would typically be a more robust JWT verification function
const getUserIdFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded.userId;
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        return null;
    }
};

// --- WebSocket Logic ---
io.on('connection', async (socket) => {
  console.log('A user connected via WebSocket:', socket.id);

  let authToken = socket.handshake.auth.token; // Get token from handshake
  let userId = null;

  if (authToken) {
      userId = getUserIdFromToken(authToken);
      if (userId) {
          socket.userId = userId; // Store userId on the socket for later use
          console.log(`WebSocket user authenticated: ${userId} (${socket.id})`);

          // Join all chats the user is already a participant of
          try {
            const client = await pool.connect();
            try {
              const userChats = await client.query(
                `SELECT chat_id FROM chat_participants WHERE user_id = $1`,
                [userId]
              );
              userChats.rows.forEach(row => {
                socket.join(row.chat_id);
                console.log(`User ${userId} joined chat room: ${row.chat_id}`);
              });
            } finally {
              client.release();
            }
          } catch (error) {
            console.error(`Error fetching user's chats for WebSocket:`, error);
          }
      } else {
          console.warn('WebSocket connection attempt with invalid token.');
          socket.disconnect(true); // Disconnect if token is invalid
      }
  } else {
      console.warn('WebSocket connection attempt without token.');
      socket.disconnect(true); // Disconnect if no token provided
  }


  socket.on('join_chat', (chatId) => {
    // This event can be used by the client to explicitly join a chat room
    // after an initial setup or when navigating to a new chat.
    // Ensure the user is authorized to join this chat!
    if (socket.userId) { // Only allow authenticated users to join rooms
        socket.join(chatId);
        console.log(`User ${socket.userId} (${socket.id}) joined chat room: ${chatId}`);
    } else {
        console.warn(`Unauthorized attempt to join chat room ${chatId} by socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from WebSocket:', socket.id);
  });
});


// --- REST API Endpoints ---

// Authentication Middleware (updated to use the getUserIdFromToken function)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Authenticate Token: Authorization header:', authHeader); // Debug log
    console.log('Authenticate Token: Extracted token:', token ? 'Token present' : 'No token'); // Debug log

    if (!token) {
        console.log('Authenticate Token: No token provided, sending 401.'); // Debug log
        return res.sendStatus(401);
    }

    const userId = getUserIdFromToken(token);
    console.log('Authenticate Token: Decoded userId:', userId); // Debug log

    if (!userId) {
        console.log('Authenticate Token: Invalid token, sending 403.'); // Debug log
        return res.sendStatus(403); // Invalid token
    }

    req.user = { userId: userId }; // Attach userId to req.user
    console.log('Authenticate Token: Authentication successful for userId:', req.user.userId); // Debug log
    next();
};

// User Registration
app.post('/users/', [
    body('email').isEmail().withMessage('Invalid email'),
    body('first_name').notEmpty().withMessage('First name required'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, first_name, password } = req.body;
    if (!email || !first_name || !password) {
        return res.status(400).json({ detail: 'Missing fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO ${usersTable} (email, first_name, password) VALUES ($1, $2, $3) RETURNING *`,
                [email, first_name, hashedPassword]
            );
            res.status(201).json({ message: 'User registered', user: result.rows[0] });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/users/login', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ detail: 'Missing fields' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, email, first_name, bio, profile_picture_url, password FROM ${usersTable} WHERE email = $1`,
                [email]
            );
            const user = result.rows[0];

            if (user && await bcrypt.compare(password, user.password)) {
                console.log('Login successful for user:', user.email);
                const token = jwt.sign({ userId: user.id, email: user.email }, secretKey, { expiresIn: '7d' });
                console.log('Generated token:', token ? 'DEFINED' : 'UNDEFINED (JWT signing failed)');

                const userDataForFrontend = {
                    uid: user.id, // Ensure UID is returned for the frontend's use
                    name: user.first_name,
                    email: user.email,
                    bio: user.bio || 'No bio yet.',
                    profile_picture_url: user.profile_picture_url || 'https://via.placeholder.com/150'
                };

                res.status(200).json({
                    message: 'Login success',
                    access_token: token,
                    user: userDataForFrontend
                });
            } else {
                res.status(401).json({ detail: 'Invalid credentials' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User Logout
app.post('/users/logout', (req, res) => {
    console.log('Logout request');
    res.status(200).json({ message: 'Logout success' });
});

// Update User Profile
app.put('/users/profile', authenticateToken, async (req, res) => {
    const { name, email, bio, profilePicture } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' });
    }

    try {
        const client = await pool.connect();
        try {
            const query = `
                UPDATE ${usersTable}
                SET first_name = $1, email = $2, bio = $3, profile_picture_url = $4
                WHERE id = $5
                RETURNING id, email, first_name, bio, profile_picture_url;
            `;
            const values = [
                name,
                email,
                bio || null,
                profilePicture || 'https://via.placeholder.com/150', // Default image URL
                req.user.userId
            ];

            const result = await client.query(query, values);

            if (result.rows.length > 0) {
                const updatedUser = result.rows[0];
                const userDataForFrontend = {
                    uid: updatedUser.id,
                    name: updatedUser.first_name,
                    email: updatedUser.email,
                    bio: updatedUser.bio || 'No bio yet.',
                    profile_picture_url: updatedUser.profile_picture_url || 'https://via.placeholder.com/150'
                };
                res.json({ success: true, message: 'Profile updated successfully', user: userDataForFrontend });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Profile Update Error:', error);
        if (error.code === '23505') {
             return res.status(409).json({ error: 'Email already in use.' });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// NEW: User/Contact Management Endpoints

// Search users to add as contacts
app.get('/users/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    const userId = req.user.userId;

    console.log('Search Users Endpoint: Query (q):', q); // Debug log
    console.log('Search Users Endpoint: Current userId:', userId); // Debug log

    if (!q || q.length < 2) {
        console.log('Search Users Endpoint: Invalid query length, sending 400.'); // Debug log
        return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    try {
        const client = await pool.connect();
        try {
            const sqlQuery = `
                SELECT id, first_name, email, profile_picture_url
                FROM ${usersTable}
                WHERE (email ILIKE $1 OR first_name ILIKE $1) AND id != $2
            `;
            const queryParams = [`%${q}%`, userId];
            console.log('Search Users Endpoint: Executing SQL:', sqlQuery, 'with params:', queryParams); // Debug log

            const result = await client.query(sqlQuery, queryParams);
            console.log('Search Users Endpoint: Search results count:', result.rows.length); // Debug log
            res.json({ success: true, users: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Search Users Error:', error); // Debug log
        res.status(500).json({ error: 'Failed to search users.' });
    }
});

// Add a new contact
app.post('/contacts', authenticateToken, async (req, res) => {
    const { contact_user_id } = req.body;
    const userId = req.user.userId;

    console.log('Add Contact Endpoint: userId:', userId, 'contact_user_id:', contact_user_id); // Debug log

    if (!contact_user_id) {
        return res.status(400).json({ error: 'Missing contact_user_id.' });
    }
    if (userId === contact_user_id) {
        return res.status(400).json({ error: 'Cannot add yourself as a contact.' });
    }

    try {
        const client = await pool.connect();
        try {
            const existingContact = await client.query(
                `SELECT id FROM contacts WHERE user_id = $1 AND contact_user_id = $2`,
                [userId, contact_user_id]
            );
            if (existingContact.rows.length > 0) {
                console.log('Add Contact Endpoint: Contact already exists, sending 409.'); // Debug log
                return res.status(409).json({ error: 'Contact already exists.' });
            }

            const result = await client.query(
                `INSERT INTO contacts (user_id, contact_user_id) VALUES ($1, $2) RETURNING id, user_id, contact_user_id`,
                [userId, contact_user_id]
            );

            const contactDetails = await client.query(
                `SELECT id, first_name, email, profile_picture_url FROM ${usersTable} WHERE id = $1`,
                [contact_user_id]
            );

            console.log('Add Contact Endpoint: Successfully added contact:', result.rows[0].id); // Debug log
            res.status(201).json({
                success: true,
                message: 'Contact added successfully',
                contact: {
                    contact_id: result.rows[0].id,
                    user_id: contactDetails.rows[0].id,
                    first_name: contactDetails.rows[0].first_name,
                    email: contactDetails.rows[0].email,
                    profile_picture_url: contactDetails.rows[0].profile_picture_url
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Add Contact Error:', error); // Debug log
        res.status(500).json({ error: 'Failed to add contact.' });
    }
});

// Get all contacts for the authenticated user
app.get('/contacts/my', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    console.log('Get My Contacts Endpoint: userId:', userId); // Debug log
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT c.id as contact_id, u.id as user_id, u.first_name, u.email, u.profile_picture_url
                 FROM contacts c
                 JOIN ${usersTable} u ON c.contact_user_id = u.id
                 WHERE c.user_id = $1 ORDER BY u.first_name ASC`,
                [userId]
            );
            console.log('Get My Contacts Endpoint: Found contacts count:', result.rows.length); // Debug log
            res.json({ success: true, contacts: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Contacts Error:', error); // Debug log
        res.status(500).json({ error: 'Failed to retrieve contacts.' });
    }
});

// Delete a specific contact
app.delete('/contacts/:id', authenticateToken, async (req, res) => {
    const contactId = req.params.id;
    const userId = req.user.userId;

    console.log('Delete Contact Endpoint: userId:', userId, 'contactId:', contactId); // Debug log

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
                [contactId, userId]
            );
            if (result.rows.length > 0) {
                console.log('Delete Contact Endpoint: Contact deleted:', result.rows[0].id); // Debug log
                res.json({ success: true, message: 'Contact deleted successfully', contactId: result.rows[0].id });
            } else {
                console.log('Delete Contact Endpoint: Contact not found or unauthorized, sending 404.'); // Debug log
                res.status(404).json({ error: 'Contact not found or unauthorized.' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Contact Error:', error); // Debug log
        res.status(500).json({ error: 'Failed to delete contact.' });
    }
});

// --- NEW CHAT/MESSAGING ENDPOINTS ---

// Helper function to create a new chat if one doesn't exist between two users
async function findOrCreateChat(pool, user1Id, user2Id) {
    const client = await pool.connect();
    try {
        console.log('findOrCreateChat: Attempting to find/create chat between', user1Id, 'and', user2Id); // Debug log
        // Check if a chat already exists between these two users
        // This query assumes a 'chat_participants' table linking users to chats
        const existingChatResult = await client.query(
            `SELECT cp1.chat_id
             FROM chat_participants cp1
             JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
             WHERE cp1.user_id = $1 AND cp2.user_id = $2
             GROUP BY cp1.chat_id
             HAVING COUNT(DISTINCT cp1.user_id) = 1 AND COUNT(DISTINCT cp2.user_id) = 1;`, // Ensures only two participants in the chat
            [user1Id, user2Id]
        );

        if (existingChatResult.rows.length > 0) {
            console.log('findOrCreateChat: Existing chat found:', existingChatResult.rows[0].chat_id); // Debug log
            return existingChatResult.rows[0].chat_id; // Return existing chat ID
        }

        // If no chat exists, create a new one
        console.log('findOrCreateChat: No existing chat found, creating a new one.'); // Debug log
        await client.query('BEGIN');
        const newChatResult = await client.query(
            `INSERT INTO ${chatsTable} DEFAULT VALUES RETURNING chat_id`
        );
        const newChatId = newChatResult.rows[0].chat_id;
        console.log('findOrCreateChat: New chat created with ID:', newChatId); // Debug log

        // Add participants to the new chat
        await client.query(
            `INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)`,
            [newChatId, user1Id, user2Id]
        );
        await client.query('COMMIT');
        console.log('findOrCreateChat: Participants added and transaction committed.'); // Debug log
        return newChatId;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('findOrCreateChat Error:', error); // Debug log
        throw error;
    } finally {
        client.release();
    }
}

// Endpoint to create a new chat or open an existing one (when user clicks on a contact)
app.post('/chats/create-or-get', authenticateToken, async (req, res) => {
    const currentUserId = req.user.userId;
    const { targetUserId } = req.body;

    console.log('Create or Get Chat Endpoint: currentUserId:', currentUserId, 'targetUserId:', targetUserId); // Debug log

    if (!targetUserId) {
        return res.status(400).json({ detail: 'Target user ID is required.' });
    }
    if (currentUserId === targetUserId) {
        return res.status(400).json({ detail: 'Cannot start a chat with yourself.' });
    }

    try {
        const chatId = await findOrCreateChat(pool, currentUserId, targetUserId);
        res.status(200).json({ success: true, message: 'Chat retrieved or created successfully', chatId: chatId });
    } catch (error) {
        console.error('Error in create-or-get chat:', error); // Debug log
        res.status(500).json({ detail: 'Failed to create or retrieve chat.' });
    }
});


// Get all chats for the authenticated user
app.get('/chats/my-chats', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    console.log('Get My Chats Endpoint: userId:', userId); // Debug log
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT
                    c.chat_id,
                    (SELECT msg.text FROM ${messagesTable} msg WHERE msg.chat_id = c.chat_id ORDER BY msg.timestamp DESC LIMIT 1) as last_message_text,
                    (SELECT msg.timestamp FROM ${messagesTable} msg WHERE msg.chat_id = c.chat_id ORDER BY msg.timestamp DESC LIMIT 1) as last_message_timestamp,
                    json_agg(json_build_object(
                        'id', u.id,
                        'name', u.first_name,
                        'email', u.email,
                        'profile_img_url', u.profile_picture_url
                    )) as participants
                FROM ${chatsTable} c
                JOIN chat_participants cp ON c.chat_id = cp.chat_id
                JOIN chat_participants cp_other ON c.chat_id = cp_other.chat_id AND cp_other.user_id != $1
                JOIN ${usersTable} u ON cp_other.user_id = u.id
                WHERE cp.user_id = $1
                GROUP BY c.chat_id
                ORDER BY last_message_timestamp DESC NULLS LAST;`, // Show chats with no messages last
                [userId]
            );
            console.log('Get My Chats Endpoint: Fetched chats count:', result.rows.length); // Debug log
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching chats:', error); // Debug log
        res.status(500).json({ detail: 'Failed to load chats.' });
    }
});

// Get messages for a specific chat
app.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.userId;

    console.log('Get Chat Messages Endpoint: chatId:', chatId, 'userId:', userId); // Debug log

    try {
        const client = await pool.connect();
        try {
            // Verify if the current user is a participant of this chat
            const participantCheck = await client.query(
                `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
                [chatId, userId]
            );

            if (participantCheck.rows.length === 0) {
                console.log('Get Chat Messages Endpoint: Not authorized, sending 403.'); // Debug log
                return res.status(403).json({ detail: 'Not authorized to view this chat.' });
            }

            const result = await client.query(
                `SELECT id, chat_id, sender_id, text, timestamp
                 FROM ${messagesTable}
                 WHERE chat_id = $1 ORDER BY timestamp ASC`,
                [chatId]
            );
            console.log('Get Chat Messages Endpoint: Fetched messages count:', result.rows.length); // Debug log
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching messages:', error); // Debug log
        res.status(500).json({ detail: 'Failed to load messages.' });
    }
});

// Send a message to a chat (via REST)
app.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const { text } = req.body;
    const senderId = req.user.userId;

    console.log('Send Message Endpoint: chatId:', chatId, 'senderId:', senderId, 'text:', text); // Debug log

    if (!text || text.trim() === '') {
      return res.status(400).json({ detail: 'Message text cannot be empty.' });
    }

    let client; // Declare client outside try-block for finally access
    try {
        client = await pool.connect(); // Assign client here
        // Verify if the current user is a participant of this chat
        const participantCheck = await client.query(
            `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
            [chatId, senderId]
        );

        if (participantCheck.rows.length === 0) {
            console.log('Send Message Endpoint: Not authorized, sending 403.'); // Debug log
            return res.status(403).json({ detail: 'Not authorized to send messages to this chat.' });
        }

        // Save message to database
        const result = await client.query(
            `INSERT INTO ${messagesTable} (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *`,
            [chatId, senderId, text.trim()]
        );
        const newMessage = result.rows[0];

        // Update last message in chats table (optional, for sorting in chat list)
        await client.query(
            `UPDATE ${chatsTable} SET last_message_timestamp = $1 WHERE chat_id = $2`,
            [newMessage.timestamp, chatId]
        );

        // Emit the new message via WebSocket to all clients in the chat room
        io.to(chatId).emit('receiveMessage', {
            id: newMessage.id,
            chat_id: newMessage.chat_id,
            sender_id: newMessage.sender_id,
            text: newMessage.text,
            timestamp: newMessage.timestamp
        });
        console.log(`Message sent and broadcasted to chat ${chatId}:`, newMessage.id); // Debug log

        res.status(201).json({ message: 'Message sent and broadcasted', data: newMessage });

    } catch (error) {
        console.error('Error sending message:', error); // Debug log
        res.status(500).json({ detail: 'Failed to send message.' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// Delete a specific chat
app.delete('/chats/:chatId', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.userId;

    console.log('Delete Chat Endpoint: chatId:', chatId, 'userId:', userId); // Debug log

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Start transaction

            // Check if user is a participant in this chat
            const participantCheck = await client.query(
                `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
                [chatId, userId]
            );

            if (participantCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                console.log('Delete Chat Endpoint: Not authorized, sending 403.'); // Debug log
                return res.status(403).json({ detail: 'Not authorized to delete this chat.' });
            }

            // Delete messages in the chat
            await client.query(`DELETE FROM ${messagesTable} WHERE chat_id = $1`, [chatId]);
            // Delete participants from the chat
            await client.query(`DELETE FROM chat_participants WHERE chat_id = $1`, [chatId]);
            // Finally, delete the chat itself
            const chatDeleteResult = await client.query(`DELETE FROM ${chatsTable} WHERE chat_id = $1 RETURNING chat_id`, [chatId]);

            await client.query('COMMIT'); // Commit transaction

            if (chatDeleteResult.rows.length > 0) {
                io.socketsLeave(chatId); // Makes all sockets leave the room for this chat
                console.log('Delete Chat Endpoint: Chat deleted successfully:', chatDeleteResult.rows[0].chat_id); // Debug log
                res.json({ success: true, message: 'Chat deleted successfully.' });
            } else {
                console.log('Delete Chat Endpoint: Chat not found, sending 404.'); // Debug log
                res.status(404).json({ detail: 'Chat not found.' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting chat:', error); // Debug log
        res.status(500).json({ detail: 'Failed to delete chat.' });
    }
});


// NEW: Post Management Endpoints

// Create a new post
app.post('/posts', authenticateToken, async (req, res) => {
    const { content, image, feeling } = req.body;

    if (!content || content.length < 10 || content.length > 500) {
        return res.status(400).json({ error: 'Post content must be between 10 and 500 characters.' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO ${postsTable} (user_id, content, image_url, feeling) VALUES ($1, $2, $3, $4) RETURNING *`,
                [req.user.userId, content, image, feeling]
            );
            res.status(201).json({ success: true, message: 'Post created successfully', post: result.rows[0] });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get all posts for the authenticated user
app.get('/posts/my', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, content, image_url as image, feeling, timestamp FROM ${postsTable} WHERE user_id = $1 ORDER BY timestamp DESC`,
                [req.user.userId]
            );
            res.json({ success: true, posts: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Posts Error:', error);
        res.status(500).json({ error: 'Failed to retrieve posts' });
    }
});

// Update a specific post
app.put('/posts/:id', authenticateToken, async (req, res) => {
    const postId = req.params.id;
    const { content, image, feeling } = req.body;

    if (!content || content.length < 10 || content.length > 500) {
        return res.status(400).json({ error: 'Post content must be between 10 and 500 characters.' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE ${postsTable} SET content = $1, image_url = $2, feeling = $3 WHERE id = $4 AND user_id = $5 RETURNING *`,
                [content, image, feeling, postId, req.user.userId]
            );
            if (result.rows.length > 0) {
                res.json({ success: true, message: 'Post updated successfully', post: result.rows[0] });
            } else {
                res.status(404).json({ error: 'Post not found or unauthorized' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Post Error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete a specific post
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    const postId = req.params.id;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM ${postsTable} WHERE id = $1 AND user_id = $2 RETURNING id`,
                [postId, req.user.userId]
            );
            if (result.rows.length > 0) {
                res.json({ success: true, message: 'Post deleted successfully', postId: result.rows[0].id });
            } else {
                res.status(404).json({ error: 'Post not found or unauthorized' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});


// Twilio Verify - Send Code
app.post('/verify/send-code', authenticateToken, async (req, res) => {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const to = countryCode + phoneNumber;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE ${usersTable} SET phone_number = $1, country_code = $2 WHERE id = $3`, // Changed to update by ID
            [phoneNumber, countryCode, req.user.userId] // Use req.user.userId
        );

        const verification = await twilioClient.verify.v2.services(verifyServiceId)
            .verifications
            .create({ to: to, channel: 'sms' });

        await client.query('COMMIT');

        console.log(`Verification started: ${verification.sid}`);
        res.json({ success: true, message: 'Code sent', verificationSid: verification.sid });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Twilio/DB Error:', error);
        res.status(500).json({ error: 'Failed to send code' });
    } finally {
        client.release();
    }
});

// Twilio Verify - Check Code
app.post('/verify/check-code', authenticateToken, async (req, res) => {
    const { phoneNumber, countryCode, code } = req.body;

    if (!phoneNumber || !countryCode || !code) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const to = countryCode + phoneNumber;

    try {
        const verification_check = await twilioClient.verify.v2.services(verifyServiceId)
            .verificationChecks
            .create({ to: to, code: code });

        console.log(`Verification status: ${verification_check.status}`);
        if (verification_check.status === 'approved') {
            const client = await pool.connect();
            try {
                await client.query(
                    `UPDATE ${usersTable} SET phone_verified = TRUE WHERE id = $1`, // Changed to update by ID
                    [req.user.userId] // Use req.user.userId
                );
                res.json({ success: true, message: 'Phone verified' });
            } finally {
                client.release();
            }
        } else {
            res.status(400).json({ error: 'Invalid code' });
        }
    } catch (error) {
        console.error('Twilio/DB Error:', error);
        res.status(500).json({ error: 'Failed to verify' });
    }
});

// Upload a new moment (image or video as Base64)
app.post('/moments', authenticateToken, async (req, res) => {
    const { src: imageData, type: fileType, note } = req.body;
    const userId = req.user.userId;

    if (!imageData || !fileType) {
        return res.status(400).json({ error: 'Image data and file type are required.' });
    }

    const maxBase64Length = 10 * 1024 * 1024 * 1.4;
    if (imageData.length > maxBase64Length) {
        return res.status(413).json({ error: `Payload too large. Max moment size is around ${Math.round(maxBase64Length / (1024 * 1024))}MB.` });
    }


    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO ${momentsTable} (user_id, image_data, file_type, note) VALUES ($1, $2, $3, $4) RETURNING id, image_data AS src, file_type AS type, note, timestamp`,
                [userId, imageData, fileType, note || null]
            );
            res.status(201).json({ success: true, message: 'Moment uploaded successfully', moment: result.rows[0] });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Upload Moment Error:', error);
        res.status(500).json({ error: 'Failed to upload moment' });
    }
});

// Get all moments for the authenticated user
app.get('/moments/my', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, image_data AS src, file_type AS type, note, timestamp FROM ${momentsTable} WHERE user_id = $1 ORDER BY timestamp DESC`,
                [userId]
            );
            res.json({ success: true, moments: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Moments Error:', error);
        res.status(500).json({ error: 'Failed to retrieve moments' });
    }
});

// Delete a specific moment
app.delete('/moments/:id', authenticateToken, async (req, res) => {
    const momentId = req.params.id;
    const userId = req.user.userId;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM ${momentsTable} WHERE id = $1 AND user_id = $2 RETURNING id`,
                [momentId, userId]
            );
            if (result.rows.length > 0) {
                res.json({ success: true, message: 'Moment deleted successfully', momentId: result.rows[0].id });
            } else {
                res.status(404).json({ error: 'Moment not found or unauthorized' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Moment Error:', error);
        res.status(500).json({ error: 'Failed to delete moment' });
    }
});


// Start the server
server.listen(port, () => { // Use server.listen, not app.listen
    console.log(`Server listening on port ${port}`);
    console.log(`WebSocket server also running on port ${port}`);
});