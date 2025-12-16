import { Router, Request, Response } from 'express';
import pool from '../models/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Calculate XP needed for next level: base XP + level^3
const calculateXPForLevel = (level: number): number => {
  const baseXP = 100;
  return baseXP + Math.pow(level, 3);
};

// Get player profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, ps.strength, ps.agility, ps.intelligence, ps.vitality, ps.luck, ps.stat_points,
              r.name as rank_name, r.color as rank_color
       FROM players p
       LEFT JOIN player_stats ps ON p.id = ps.player_id
       LEFT JOIN ranks r ON p.rank_id = r.id
       WHERE p.id = ?`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = rows[0];
    const xpForNextLevel = calculateXPForLevel(player.level);
    
    res.json({
      ...player,
      xp_for_next_level: xpForNextLevel,
      xp_progress: (player.xp / xpForNextLevel) * 100
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add XP and handle level up
router.post('/add-xp', async (req: AuthRequest, res: Response) => {
  try {
    const { xp } = req.body;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM players WHERE id = ?',
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    let player = rows[0];
    let newXP = player.xp + xp;
    let newLevel = player.level;
    let leveledUp = false;
    let xpForNextLevel = calculateXPForLevel(newLevel);

    // Level up loop
    while (newXP >= xpForNextLevel) {
      newXP -= xpForNextLevel;
      newLevel++;
      leveledUp = true;
      xpForNextLevel = calculateXPForLevel(newLevel);
      
      // Award stat points on level up
      await pool.execute(
        'UPDATE player_stats SET stat_points = stat_points + 3 WHERE player_id = ?',
        [req.userId]
      );
    }

    // Check for rank up
    const [ranks] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM ranks WHERE min_level <= ? ORDER BY min_level DESC LIMIT 1',
      [newLevel]
    );
    
    const newRankId = ranks.length > 0 ? ranks[0].id : 1;

    await pool.execute(
      'UPDATE players SET xp = ?, level = ?, rank_id = ? WHERE id = ?',
      [newXP, newLevel, newRankId, req.userId]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (player_id, activity_type, xp_gained) VALUES (?, ?, ?)',
      [req.userId, 'xp_gain', xp]
    );

    res.json({
      newXP,
      newLevel,
      leveledUp,
      xpForNextLevel: calculateXPForLevel(newLevel),
      newRankId
    });
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stats
router.put('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { stat, amount } = req.body;
    const validStats = ['strength', 'agility', 'intelligence', 'vitality', 'luck'];
    
    if (!validStats.includes(stat)) {
      return res.status(400).json({ error: 'Invalid stat' });
    }

    // Check available stat points
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT stat_points FROM player_stats WHERE player_id = ?',
      [req.userId]
    );

    if (rows.length === 0 || rows[0].stat_points < amount) {
      return res.status(400).json({ error: 'Not enough stat points' });
    }

    await pool.execute(
      `UPDATE player_stats SET ${stat} = ${stat} + ?, stat_points = stat_points - ? WHERE player_id = ?`,
      [amount, amount, req.userId]
    );

    res.json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.username, p.level, p.xp, p.streak_days, r.name as rank_name, r.color as rank_color
       FROM players p
       LEFT JOIN ranks r ON p.rank_id = r.id
       ORDER BY p.level DESC, p.xp DESC
       LIMIT 100`
    );

    res.json(rows);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;