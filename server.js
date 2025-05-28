// server.js (Backend)
const momentsTable = 'moments';
require('dotenv').config();

const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
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

const sharp = require('sharp');
const multer = require('multer');

const secretKey = process.env.JWT_SECRET_KEY;
console.log('Server starting. JWT_SECRET_KEY (loaded):', secretKey ? '****** (defined)' : 'UNDEFINED');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app); 
const port = 3000;

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); 

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
const chatsTable = 'chats'; 
const messagesTable = 'messages'; 
const friendsTable = 'friends'; 


function generateVerificationCode(length) {
    return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
}

const getUserIdFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded.userId;
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        return null;
    }
};

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

io.on('connection', async (socket) => {
  console.log('A user connected via WebSocket:', socket.id);
  let authToken = socket.handshake.auth.token; 
  let userId = null;

  if (authToken) {
      userId = getUserIdFromToken(authToken); 
      if (userId) {
          socket.userId = userId; 
          console.log(`WebSocket user authenticated: ${userId} (${socket.id})`);
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
          socket.disconnect(true); 
      }
  } else {
      console.warn('WebSocket connection attempt without token.');
      socket.disconnect(true); 
  }


  socket.on('join_chat', (chatId) => {
    if (socket.userId) { 
        pool.query(
            `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
            [chatId, socket.userId]
        ).then(result => {
            if (result.rows.length > 0) {
                socket.join(chatId); 
                console.log(`User ${socket.userId} (${socket.id}) explicitly joined chat room: ${chatId}`);
            } else {
                console.warn(`User ${socket.userId} tried to join unauthorized chat ${chatId}`);
            }
        }).catch(error => {
            console.error(`Error verifying chat participant for join_chat:`, error);
        });
    } else {
        console.warn(`Unauthorized attempt to join chat room ${chatId} by socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from WebSocket:', socket.id);
  });
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Authenticate Token: Authorization header:', authHeader); 
    console.log('Authenticate Token: Extracted token:', token ? 'Token present' : 'No token');

    if (!token) {
        console.log('Authenticate Token: No token provided, sending 401.'); 
        return res.sendStatus(401);
    }

    const userId = getUserIdFromToken(token);
    console.log('Authenticate Token: Decoded userId:', userId); 

    if (!userId) {
        console.log('Authenticate Token: Invalid token, sending 403.');
        return res.sendStatus(403);
    }

    req.user = { userId: userId }; 
    console.log('Authenticate Token: Authentication successful for userId:', req.user.userId);
    next();
};

app.post('/process-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    try {
        let image = sharp(req.file.buffer); 
        const brightness = parseFloat(req.body.brightness) || 1.0;
        const contrast = parseFloat(req.body.contrast) || 1.0;
        const saturation = parseFloat(req.body.saturation) || 1.0;
        const grayscale = req.body.grayscale === 'true'; 

        image = image.modulate({
            brightness: brightness,
            saturation: saturation,
        });

        if (grayscale) {
            image = image.grayscale();
        }

        if (contrast !== 1.0) {
            const mid = 128;
            const slope = contrast;
            const intercept = mid * (1 - slope);
            image = image.linear(slope, intercept).normalise(); 
        }

        const processedBuffer = await image.png().toBuffer();
        const base64Image = processedBuffer.toString('base64');

        res.json({ processedImage: base64Image });

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image', details: error.message });
    }
});

// Check Username Availability
app.get('/users/check-username', async (req, res) => {
    const { username } = req.query;
    if (!username || username.trim() === '') {
        return res.status(400).json({ error: 'Username is required.' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id FROM ${usersTable} WHERE username ILIKE $1`, 
                [username]
            );
            if (result.rows.length > 0) {
                res.json({ available: false, message: 'Username is already taken.' });
            } else {
                res.json({ available: true, message: 'Username is available!' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Check Username Error:', error);
        res.status(500).json({ error: 'Failed to check username availability.' });
    }
});


// User Registration
app.post('/users/', [
    body('email').isEmail().withMessage('Invalid email'),
    body('first_name').notEmpty().withMessage('First name required'),
    body('username').notEmpty().withMessage('Username required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'), // Add username validation
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, first_name, username, password } = req.body; 
    if (!email || !first_name || !username || !password) { 
        return res.status(400).json({ detail: 'Missing fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO ${usersTable} (email, first_name, username, password) VALUES ($1, $2, $3, $4) RETURNING *`, 
                [email, first_name, username, hashedPassword]
            );
            res.status(201).json({ message: 'User registered', user: result.rows[0] });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Registration Error:', error);
        if (error.code === '23505') { 
            if (error.constraint === 'users_username_key') {
                return res.status(409).json({ error: 'Username is already taken.' });
            }
            if (error.constraint === 'users_email_key') {
                return res.status(409).json({ error: 'Email is already registered.' });
            }
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login with Email
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
                `SELECT id, email, first_name, username, bio, profile_picture_url, password FROM ${usersTable} WHERE email = $1`, // Select username
                [email]
            );
            const user = result.rows[0];

            if (user && await bcrypt.compare(password, user.password)) {
                console.log('Login successful for user:', user.email);
                const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, secretKey, { expiresIn: '7d' });
                console.log('Generated token:', token ? 'DEFINED' : 'UNDEFINED (JWT signing failed)');

                const userDataForFrontend = {
                    uid: user.id, 
                    name: user.first_name,
                    email: user.email,
                    username: user.username, 
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

// User Login with Username
app.post('/users/login-username', [
    body('username').notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ detail: 'Missing fields' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, email, first_name, username, bio, profile_picture_url, password FROM ${usersTable} WHERE username = $1`, 
                [username]
            );
            const user = result.rows[0];

            if (user && await bcrypt.compare(password, user.password)) {
                console.log('Login successful for user:', user.username);
                const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, secretKey, { expiresIn: '7d' });

                const userDataForFrontend = {
                    uid: user.id,
                    name: user.first_name,
                    email: user.email,
                    username: user.username,
                    bio: user.bio || 'No bio yet.',
                    profile_picture_url: user.profile_picture_url || 'https://via.placeholder.com/150'
                };

                res.status(200).json({
                    message: 'Login success',
                    access_token: token,
                    user: userDataForFrontend
                });
            } else {
                res.status(401).json({ detail: 'Invalid username or password' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Username Login Error:', error);
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
    const { name, email, bio, profilePicture, username, is_private } = req.body; 

    if (!name || !email || !username) { 
        return res.status(400).json({ error: 'Name, Email, and Username are required' });
    }

    try {
        const client = await pool.connect();
        try {
            const query = `
                UPDATE ${usersTable}
                SET first_name = $1, email = $2, bio = $3, profile_picture_url = $4, username = $5, is_private = $6
                WHERE id = $7
                RETURNING id, email, first_name, username, bio, profile_picture_url, is_private;
            `;
            const values = [
                name,
                email,
                bio || null,
                profilePicture || 'https://via.placeholder.com/150', 
                username, 
                typeof is_private === 'boolean' ? is_private : false, 
                req.user.userId
            ];

            const result = await client.query(query, values);

            if (result.rows.length > 0) {
                const updatedUser = result.rows[0];
                const userDataForFrontend = {
                    uid: updatedUser.id,
                    name: updatedUser.first_name,
                    email: updatedUser.email,
                    username: updatedUser.username, 
                    bio: updatedUser.bio || 'No bio yet.',
                    profile_picture_url: updatedUser.profile_picture_url || 'https://via.placeholder.com/150',
                    is_private: updatedUser.is_private 
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
            if (error.constraint === 'users_username_key') {
                return res.status(409).json({ error: 'Username is already taken.' });
            }
            if (error.constraint === 'users_email_key') {
                return res.status(409).json({ error: 'Email is already in use.' });
            }
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Tto check friendship status
async function checkFriendship(pool, userId, targetUserId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT status FROM ${friendsTable} WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            [userId, targetUserId]
        );
        return result.rows.length > 0 ? result.rows[0].status : 'not_friends'; 
    } finally {
        client.release();
    }
}

// Send friend request
app.post('/friend-requests/send', authenticateToken, async (req, res) => {
    const { targetUserId } = req.body;
    const userId = req.user.userId;

    if (!targetUserId) {
        return res.status(400).json({ error: 'Missing targetUserId.' });
    }

    if (userId === targetUserId) {
        return res.status(400).json({ error: 'Cannot send a friend request to yourself.' });
    }

    try {
        const client = await pool.connect();
        try {
            const friendshipStatus = await checkFriendship(pool, userId, targetUserId);

            if (friendshipStatus !== 'not_friends') {
                return res.status(409).json({ error: `Already ${friendshipStatus} with this user.` });
            }

            await client.query(
                `INSERT INTO ${friendsTable} (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
                [userId, targetUserId]
            );

            res.status(201).json({ success: true, message: 'Friend request sent.' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Send Friend Request Error:', error);
        res.status(500).json({ error: 'Failed to send friend request.' });
    }
});

// Accept friend request
app.post('/friend-requests/accept', authenticateToken, async (req, res) => {
    const { targetUserId } = req.body;
    const userId = req.user.userId;

    if (!targetUserId) {
        return res.status(400).json({ error: 'Missing targetUserId.' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE ${friendsTable} SET status = 'friends' WHERE user_id = $2 AND friend_id = $1 AND status = 'pending' RETURNING *`,
                [userId, targetUserId] 
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No pending friend request found.' });
            }
            await client.query(
                `INSERT INTO ${friendsTable} (user_id, friend_id, status) VALUES ($1, $2, 'friends') ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'friends'`,
                [userId, targetUserId]
            );

            res.json({ success: true, message: 'Friend request accepted.' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Accept Friend Request Error:', error);
        res.status(500).json({ error: 'Failed to accept friend request.' });
    }
});

// Get friend requests for the authenticated user
app.get('/friend-requests/my', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT u.id, u.first_name, u.username, u.email, u.profile_picture_url
                FROM ${usersTable} u
                JOIN ${friendsTable} f ON u.id = f.user_id
                WHERE f.friend_id = $1 AND f.status = 'pending'`, 
                [userId]
            );
            res.json({ success: true, requests: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Friend Requests Error:', error);
        res.status(500).json({ error: 'Failed to get friend requests.' });
    }
});

// Search users to add as contacts
app.get('/users/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    const userId = req.user.userId;

    console.log('Search Users Endpoint: Query (q):', q);
    console.log('Search Users Endpoint: Current userId:', userId);

    if (!q || q.length < 2) {
        console.log('Search Users Endpoint: Invalid query length, sending 400.');
        return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    try {
        const client = await pool.connect();
        try {
            const sqlQuery = `
                SELECT
                    u.id,
                    u.first_name,
                    u.username,
                    u.email,
                    u.profile_picture_url,
                    u.is_private,
                    CASE
                        WHEN f.status = 'friends' THEN TRUE
                        ELSE FALSE
                    END AS is_friend
                FROM ${usersTable} u
                LEFT JOIN ${friendsTable} f ON (u.id = f.user_id AND f.friend_id = $2 AND f.status = 'friends') OR (u.id = f.friend_id AND f.user_id = $2 AND f.status = 'friends')
                WHERE (u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.username ILIKE $1) AND u.id != $2
            `;
            const queryParams = [`%${q}%`, userId];

            console.log('Search Users Endpoint: Executing SQL:', sqlQuery, 'with params:', queryParams);

            const result = await client.query(sqlQuery, queryParams);
            console.log('Search Users Endpoint: Search results count:', result.rows.length);
            res.json({ success: true, users: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ error: 'Failed to search users.' });
    }
});

// Get User Profile by ID (Public/Private Info)
app.get('/users/:userId', authenticateToken, async (req, res) => {
    const targetUserId = req.params.userId; 
    const currentUserId = req.user.userId;

    if (!targetUserId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    let client;
    try {
        client = await pool.connect();

        // Fetch the target user's full profile details
        const userResult = await client.query(
            `SELECT id, first_name, username, email, bio, profile_picture_url, is_private
             FROM ${usersTable} WHERE id = $1`,
            [targetUserId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = userResult.rows[0];

        // Determine friendship status
        let friendshipStatus = 'not_friends';
        if (currentUserId === parseInt(targetUserId)) { 
            friendshipStatus = 'self';
        } else {
            const friendCheck = await client.query(
                `SELECT status FROM ${friendsTable} WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
                [currentUserId, targetUserId]
            );
            if (friendCheck.rows.length > 0) {
                friendshipStatus = friendCheck.rows[0].status; 
            }
        }

        // Send back user data along with friendship status
        res.json({
            success: true,
            user: {
                id: user.id,
                first_name: user.first_name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profile_picture_url: user.profile_picture_url,
                is_private: user.is_private,
                friendshipStatus: friendshipStatus
            }
        });

    } catch (error) {
        console.error('Get User by ID Error:', error);
        res.status(500).json({ error: 'Failed to retrieve user profile.' });
    } finally {
        if (client) {
            client.release();
        }
    }
});


// Add a new contact
app.post('/contacts', authenticateToken, async (req, res) => {
    const { contact_user_id } = req.body;
    const userId = req.user.userId;

    console.log('Add Contact Endpoint: userId:', userId, 'contact_user_id:', contact_user_id);

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
                console.log('Add Contact Endpoint: Contact already exists, sending 409.');
                return res.status(409).json({ error: 'Contact already exists.' });
            }

            const result = await client.query(
                `INSERT INTO contacts (user_id, contact_user_id) VALUES ($1, $2) RETURNING id, user_id, contact_user_id`,
                [userId, contact_user_id]
            );

            const contactDetails = await client.query(
                `SELECT id, first_name, username, email, profile_picture_url FROM ${usersTable} WHERE id = $1`, 
                [contact_user_id]
            );

            console.log('Add Contact Endpoint: Successfully added contact:', result.rows[0].id);
            res.status(201).json({
                success: true,
                message: 'Contact added successfully',
                contact: {
                    contact_id: result.rows[0].id,
                    user_id: contactDetails.rows[0].id,
                    first_name: contactDetails.rows[0].first_name,
                    username: contactDetails.rows[0].username, 
                    email: contactDetails.rows[0].email,
                    profile_picture_url: contactDetails.rows[0].profile_picture_url
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Add Contact Error:', error);
        res.status(500).json({ error: 'Failed to add contact.' });
    }
});

// Get all contacts for the authenticated user
app.get('/contacts/my', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    console.log('Get My Contacts Endpoint: userId:', userId);
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT c.id as contact_id, u.id as user_id, u.first_name, u.username, u.email, u.profile_picture_url
                 FROM contacts c
                 JOIN ${usersTable} u ON c.contact_user_id = u.id
                 WHERE c.user_id = $1 ORDER BY u.first_name ASC`,
                [userId]
            );
            console.log('Get My Contacts Endpoint: Found contacts count:', result.rows.length);
            res.json({ success: true, contacts: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Contacts Error:', error);
        res.status(500).json({ error: 'Failed to retrieve contacts.' });
    }
});

// Delete a specific contact
app.delete('/contacts/:id', authenticateToken, async (req, res) => {
    const contactId = req.params.id;
    const userId = req.user.userId;

    console.log('Delete Contact Endpoint: userId:', userId, 'contactId:', contactId);

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
                [contactId, userId]
            );
            if (result.rows.length > 0) {
                res.json({ success: true, message: 'Contact deleted successfully', contactId: result.rows[0].id });
            } else {
                res.status(404).json({ error: 'Contact not found or unauthorized.' });
            }
        } finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Delete Contact Error:', error);
        res.status(500).json({ error: 'Failed to delete contact.' });
    }
});

// T create a new chat if one doesn't exist between two users
async function findOrCreateChat(pool, user1Id, user2Id) {
    const client = await pool.connect();
    try {
        console.log('findOrCreateChat: Attempting to find/create chat between', user1Id, 'and', user2Id);
        const existingChatResult = await client.query(
            `SELECT cp1.chat_id
             FROM chat_participants cp1
             JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
             WHERE cp1.user_id = $1 AND cp2.user_id = $2
             GROUP BY cp1.chat_id
             HAVING COUNT(DISTINCT cp1.user_id) = 1 AND COUNT(DISTINCT cp2.user_id) = 1;`, 
            [user1Id, user2Id]
        );

        if (existingChatResult.rows.length > 0) {
            console.log('findOrCreateChat: Existing chat found:', existingChatResult.rows[0].chat_id);
            return existingChatResult.rows[0].chat_id; 
        }

        // If no chat exists, create a new one
        console.log('findOrCreateChat: No existing chat found, creating a new one.');
        await client.query('BEGIN');
        const newChatResult = await client.query(
            `INSERT INTO ${chatsTable} DEFAULT VALUES RETURNING chat_id`
        );
        const newChatId = newChatResult.rows[0].chat_id;
        console.log('findOrCreateChat: New chat created with ID:', newChatId);

        // Add participants to the new chat
        await client.query(
            `INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)`,
            [newChatId, user1Id, user2Id]
        );
        await client.query('COMMIT');
        console.log('findOrCreateChat: Participants added and transaction committed.');
        return newChatId;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('findOrCreateChat Error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// To create a new chat or open an existing one (when user clicks on a contact)
app.post('/chats/create-or-get', authenticateToken, async (req, res) => {
    const currentUserId = req.user.userId;
    const { targetUserId } = req.body;

    console.log('Create or Get Chat Endpoint: currentUserId:', currentUserId, 'targetUserId:', targetUserId);

    if (!targetUserId) {
        return res.status(400).json({ detail: 'Target user ID is required.' });
    }
    if (currentUserId === targetUserId) {
        return res.status(400).json({ detail: 'Cannot start a chat with yourself.' });
    }

    try {
        const chatId = await findOrCreateChat(pool, currentUserId, targetUserId);
        io.sockets.sockets.forEach(socket => {
            if (socket.userId === currentUserId || socket.userId === targetUserId) {
                socket.join(chatId); 
                console.log(`Socket ${socket.id} (user ${socket.userId}) joined chat room ${chatId} after create/get.`);
            }
        });

        res.status(200).json({ success: true, message: 'Chat retrieved or created successfully', chatId: chatId });
    }  catch (error) {
        console.error('Error in create-or-get chat:', error);
        res.status(500).json({ detail: 'Failed to create or retrieve chat.' });
    }
});

// Get all chats for the authenticated user
app.get('/chats/my-chats', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    console.log('Get My Chats Endpoint: userId:', userId);
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
                        'username', u.username,
                        'email', u.email,
                        'profile_img_url', u.profile_picture_url
                    )) FILTER (WHERE u.id IS NOT NULL) as participants
                FROM ${chatsTable} c
                JOIN chat_participants cp ON c.chat_id = cp.chat_id
                LEFT JOIN chat_participants cp_other ON c.chat_id = cp_other.chat_id AND cp_other.user_id != $1
                LEFT JOIN ${usersTable} u ON cp_other.user_id = u.id
                WHERE cp.user_id = $1
                GROUP BY c.chat_id
                ORDER BY last_message_timestamp DESC NULLS LAST;`,
                [userId]
            );
            console.log('Get My Chats Endpoint: Fetched chats count:', result.rows.length);
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ detail: 'Failed to load chats.' });
    }
});

app.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.userId;

    console.log('Get Chat Messages Endpoint: chatId:', chatId, 'userId:', userId);

    try {
        const client = await pool.connect();
        try {
            const participantCheck = await client.query(
                `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
                [chatId, userId]
            );

            if (participantCheck.rows.length === 0) {
                console.log('Get Chat Messages Endpoint: Not authorized, sending 403.');
                return res.status(403).json({ detail: 'Not authorized to view this chat.' });
            }

            const result = await client.query(
                `SELECT id, chat_id, sender_id, text, timestamp
                 FROM ${messagesTable}
                 WHERE chat_id = $1 ORDER BY timestamp ASC`,
                [chatId]
            );
            console.log('Get Chat Messages Endpoint: Fetched messages count:', result.rows.length);
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ detail: 'Failed to load messages.' });
    }
});

// Send a message to a chat
app.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const { text } = req.body;
    const senderId = req.user.userId;

    console.log('Send Message Endpoint: chatId:', chatId, 'senderId:', senderId, 'text:', text);

    if (!text || text.trim() === '') {
      return res.status(400).json({ detail: 'Message text cannot be empty.' });
    }

    let client;
    try {
        client = await pool.connect();
        const participantCheck = await client.query(
            `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
            [chatId, senderId]
        );

        if (participantCheck.rows.length === 0) {
            console.log('Send Message Endpoint: Not authorized, sending 403.');
            return res.status(403).json({ detail: 'Not authorized to send messages to this chat.' });
        }

        const result = await client.query(
            `INSERT INTO ${messagesTable} (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *`,
            [chatId, senderId, text.trim()]
        );
        const newMessage = result.rows[0];

        await client.query(
            `UPDATE ${chatsTable} SET last_message_timestamp = $1 WHERE chat_id = $2`,
            [newMessage.timestamp, chatId]
        );

        io.to(chatId).emit('receiveMessage', {
            id: newMessage.id,
            chat_id: newMessage.chat_id,
            sender_id: newMessage.sender_id,
            text: newMessage.text,
            timestamp: newMessage.timestamp
        });
        console.log(`Message sent and broadcasted to chat ${chatId}:`, newMessage.id);

        res.status(201).json({ message: 'Message sent and broadcasted', data: newMessage });

    } catch (error) {
        console.error('Error sending message:', error);
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

    console.log('Delete Chat Endpoint: chatId:', chatId, 'userId:', userId);

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if user is a participant in this chat
            const participantCheck = await client.query(
                `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2`,
                [chatId, userId]
            );

            if (participantCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                console.log('Delete Chat Endpoint: Not authorized, sending 403.');
                return res.status(403).json({ detail: 'Not authorized to delete this chat.' });
            }

            await client.query(`DELETE FROM ${messagesTable} WHERE chat_id = $1`, [chatId]);
            await client.query(`DELETE FROM chat_participants WHERE chat_id = $1`, [chatId]);
            const chatDeleteResult = await client.query(`DELETE FROM ${chatsTable} WHERE chat_id = $1 RETURNING chat_id`, [chatId]);

            await client.query('COMMIT'); 

            if (chatDeleteResult.rows.length > 0) {
                io.sockets.sockets.forEach(s => {
                    if (s.rooms.has(chatId)) {
                        s.leave(chatId); 
                        console.log(`Socket ${s.id} left room ${chatId}`);
                    }
                });
                console.log('Delete Chat Endpoint: Chat deleted successfully:', chatDeleteResult.rows[0].chat_id);
                res.json({ success: true, message: 'Chat deleted successfully.' });
            } else {
                console.log('Delete Chat Endpoint: Chat not found, sending 404.');
                res.status(404).json({ detail: 'Chat not found.' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting chat:', error);
        res.status(500).json({ detail: 'Failed to delete chat.' });
    }
});

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

app.get('/posts/user/:userId', authenticateToken, async (req, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (currentUserId === parseInt(targetUserId)) { 
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `SELECT id, content, image_url as image, feeling, timestamp FROM ${postsTable} WHERE user_id = $1 ORDER BY timestamp DESC`,
                    [targetUserId]
                );
                return res.json({ success: true, posts: result.rows });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get Own Posts Error:', error);
            return res.status(500).json({ error: 'Failed to retrieve your posts' });
        }
    }

    try {
        const client = await pool.connect();
        try {
            // Fetch target user's privacy status
            const userResult = await client.query(
                `SELECT is_private FROM ${usersTable} WHERE id = $1`,
                [targetUserId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const isPrivate = userResult.rows[0].is_private;

            // Check friendship status if the profile is private
            if (isPrivate) {
                const friendshipStatus = await checkFriendship(pool, currentUserId, targetUserId);
                if (friendshipStatus !== 'friends') {
                    return res.status(403).json({ error: 'User is private. You must be friends to view their posts.' });
                }
            }

            // If public, or private, fetch posts
            const result = await client.query(
                `SELECT id, content, image_url as image, feeling, timestamp FROM ${postsTable} WHERE user_id = $1 ORDER BY timestamp DESC`,
                [targetUserId]
            );
            res.json({ success: true, posts: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get User Posts Error:', error);
        res.status(500).json({ error: 'Failed to retrieve user posts' });
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
            `UPDATE ${usersTable} SET phone_number = $1, country_code = $2 WHERE id = $3`, 
            [phoneNumber, countryCode, req.user.userId] 
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
                    `UPDATE ${usersTable} SET phone_verified = TRUE WHERE id = $1`,
                    [req.user.userId]
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

// Upload a new moment 
app.post('/moments', authenticateToken, async (req, res) => {
    const { src: imageData, type: fileType, note } = req.body;
    const userId = req.user.userId;

    if (!imageData || !fileType) {
        return res.status(400).json({ error: 'Image data and file type are required.' });
    }

    const maxBase64Length = 2 * 1024 * 1024; // Increased to 2MB for the Base64 string
    if (imageData.length > maxBase64Length) {
        return res.status(413).json({ error: `Payload too large. Max moment size is around ${Math.round(maxBase64Length / (1024 * 1024))}MB (Base64 encoded).` });
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

// Get all moments for the authenticated user (your own moments)
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

// Get moments for a specific user
app.get('/moments/user/:userId', authenticateToken, async (req, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (currentUserId === parseInt(targetUserId)) { 
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `SELECT id, image_data AS src, file_type AS type, note, timestamp FROM ${momentsTable} WHERE user_id = $1 ORDER BY timestamp DESC`,
                    [targetUserId]
                );
                return res.json({ success: true, moments: result.rows });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get Own Moments Error:', error);
            return res.status(500).json({ error: 'Failed to retrieve your moments' });
        }
    }

    try {
        const client = await pool.connect();
        try {
            // Fetch target user's privacy status
            const userResult = await client.query(
                `SELECT is_private FROM ${usersTable} WHERE id = $1`,
                [targetUserId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const isPrivate = userResult.rows[0].is_private;

            // Check friendship status if the profile is private
            if (isPrivate) {
                const friendshipStatus = await checkFriendship(pool, currentUserId, targetUserId);
                if (friendshipStatus !== 'friends') {
                    return res.status(403).json({ error: 'User is private. You must be friends to view their moments.' });
                }
            }

            // If public, or private, fetch moments
            const result = await client.query(
                `SELECT id, image_data AS src, file_type AS type, note, timestamp FROM ${momentsTable} WHERE user_id = $1 ORDER BY timestamp DESC`,
                [targetUserId]
            );
            res.json({ success: true, moments: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get User Moments Error:', error);
        res.status(500).json({ error: 'Failed to retrieve user moments' });
    }
});

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

// To start the server
server.listen(port, () => { 
    console.log(`Server listening on port ${port}`);
    console.log(`WebSocket server also running on port ${port}`);
});