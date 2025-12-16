import { Router, Request, Response } from 'express';
import pool from '../models/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get player's active quests
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT pq.*, qt.title, qt.description, qt.quest_type, qt.xp_reward, 
              qt.stat_bonus_type, qt.stat_bonus_amount, qt.difficulty, qt.icon, qt.category
       FROM player_quests pq
       JOIN quest_templates qt ON pq.quest_template_id = qt.id
       WHERE pq.player_id = ? AND pq.completed = FALSE
       ORDER BY qt.quest_type, pq.due_date`,
      [req.userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quest templates by type
router.get('/templates/:type', async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM quest_templates WHERE quest_type = ? AND is_active = TRUE',
      [type]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quest progress
router.put('/:questId/progress', async (req: AuthRequest, res: Response) => {
  try {
    const { questId } = req.params;
    const { progress } = req.body;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT pq.*, qt.xp_reward, qt.stat_bonus_type, qt.stat_bonus_amount
       FROM player_quests pq
       JOIN quest_templates qt ON pq.quest_template_id = qt.id
       WHERE pq.id = ? AND pq.player_id = ?`,
      [questId, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const quest = rows[0];
    const newProgress = Math.min(progress, quest.target);
    const completed = newProgress >= quest.target;

    await pool.execute(
      'UPDATE player_quests SET progress = ?, completed = ?, completed_at = ? WHERE id = ?',
      [newProgress, completed, completed ? new Date() : null, questId]
    );

    let xpGained = 0;
    if (completed) {
      xpGained = quest.xp_reward;
      
      // Add XP to player
      const [playerRows] = await pool.execute<RowDataPacket[]>(
        'SELECT level, xp FROM players WHERE id = ?',
        [req.userId]
      );
      
      let player = playerRows[0];
      let newXP = player.xp + xpGained;
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

      // Update rank
      const [ranks] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM ranks WHERE min_level <= ? ORDER BY min_level DESC LIMIT 1',
        [newLevel]
      );

      await pool.execute(
        'UPDATE players SET xp = ?, level = ?, rank_id = ? WHERE id = ?',
        [newXP, newLevel, ranks[0]?.id || 1, req.userId]
      );

      // Update stat if bonus exists
      if (quest.stat_bonus_type && quest.stat_bonus_amount > 0) {
        await pool.execute(
          `UPDATE player_stats SET ${quest.stat_bonus_type} = ${quest.stat_bonus_type} + ? WHERE player_id = ?`,
          [quest.stat_bonus_amount, req.userId]
        );
      }

      // Log activity
      await pool.execute(
        'INSERT INTO activity_log (player_id, activity_type, xp_gained, details_json) VALUES (?, ?, ?, ?)',
        [req.userId, 'quest_complete', xpGained, JSON.stringify({ quest_id: questId })]
      );
    }

    res.json({ progress: newProgress, completed, xpGained });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get completed quests for statistics
router.get('/completed', async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT pq.*, qt.title, qt.quest_type, qt.xp_reward, qt.category
       FROM player_quests pq
       JOIN quest_templates qt ON pq.quest_template_id = qt.id
       WHERE pq.player_id = ? AND pq.completed = TRUE 
       AND pq.completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY pq.completed_at DESC`,
      [req.userId, days]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get completed quests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh daily quests
router.post('/refresh-daily', async (req: AuthRequest, res: Response) => {
  try {
    // Delete old incomplete daily quests
    await pool.execute(
      `DELETE FROM player_quests WHERE player_id = ? 
       AND quest_template_id IN (SELECT id FROM quest_templates WHERE quest_type = 'daily')
       AND completed = FALSE`,
      [req.userId]
    );

    // Assign new daily quests
    await pool.execute(
      `INSERT INTO player_quests (player_id, quest_template_id, target, due_date)
      SELECT ?, id, target_count, DATE_ADD(NOW(), INTERVAL 1 DAY)
      FROM quest_templates WHERE quest_type = 'daily' AND is_active = TRUE`,
      [req.userId]
    );

    res.json({ message: 'Daily quests refreshed' });
  } catch (error) {
    console.error('Refresh daily error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;