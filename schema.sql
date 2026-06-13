-- StreamVault Database Schema Setup

-- Create Database if not exists (Uncomment if needed, usually created via RDS console)
-- CREATE DATABASE IF NOT EXISTS streamvault;
-- USE streamvault;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Will store bcrypt hashes
    subscription VARCHAR(50) DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Videos Table
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    size_mb DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    uploaded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- SEED DATA (To populate database initially)
-- ==========================================

-- Insert Default Users
-- Hashed password is bcrypt of 'password123': $2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy
INSERT INTO users (name, email, password, subscription) VALUES
('Sweta Kadam', 'sweta@streamvault.com', '$2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy', 'Premium'),
('Demo User', 'demo@streamvault.com', '$2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy', 'Standard'),
('Admin User', 'admin@streamvault.com', '$2a$10$L19G5l4M4Z58uYp0VjJ39Ol.M3N.L6m92D4y4aFp.iXyZf5J8J9Jy', 'Enterprise')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Default Videos (Sample streamable MP4 assets)
INSERT INTO videos (title, category, url, size_mb, uploaded_by) VALUES
('Big Buck Bunny', 'Animation', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 120.50, 'Admin User'),
('Elephants Dream', 'Sci-Fi', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 150.25, 'Sweta Kadam'),
('For Bigger Blazes', 'Promo', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 15.80, 'Admin User'),
('Sintel Open Movie', 'Fantasy', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 210.40, 'Demo User'),
('Tears of Steel', 'Sci-Fi / CGI', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 350.00, 'Admin User')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Insert Analytics Seed
INSERT INTO analytics (metric_name, metric_value) VALUES
('active_streams', '42'),
('storage_limit_gb', '1000')
ON DUPLICATE KEY UPDATE metric_value=VALUES(metric_value);
