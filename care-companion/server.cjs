const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const saltRounds = 10;

// --- Database Connection ---
// This connects to your 'Hackathon' database using the 'root' user.
const dbPool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'malavika', // <<< ⚠️ Make sure this is your correct MySQL root password
  database: 'Hackathon',
});

// --- API Endpoints ---

// User Signup
app.post('/api/signup', async (req, res) => {
  const { name, mobile, password } = req.body;

  if (!name || !mobile || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Use lowercase username for storage and lookups to make it case-insensitive
    const storageName = name.trim().toLowerCase();
    const displayName = name.trim();

    // Check if user already exists
    const [existingUsers] = await dbPool.execute('SELECT * FROM users WHERE username = ?', [storageName]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Account with this name already exists.' });
    }

    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create initial empty profile, preserving original name casing
    const initialProfile = { name: displayName, age: '', condition: '', meds: [] };

    // Insert new user
    const [result] = await dbPool.execute(
      'INSERT INTO users (username, mobile, password, profile) VALUES (?, ?, ?, ?)',
      [storageName, mobile, hashedPassword, JSON.stringify(initialProfile)]
    );

    const newUser = {
      id: result.insertId,
      name: displayName,
      mobile,
      profile: initialProfile,
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Name and password are required.' });
  }

  try {
    const storageName = name.trim().toLowerCase();

    const [users] = await dbPool.execute('SELECT * FROM users WHERE username = ?', [storageName]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid name or password.' });
    }

    const user = users[0];

    // Compare provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid name or password.' });
    }

    // Don't send the password hash to the client
    const { password: _, ...userToSend } = user;
    
    // The mysql2 driver often automatically parses JSON columns, but we check just in case
    if (typeof userToSend.profile === 'string') {
      userToSend.profile = JSON.parse(userToSend.profile);
    }
    res.status(200).json(userToSend);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Profile Update
app.put('/api/profile/:username', async (req, res) => {
  const { username } = req.params;
  const updatedProfile = req.body;

  try {
    const oldStorageName = username.toLowerCase();
    const newDisplayName = updatedProfile.name.trim();
    const newStorageName = newDisplayName.toLowerCase();

    // Check if user exists
    const [users] = await dbPool.execute('SELECT * FROM users WHERE username = ?', [oldStorageName]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If username is changing, check if the new one is already taken
    if (oldStorageName !== newStorageName) {
      const [existingUsers] = await dbPool.execute('SELECT * FROM users WHERE username = ?', [newStorageName]);
      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'This username is already taken.' });
      }
    }

    // Update username and profile
    await dbPool.execute(
        'UPDATE users SET username = ?, profile = ? WHERE username = ?',
        [newStorageName, JSON.stringify(updatedProfile), oldStorageName]
    );

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
});


// --- Server Start ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CareCompanion server is running on http://localhost:${PORT}`);
});
