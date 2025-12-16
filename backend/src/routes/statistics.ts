import { Router, Request, Response } from 'express';
import pool from '../models/db';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get activity statistics
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT DATE(created_at) as date, 
              SUM(xp_gained) as total_xp,
              COUNT(*) as activity_count,
              GROUP_CONCAT(activity_type) as activities
       FROM activity_log
       WHERE player_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date,
      [req.userId, days]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quest completion stats
router.get('/quests', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT 
        qt.quest_type,
        COUNT(CASE WHEN pq.completed = TRUE THEN 1 END) as completed,
        COUNT(*) as total
       FROM player_quests pq
       JOIN quest_templates qt ON pq.quest_template_id = qt.id
       WHERE pq.player_id = ?
       GROUP BY qt.quest_type,
      [req.userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get quest stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get streak calendar data
router.get('/calendar', async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT DATE(completed_at) as date, COUNT(*) as quests_completed
       FROM player_quests
       WHERE player_id = ? 
         AND completed = TRUE
         AND YEAR(completed_at) = ?
         AND MONTH(completed_at) = ?
       GROUP BY DATE(completed_at),
      [req.userId, year || new Date().getFullYear(), month || new Date().getMonth() + 1]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overall progress summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const [playerRows] = await pool.execute<RowDataPacket[]>(
      'SELECT level, xp, streak_days FROM players WHERE id = ?',
      [req.userId]
    );
    const player = playerRows[0];

    const [questRows] = await pool.execute<RowDataPacket[]>(
      SELECT 
        COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed,
        COUNT(*) as total
       FROM player_quests WHERE player_id = ?,
      [req.userId]
    );

    const [dungeonRows] = await pool.execute<RowDataPacket[]>(
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
       FROM dungeon_progress WHERE player_id = ?,
      [req.userId]
    );

    const [xpRows] = await pool.execute<RowDataPacket[]>(
      SELECT SUM(xp_gained) as total_xp,
              SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN xp_gained ELSE 0 END) as weekly_xp
       FROM activity_log WHERE player_id = ?,
      [req.userId]
    );

    res.json({
      player,
      quests: questRows[0],
      dungeons: dungeonRows[0],
      xp_stats: xpRows[0]
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
