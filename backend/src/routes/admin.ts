import { Router, Request, Response } from 'express';
import pool from '../models/db';

const router = Router();

// SQL Schema embedded directly to ensure availability in production
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    rank_id INT DEFAULT 1,
    streak_days INT DEFAULT 0,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ranks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_level INT NOT NULL,
    color VARCHAR(20) DEFAULT '#808080',
    icon VARCHAR(50),
    display_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    strength INT DEFAULT 10,
    agility INT DEFAULT 10,
    intelligence INT DEFAULT 10,
    vitality INT DEFAULT 10,
    luck INT DEFAULT 5,
    stat_points INT DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quest_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    quest_type ENUM('daily', 'weekly', 'side', 'dungeon') NOT NULL,
    xp_reward INT NOT NULL,
    stat_bonus_type VARCHAR(20),
    stat_bonus_amount INT DEFAULT 0,
    difficulty ENUM('easy', 'medium', 'hard', 'nightmare') DEFAULT 'medium',
    icon VARCHAR(50),
    category VARCHAR(50),
    target_count INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS player_quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    quest_template_id INT NOT NULL,
    progress INT DEFAULT 0,
    target INT DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_template_id) REFERENCES quest_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dungeons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty ENUM('E', 'D', 'C', 'B', 'A', 'S') DEFAULT 'E',
    required_level INT DEFAULT 1,
    xp_reward INT NOT NULL,
    time_limit_hours INT DEFAULT 24,
    quest_count INT DEFAULT 5,
    rewards_json JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dungeon_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    dungeon_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
    quests_completed INT DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_type ENUM('consumable', 'equipment', 'buff', 'cosmetic') NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    effect_json JSON,
    duration_hours INT,
    icon VARCHAR(50),
    is_tradeable BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    requirement_json JSON,
    passive_bonus_type VARCHAR(50),
    passive_bonus_amount INT DEFAULT 0,
    xp_reward INT DEFAULT 0,
    icon VARCHAR(50),
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common'
);

CREATE TABLE IF NOT EXISTS player_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_player_achievement (player_id, achievement_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    xp_gained INT DEFAULT 0,
    details_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
`;

const INITIAL_DATA_SQL = `
INSERT IGNORE INTO ranks (id, name, min_level, color, display_order) VALUES
(1, 'E-Rank', 1, '#808080', 1),
(2, 'D-Rank', 10, '#ffffff', 2),
(3, 'C-Rank', 20, '#00ff00', 3),
(4, 'B-Rank', 40, '#0000ff', 4),
(5, 'A-Rank', 60, '#ff0000', 5),
(6, 'S-Rank', 80, '#ffd700', 6),
(7, 'National Level', 100, '#800080', 7);

INSERT IGNORE INTO quest_templates (title, description, quest_type, xp_reward, difficulty) VALUES
('Push-ups', 'Do 100 Push-ups', 'daily', 100, 'medium'),
('Sit-ups', 'Do 100 Sit-ups', 'daily', 100, 'medium'),
('Squats', 'Do 100 Squats', 'daily', 100, 'medium'),
('Running', 'Run 10km', 'daily', 100, 'medium');
`;

router.get('/init-db', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      // Split and execute Schema
      const statements = SCHEMA_SQL.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
      }
      
      // Split and execute Initial Data
      const dataStatements = INITIAL_DATA_SQL.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of dataStatements) {
          await connection.query(statement);
      }

      res.status(200).json({ 
        message: 'Database initialized successfully', 
        tables_created: statements.length,
        data_inserted: true
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ error: 'Initialization failed', details: error });
  }
});

export default router;
