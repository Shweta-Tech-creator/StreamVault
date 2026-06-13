// server.js - Backend application server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend static files

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. POST /api/signup - Register new user
app.post('/api/signup', async (req, res) => {
  const { name, email, password, subscription } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and password are required." });
  }

  try {
    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to MySQL
    const result = await db.query(
      'INSERT INTO users (name, email, password, subscription) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, subscription || 'Standard']
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: "Email address is already registered." });
    }
    res.status(500).json({ success: false, error: "Internal server error during signup." });
  }
});

// 2. POST /api/login - Authenticate user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }

  try {
    // Fetch user from DB
    const results = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (results.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const user = results[0];

    // Verify password match using bcryptjs
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    res.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error during login." });
  }
});

// 3. GET /api/users - Fetch all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, email, subscription, created_at FROM users ORDER BY id ASC');
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to retrieve users." });
  }
});

// 4. GET /api/videos - Fetch all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await db.query('SELECT * FROM videos ORDER BY id DESC');
    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error.message);
    res.status(500).json({ error: "Failed to retrieve videos." });
  }
});

// 5. POST /api/videos - Add new video
app.post('/api/videos', async (req, res) => {
  const { title, category, url, sizeMb, uploadedBy } = req.body;

  if (!title || !category || !url) {
    return res.status(400).json({ success: false, error: "Title, category, and URL are required." });
  }

  try {
    const size = sizeMb ? parseFloat(sizeMb) : (Math.random() * 300 + 20).toFixed(2); // Random default size if not provided
    const uploader = uploadedBy || 'Admin';

    const result = await db.query(
      'INSERT INTO videos (title, category, url, size_mb, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [title, category, url, size, uploader]
    );

    res.status(201).json({
      success: true,
      message: "Video added successfully!",
      videoId: result.insertId,
      video: {
        id: result.insertId,
        title,
        category,
        url,
        size_mb: size,
        uploaded_by: uploader
      }
    });
  } catch (error) {
    console.error("Error adding video:", error.message);
    res.status(500).json({ success: false, error: "Failed to add video record." });
  }
});

// 6. GET /api/dashboard-stats - Fetch aggregate statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Total Users count
    const usersResult = await db.query('SELECT COUNT(*) AS count FROM users');
    const totalUsers = usersResult[0].count || 0;

    // Total Videos count
    const videosResult = await db.query('SELECT COUNT(*) AS count FROM videos');
    const totalVideos = videosResult[0].count || 0;

    // Active streams (read from analytics table via parameterized query)
    const activeStreamsResult = await db.query('SELECT metric_value FROM analytics WHERE metric_name = ?', ['active_streams']);
    const activeStreams = activeStreamsResult[0]?.metric_value || '42';

    // Storage used (sum of video sizes)
    const storageResult = await db.query('SELECT SUM(size_mb) AS total_size FROM videos');
    const totalSizeMb = parseFloat(storageResult[0].total_size || 0);
    // Convert to GB for representation if large, else keep MB
    const storageUsage = totalSizeMb >= 1024 
      ? `${(totalSizeMb / 1024).toFixed(2)} GB` 
      : `${totalSizeMb.toFixed(1)} MB`;

    res.json({
      success: true,
      isMock: db.isMock(),
      stats: {
        totalUsers,
        totalVideos,
        activeStreams,
        storageUsage
      }
    });
  } catch (error) {
    console.error("Error generating dashboard stats:", error.message);
    res.status(500).json({ error: "Failed to calculate stats." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 StreamVault server running on http://localhost:${PORT}`);
});
