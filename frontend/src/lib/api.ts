const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  // Auth
  register: async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  verify: async () => {
    const res = await fetch(`${API_URL}/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Player
  getProfile: async () => {
    const res = await fetch(`${API_URL}/player/profile`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  addXP: async (xp: number) => {
    const res = await fetch(`${API_URL}/player/add-xp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ xp }),
    });
    return res.json();
  },

  updateStats: async (stat: string, amount: number) => {
    const res = await fetch(`${API_URL}/player/stats`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stat, amount }),
    });
    return res.json();
  },

  getLeaderboard: async () => {
    const res = await fetch(`${API_URL}/player/leaderboard`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Quests
  getQuests: async () => {
    const res = await fetch(`${API_URL}/quests`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  updateQuestProgress: async (questId: number, progress: number) => {
    const res = await fetch(`${API_URL}/quests/${questId}/progress`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ progress }),
    });
    return res.json();
  },

  getCompletedQuests: async (days: number = 30) => {
    const res = await fetch(`${API_URL}/quests/completed?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  refreshDailyQuests: async () => {
    const res = await fetch(`${API_URL}/quests/refresh-daily`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Dungeons
  getDungeons: async () => {
    const res = await fetch(`${API_URL}/dungeons`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getActiveDungeon: async () => {
    const res = await fetch(`${API_URL}/dungeons/active`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  startDungeon: async (dungeonId: number) => {
    const res = await fetch(`${API_URL}/dungeons/${dungeonId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  completeDungeon: async (progressId: number) => {
    const res = await fetch(`${API_URL}/dungeons/${progressId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Inventory
  getInventory: async () => {
    const res = await fetch(`${API_URL}/inventory`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  useItem: async (itemId: number) => {
    const res = await fetch(`${API_URL}/inventory/${itemId}/use`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Achievements
  getAchievements: async () => {
    const res = await fetch(`${API_URL}/achievements`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  checkAchievements: async () => {
    const res = await fetch(`${API_URL}/achievements/check`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Statistics
  getActivityStats: async (days: number = 30) => {
    const res = await fetch(`${API_URL}/statistics/activity?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getQuestStats: async () => {
    const res = await fetch(`${API_URL}/statistics/quests`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getCalendarData: async (year: number, month: number) => {
    const res = await fetch(`${API_URL}/statistics/calendar?year=${year}&month=${month}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getSummary: async () => {
    const res = await fetch(`${API_URL}/statistics/summary`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export default api;
