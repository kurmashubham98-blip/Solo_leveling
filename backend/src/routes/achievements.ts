import { Router, Request, Response } from 'express';
import pool from '../models/db';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get all achievements with unlock status
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT a.*, 
        (SELECT id FROM player_achievements WHERE player_id = ? AND achievement_id = a.id) as unlocked_id,
        (SELECT unlocked_at FROM player_achievements WHERE player_id = ? AND achievement_id = a.id) as unlocked_at
       FROM achievements a
       ORDER BY a.rarity DESC,
      [req.userId, req.userId]
    );

    const achievements = rows.map(a => ({
      ...a,
      unlocked: !!a.unlocked_id,
      requirement: JSON.parse(a.requirement_json || '{}')
    }));

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check and unlock achievements
router.post('/check', async (req: AuthRequest, res: Response) => {
  try {
    // Get player data
    const [playerRows] = await pool.execute<RowDataPacket[]>(
      SELECT p.*, r.name as rank_name FROM players p
       LEFT JOIN ranks r ON p.rank_id = r.id
       WHERE p.id = ?,
      [req.userId]
    );
    const player = playerRows[0];

    // Get completed quest count
    const [questRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM player_quests WHERE player_id = ? AND completed = TRUE',
      [req.userId]
    );
    const questsCompleted = questRows[0].count;

    // Get completed dungeon count
    const [dungeonRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM dungeon_progress WHERE player_id = ? AND status = 'completed'",
      [req.userId]
    );
    const dungeonsCompleted = dungeonRows[0].count;

    // Get unlocked achievements
    const [unlockedRows] = await pool.execute<RowDataPacket[]>(
      'SELECT achievement_id FROM player_achievements WHERE player_id = ?',
      [req.userId]
    );
    const unlockedIds = new Set(unlockedRows.map(r => r.achievement_id));

    // Get all achievements
    const [achievements] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM achievements'
    );

    const newlyUnlocked = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const req = JSON.parse(achievement.requirement_json || '{}');
      let shouldUnlock = false;

      if (req.quests_completed && questsCompleted >= req.quests_completed) {
        shouldUnlock = true;
      }
      if (req.level && player.level >= req.level) {
        shouldUnlock = true;
      }
      if (req.streak_days && player.streak_days >= req.streak_days) {
        shouldUnlock = true;
      }
      if (req.dungeons_completed && dungeonsCompleted >= req.dungeons_completed) {
        shouldUnlock = true;
      }
      if (req.rank && player.rank_name === req.rank) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        await pool.execute(
          'INSERT INTO player_achievements (player_id, achievement_id) VALUES (?, ?)',
          [req.userId, achievement.id]
        );
        
        // Award XP for achievement
        if (achievement.xp_reward > 0) {
          await pool.execute(
            'UPDATE players SET xp = xp + ? WHERE id = ?',
            [achievement.xp_reward, req.userId]
          );
        }

        newlyUnlocked.push(achievement);
      }
    }

    res.json({ newlyUnlocked });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
