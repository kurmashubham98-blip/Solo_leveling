import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Register new player
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const playerId = result.insertId;
    
    // Create default player stats
    await pool.execute(
      'INSERT INTO player_stats (player_id) VALUES (?)',
      [playerId]
    );

    // Assign initial daily quests
    await pool.execute(
      `INSERT INTO player_quests (player_id, quest_template_id, target, due_date)
      SELECT ?, id, target_count, DATE_ADD(NOW(), INTERVAL 1 DAY)
      FROM quest_templates WHERE quest_type = 'daily' AND is_active = TRUE LIMIT 5`,
      [playerId]
    );

    const token = jwt.sign(
      { userId: playerId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Player created successfully',
      token,
      player: { id: playerId, username, email }
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM players WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const player = rows[0];
    const validPassword = await bcrypt.compare(password, player.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login and streak
    const lastLogin = new Date(player.last_login);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = player.streak_days;
    if (daysDiff === 1) {
      newStreak++;
    } else if (daysDiff > 1) {
      newStreak = 1;
    }

    await pool.execute(
      'UPDATE players SET last_login = NOW(), streak_days = ? WHERE id = ?',
      [newStreak, player.id]
    );

    const token = jwt.sign(
      { userId: player.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      player: {
        id: player.id,
        username: player.username,
        email: player.email,
        level: player.level,
        xp: player.xp,
        rank_id: player.rank_id,
        streak_days: newStreak
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token (auto-login)
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number };
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, ps.strength, ps.agility, ps.intelligence, ps.vitality, ps.luck, ps.stat_points,
              r.name as rank_name, r.color as rank_color
       FROM players p
       LEFT JOIN player_stats ps ON p.id = ps.player_id
       LEFT JOIN ranks r ON p.rank_id = r.id
       WHERE p.id = ?`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = rows[0];
    res.json({
      player: {
        id: player.id,
        username: player.username,
        email: player.email,
        level: player.level,
        xp: player.xp,
        rank_id: player.rank_id,
        rank_name: player.rank_name,
        rank_color: player.rank_color,
        streak_days: player.streak_days,
        stats: {
          strength: player.strength,
          agility: player.agility,
          intelligence: player.intelligence,
          vitality: player.vitality,
          luck: player.luck,
          stat_points: player.stat_points
        }
      }
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;