'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlinePlayers: number;
  activities: PlayerActivity[];
}

interface PlayerActivity {
  type: string;
  player: string;
  quest?: string;
  dungeon?: string;
  xp?: number;
  newLevel?: number;
  newRank?: string;
  timestamp: Date;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [activities, setActivities] = useState<PlayerActivity[]>([]);
  const { player } = useAuth();

  useEffect(() => {
    if (player) {
      const token = localStorage.getItem('token');
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('online_players', (count: number) => {
        setOnlinePlayers(count);
      });

      newSocket.on('player_activity', (activity: Omit<PlayerActivity, 'timestamp'>) => {
        setActivities(prev => [
          { ...activity, timestamp: new Date() },
          ...prev.slice(0, 19),
        ]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [player]);

  return (
    <SocketContext.Provider value={{ socket, onlinePlayers, activities }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
