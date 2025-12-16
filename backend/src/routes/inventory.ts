import { Router, Request, Response } from 'express';
import pool from '../models/db';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get player inventory
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT i.*, it.name, it.description, it.item_type, it.rarity, it.effect_json, it.duration_hours, it.icon
       FROM inventory i
       JOIN items it ON i.item_id = it.id
       WHERE i.player_id = ?,
      [req.userId]
    );

    const inventory = rows.map(item => ({
      ...item,
      effect: JSON.parse(item.effect_json || '{}')
    }));

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Use an item
router.post('/:itemId/use', async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT i.*, it.name, it.item_type, it.effect_json, it.duration_hours
       FROM inventory i
       JOIN items it ON i.item_id = it.id
       WHERE i.id = ? AND i.player_id = ?,
      [itemId, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }

    const item = rows[0];
    const effect = JSON.parse(item.effect_json || '{}');

    // Apply item effects
    if (effect.xp_multiplier) {
      // TODO: Store active buff in player_buffs table
    }
    
    if (effect.stat_boost) {
      for (const [stat, value] of Object.entries(effect.stat_boost)) {
        await pool.execute(
          UPDATE player_stats SET  =  + ? WHERE player_id = ?,
          [value, req.userId]
        );
      }
    }

    if (effect.remove_debuff) {
      // Remove any active debuffs
    }

    // Decrease quantity or remove item
    if (item.quantity > 1) {
      await pool.execute(
        'UPDATE inventory SET quantity = quantity - 1 WHERE id = ?',
        [itemId]
      );
    } else {
      await pool.execute('DELETE FROM inventory WHERE id = ?', [itemId]);
    }

    res.json({ message: 'Item used successfully', effect });
  } catch (error) {
    console.error('Use item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
