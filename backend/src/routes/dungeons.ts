import { Router, Request, Response } from 'express';
import pool from '../models/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get all available dungeons
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const [playerRows] = await pool.execute<RowDataPacket[]>(
      'SELECT level FROM players WHERE id = ?',
      [req.userId]
    );
    const playerLevel = playerRows[0]?.level || 1;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM dungeon_progress dp WHERE dp.dungeon_id = d.id AND dp.player_id = ? AND dp.status = 'completed') as times_completed
       FROM dungeons d 
       WHERE d.is_active = TRUE
       ORDER BY d.required_level`,
      [req.userId]
    );

    const dungeons = rows.map(d => ({
      ...d,
      unlocked: playerLevel >= d.required_level,
      rewards: JSON.parse(d.rewards_json || '{}')
    }));

    res.json(dungeons);
  } catch (error) {
    console.error('Get dungeons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active dungeon progress
router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT dp.*, d.name, d.description, d.difficulty, d.xp_reward, d.time_limit_hours, d.quest_count, d.rewards_json
       FROM dungeon_progress dp
       JOIN dungeons d ON dp.dungeon_id = d.id
       WHERE dp.player_id = ? AND dp.status = 'in_progress'`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    const progress = rows[0];
    const startTime = new Date(progress.started_at);
    const endTime = new Date(startTime.getTime() + progress.time_limit_hours * 60 * 60 * 1000);
    const now = new Date();

    // Check if time expired
    if (now > endTime) {
      await pool.execute(
        "UPDATE dungeon_progress SET status = 'failed' WHERE id = ?",
        [progress.id]
      );
      return res.json({ ...progress, status: 'failed', expired: true });
    }

    res.json({
      ...progress,
      time_remaining: Math.max(0, endTime.getTime() - now.getTime()),
      rewards: JSON.parse(progress.rewards_json || '{}')
    });
  } catch (error) {
    console.error('Get active dungeon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a dungeon
router.post('/:dungeonId/start', async (req: AuthRequest, res: Response) => {
  try {
    const { dungeonId } = req.params;

    // Check if already in a dungeon
    const [activeRows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM dungeon_progress WHERE player_id = ? AND status = 'in_progress'",
      [req.userId]
    );

    if (activeRows.length > 0) {
      return res.status(400).json({ error: 'Already in an active dungeon' });
    }

    // Check if dungeon exists and player meets requirements
    const [dungeonRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM dungeons WHERE id = ? AND is_active = TRUE',
      [dungeonId]
    );

    if (dungeonRows.length === 0) {
      return res.status(404).json({ error: 'Dungeon not found' });
    }

    const dungeon = dungeonRows[0];

    const [playerRows] = await pool.execute<RowDataPacket[]>(
      'SELECT level FROM players WHERE id = ?',
      [req.userId]
    );

    if (playerRows[0].level < dungeon.required_level) {
      return res.status(400).json({ error: 'Level requirement not met' });
    }

    // Create dungeon progress
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO dungeon_progress (player_id, dungeon_id) VALUES (?, ?)',
      [req.userId, dungeonId]
    );

    // Assign dungeon quests
    await pool.execute(
      `INSERT INTO player_quests (player_id, quest_template_id, target, due_date)
      SELECT ?, id, target_count, DATE_ADD(NOW(), INTERVAL ? HOUR)
      FROM quest_templates WHERE quest_type = 'dungeon' AND is_active = TRUE LIMIT ?`,
      [req.userId, dungeon.time_limit_hours, dungeon.quest_count]
    );

    res.json({
      progress_id: result.insertId,
      dungeon,
      message: 'Dungeon started!'
    });
  } catch (error) {
    console.error('Start dungeon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete dungeon
router.post('/:progressId/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { progressId } = req.params;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT dp.*, d.xp_reward, d.rewards_json
       FROM dungeon_progress dp
       JOIN dungeons d ON dp.dungeon_id = d.id
       WHERE dp.id = ? AND dp.player_id = ? AND dp.status = 'in_progress'`,
      [progressId, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Active dungeon not found' });
    }

    const progress = rows[0];

    // Mark as completed
    await pool.execute(
      "UPDATE dungeon_progress SET status = 'completed', completed_at = NOW() WHERE id = ?",
      [progressId]
    );

    // Award XP
    const [playerRows] = await pool.execute<RowDataPacket[]>(
      'SELECT level, xp FROM players WHERE id = ?',
      [req.userId]
    );

    let player = playerRows[0];
    let newXP = player.xp + progress.xp_reward;
    let newLevel = player.level;
    const baseXP = 100;
    let xpForNextLevel = baseXP + Math.pow(newLevel, 3);

    while (newXP >= xpForNextLevel) {
      newXP -= xpForNextLevel;
      newLevel++;
      xpForNextLevel = baseXP + Math.pow(newLevel, 3);
      await pool.execute(
        'UPDATE player_stats SET stat_points = stat_points + 3 WHERE player_id = ?',
        [req.userId]
      );
    }

    const [ranks] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM ranks WHERE min_level <= ? ORDER BY min_level DESC LIMIT 1',
      [newLevel]
    );

    await pool.execute(
      'UPDATE players SET xp = ?, level = ?, rank_id = ? WHERE id = ?',
      [newXP, newLevel, ranks[0]?.id || 1, req.userId]
    );

    // Award stat points from rewards
    const rewards = JSON.parse(progress.rewards_json || '{}');
    if (rewards.stat_points) {
      await pool.execute(
        'UPDATE player_stats SET stat_points = stat_points + ? WHERE player_id = ?',
        [rewards.stat_points, req.userId]
      );
    }

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (player_id, activity_type, xp_gained, details_json) VALUES (?, ?, ?, ?)',
      [req.userId, 'dungeon_complete', progress.xp_reward, JSON.stringify({ dungeon_id: progress.dungeon_id })]
    );

    res.json({
      message: 'Dungeon completed!',
      xp_gained: progress.xp_reward,
      rewards 
    });
  } catch (error) {
    console.error('Complete dungeon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;