export interface Player {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  rank_id: number;
  rank_name?: string;
  rank_color?: string;
  streak_days: number;
  xp_for_next_level?: number;
  xp_progress?: number;
  stats?: PlayerStats;
}

export interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  stat_points: number;
}

export interface Quest {
  id: number;
  player_id: number;
  quest_template_id: number;
  title: string;
  description: string;
  quest_type: 'daily' | 'weekly' | 'side' | 'dungeon';
  xp_reward: number;
  stat_bonus_type: string;
  stat_bonus_amount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  icon: string;
  category: string;
  progress: number;
  target: number;
  completed: boolean;
  due_date: string;
}

export interface Dungeon {
  id: number;
  name: string;
  description: string;
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  required_level: number;
  xp_reward: number;
  time_limit_hours: number;
  quest_count: number;
  rewards: {
    items?: string[];
    stat_points?: number;
  };
  unlocked: boolean;
  times_completed: number;
}

export interface DungeonProgress {
  id: number;
  player_id: number;
  dungeon_id: number;
  name: string;
  difficulty: string;
  status: 'in_progress' | 'completed' | 'failed';
  quests_completed: number;
  started_at: string;
  time_remaining?: number;
}

export interface Item {
  id: number;
  item_id: number;
  name: string;
  description: string;
  item_type: 'consumable' | 'equipment' | 'buff' | 'cosmetic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effect: Record<string, any>;
  duration_hours?: number;
  icon: string;
  quantity: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  requirement: Record<string, any>;
  passive_bonus_type: string;
  passive_bonus_amount: number;
  xp_reward: number;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlocked_at?: string;
}

export interface ActivityData {
  date: string;
  total_xp: number;
  activity_count: number;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  level: number;
  xp: number;
  rank_name: string;
  rank_color: string;
  streak_days?: number;
}
