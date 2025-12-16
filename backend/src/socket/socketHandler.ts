import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../models/db';
import { RowDataPacket } from 'mysql2';

interface SocketWithUser extends Socket {
  userId?: number;
  username?: string;
}

const connectedUsers = new Map<number, string>();

export const initializeSocket = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: SocketWithUser, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number };
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, username FROM players WHERE id = ?',
        [decoded.userId]
      );
      
      if (rows.length === 0) {
        return next(new Error('Player not found'));
      }

      socket.userId = decoded.userId;
      socket.username = rows[0].username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    console.log(\Player connected: \ (\)\);
    
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);
    }

    // Broadcast online players count
    io.emit('online_players', connectedUsers.size);

    // Quest completed notification
    socket.on('quest_completed', async (data) => {
      io.emit('player_activity', {
        type: 'quest_completed',
        player: socket.username,
        quest: data.questTitle,
        xp: data.xpGained
      });
    });

    // Level up notification
    socket.on('level_up', async (data) => {
      io.emit('player_activity', {
        type: 'level_up',
        player: socket.username,
        newLevel: data.newLevel
      });
    });

    // Dungeon completed notification
    socket.on('dungeon_completed', async (data) => {
      io.emit('player_activity', {
        type: 'dungeon_completed',
        player: socket.username,
        dungeon: data.dungeonName,
        xp: data.xpGained
      });
    });

    // Rank up notification
    socket.on('rank_up', async (data) => {
      io.emit('player_activity', {
        type: 'rank_up',
        player: socket.username,
        newRank: data.newRank
      });
    });

    // Get leaderboard updates
    socket.on('request_leaderboard', async () => {
      const [rows] = await pool.execute<RowDataPacket[]>(
        \SELECT p.id, p.username, p.level, p.xp, r.name as rank_name, r.color as rank_color
         FROM players p
         LEFT JOIN ranks r ON p.rank_id = r.id
         ORDER BY p.level DESC, p.xp DESC
         LIMIT 10\
      );
      socket.emit('leaderboard_update', rows);
    });

    socket.on('disconnect', () => {
      console.log(\Player disconnected: \\);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      io.emit('online_players', connectedUsers.size);
    });
  });
};
