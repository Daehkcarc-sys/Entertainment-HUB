-- Database Schema for Entertainment Hub
-- Version: 1.1
-- Date: 2025-04-27

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS entertainment_hub;
USE entertainment_hub;

-- Users table (fixed created_at and index)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'Avatar.jpg',
    bio TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Added default
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    INDEX idx_username (username)  -- Removed redundant unique index
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE INDEX idx_token (token(100)),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INT PRIMARY KEY,
    theme ENUM('light', 'dark') DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    notifications BOOLEAN DEFAULT TRUE,
    privacy_level ENUM('public', 'friends', 'private') DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type ENUM('anime', 'manga', 'movie', 'series', 'game') NOT NULL,
    item_id INT NOT NULL,
    status ENUM('plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped') DEFAULT 'plan_to_watch',
    rating DECIMAL(3,1) DEFAULT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_item (user_id, item_type, item_id),
    INDEX idx_user_status (user_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type ENUM('anime', 'manga', 'movie', 'series', 'game') NOT NULL,
    item_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    rating DECIMAL(3,1) NOT NULL,
    spoiler BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item (item_type, item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_id INT DEFAULT NULL,
    item_type ENUM('review', 'discussion', 'news') NOT NULL,
    item_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item (item_type, item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Example admin user (For demonstration only - remove in production)
-- Password: Admin123! (bcrypt hash)
INSERT INTO users (username, email, password_hash, created_at, role) VALUES 
('admin', 'admin@example.com', '$2y$10$6SsXYWL6azbRRGkK1aPwjuzYjoIw0H7RChLI7g1e2PD4ICyFXN6de', NOW(), 'admin');

-- Quiz tables for interactive features
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    quiz_type ENUM('movies', 'series', 'anime', 'manga', 'games', 'general') NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    created_by INT,
    INDEX idx_quiz_type (quiz_type),
    INDEX idx_status (status),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_id (quiz_id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_id (question_id),
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken INT,  -- in seconds
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_quiz (user_id, quiz_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Content tables for better cross-navigation
CREATE TABLE IF NOT EXISTS content_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    content_type ENUM('movie', 'series', 'anime', 'manga', 'game') NOT NULL,
    release_date DATE,
    end_date DATE,
    cover_image VARCHAR(255),
    banner_image VARCHAR(255),
    rating DECIMAL(3,1),
    popularity INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_slug_type (slug, content_type),
    INDEX idx_content_type (content_type),
    INDEX idx_rating (rating),
    INDEX idx_popularity (popularity),
    FULLTEXT INDEX idx_content_search (title, description)
);

CREATE TABLE IF NOT EXISTS content_genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    content_type ENUM('movie', 'series', 'anime', 'manga', 'game', 'all') DEFAULT 'all',
    UNIQUE INDEX idx_name_type (name, content_type),
    INDEX idx_slug (slug)
);

CREATE TABLE IF NOT EXISTS content_item_genres (
    content_item_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (content_item_id, genre_id),
    FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES content_genres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_item_id INT NOT NULL,
    related_item_id INT NOT NULL,
    relationship_type ENUM('adaptation', 'sequel', 'prequel', 'remake', 'spin-off', 'similar') NOT NULL,
    strength INT NOT NULL DEFAULT 5, -- 1-10 scale for relationship strength 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_relationship (source_item_id, related_item_id),
    INDEX idx_source (source_item_id),
    INDEX idx_related (related_item_id),
    INDEX idx_rel_type (relationship_type),
    FOREIGN KEY (source_item_id) REFERENCES content_items(id) ON DELETE CASCADE,
    FOREIGN KEY (related_item_id) REFERENCES content_items(id) ON DELETE CASCADE
);