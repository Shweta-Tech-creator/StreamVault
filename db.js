// db.js - Database connection module
const mysql = require('mysql2/promise');
require('dotenv').config();

// RDS MySQL connection configuration
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306')
};

let pool;
let isMock = false;

// Simulated in-memory database fallback for local testing when RDS is offline
const mockDb = {
  users: [
    { id: 1, name: 'Sweta Kadam', email: 'sweta@streamvault.com', password: '$2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy', subscription: 'Premium', created_at: new Date() },
    { id: 2, name: 'Demo User', email: 'demo@streamvault.com', password: '$2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy', subscription: 'Standard', created_at: new Date() },
    { id: 3, name: 'Admin User', email: 'admin@streamvault.com', password: '$2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy', subscription: 'Enterprise', created_at: new Date() }
  ],
  videos: [
    { id: 1, title: 'Big Buck Bunny', category: 'Animation', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', size_mb: 120.50, uploaded_by: 'Admin User', created_at: new Date() },
    { id: 2, title: 'Elephants Dream', category: 'Sci-Fi', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', size_mb: 150.25, uploaded_by: 'Sweta Kadam', created_at: new Date() },
    { id: 3, title: 'For Bigger Blazes', category: 'Promo', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', size_mb: 15.80, uploaded_by: 'Admin User', created_at: new Date() },
    { id: 4, title: 'Sintel Open Movie', category: 'Fantasy', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', size_mb: 210.40, uploaded_by: 'Demo User', created_at: new Date() },
    { id: 5, title: 'Tears of Steel', category: 'Sci-Fi / CGI', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', size_mb: 350.00, uploaded_by: 'Admin User', created_at: new Date() }
  ],
  analytics: {
    active_streams: '42',
    storage_limit_gb: '1000'
  }
};

// Initialize connection pool
try {
  if (!process.env.DB_HOST) {
    console.warn("⚠️  DB_HOST environment variable not set. Using in-memory Mock Database.");
    isMock = true;
  } else {
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log("🔌 Connected to Amazon RDS MySQL Database at host:", config.host);
  }
} catch (err) {
  console.error("❌ Failed to initialize MySQL pool:", err.message);
  console.warn("⚠️  Falling back to in-memory Mock Database.");
  isMock = true;
}

/**
 * Execute SQL queries against database (or mock database fallback)
 */
async function query(sql, params = []) {
  if (isMock) {
    return await mockQuery(sql, params);
  }
  
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error("❌ RDS MySQL Query Error:", error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.warn("⚠️  Database server unreachable. Using mock database fallback.");
      return await mockQuery(sql, params);
    }
    throw error;
  }
}

/**
 * Custom light-weight query parser to handle basic CRUD on local in-memory structures
 */
async function mockQuery(sql, params) {
  const cleanSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // 1. Insert User
  if (cleanSql.includes('insert into users')) {
    const name = params[0];
    const email = params[1];
    const password = params[2];
    const subscription = params[3] || 'Standard';
    
    if (mockDb.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error("Duplicate entry for email");
      err.code = 'ER_DUP_ENTRY';
      throw err;
    }
    
    const newUser = {
      id: mockDb.users.length + 1,
      name,
      email,
      password,
      subscription,
      created_at: new Date()
    };
    mockDb.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }
  
  // 2. Insert Video
  if (cleanSql.includes('insert into videos')) {
    const title = params[0];
    const category = params[1];
    const url = params[2];
    const size_mb = parseFloat(params[3] || 0.0);
    const uploaded_by = params[4] || 'Admin';
    
    const newVideo = {
      id: mockDb.videos.length + 1,
      title,
      category,
      url,
      size_mb,
      uploaded_by,
      created_at: new Date()
    };
    mockDb.videos.push(newVideo);
    return { insertId: newVideo.id, affectedRows: 1 };
  }
  
  // 3. Select User by Email (Login check)
  if (cleanSql.includes('select * from users where email =')) {
    const email = params[0];
    const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? [user] : [];
  }
  
  // 4. Select All Users (exclude password for security)
  if (cleanSql.includes('select * from users') || cleanSql.includes('select id, name, email, subscription')) {
    return mockDb.users.map(({ password, ...u }) => u);
  }
  
  // 5. Select All Videos
  if (cleanSql.includes('select * from videos')) {
    return mockDb.videos;
  }
  
  // 6. Select User Count
  if (cleanSql.includes('select count(*) as count from users') || cleanSql.includes('select count(*) from users')) {
    return [{ count: mockDb.users.length, 'count(*)': mockDb.users.length }];
  }
  
  // 7. Select Video Count
  if (cleanSql.includes('select count(*) as count from videos') || cleanSql.includes('select count(*) from videos')) {
    return [{ count: mockDb.videos.length, 'count(*)': mockDb.videos.length }];
  }
  
  // 8. Select Total Storage Size
  if (cleanSql.includes('select sum(size_mb) as total_size from videos') || cleanSql.includes('select sum(size_mb) from videos')) {
    const sum = mockDb.videos.reduce((acc, v) => acc + v.size_mb, 0);
    return [{ total_size: sum, 'sum(size_mb)': sum }];
  }
  
  // 9. Select Analytics value
  if (cleanSql.includes('select metric_value from analytics where metric_name =')) {
    const metricKey = params[0];
    // Convert metric_name string (e.g. 'active_streams') into object key lookup
    const val = Object.prototype.hasOwnProperty.call(mockDb.analytics, metricKey)
      ? mockDb.analytics[metricKey]
      : '0';
    return [{ metric_value: val }];
  }
  
  return [];
}

module.exports = {
  query,
  isMock: () => isMock
};
