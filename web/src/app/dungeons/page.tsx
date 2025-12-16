'use client';

import { useEffect, useState } from 'react';
import { Dungeon, DungeonProgress } from '@/lib/types';
import api from '@/lib/api';
import styles from './page.module.css';

export default function Dungeons() {
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [activeDungeon, setActiveDungeon] = useState<DungeonProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dungeonsData, activeData] = await Promise.all([
        api.getDungeons(),
        api.getActiveDungeon()
      ]);
      setDungeons(dungeonsData);
      setActiveDungeon(activeData);
    } catch (error) {
      console.error('Failed to load dungeons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (dungeonId: number) => {
    try {
      await api.startDungeon(dungeonId);
      loadData();
    } catch (error) {
      console.error('Failed to start dungeon:', error);
    }
  };

  const getDifficultyColor = (diff: string) => {
    const colors: Record<string, string> = {
      'E': 'var(--rank-e)',
      'D': 'var(--rank-d)',
      'C': 'var(--rank-c)',
      'B': 'var(--rank-b)',
      'A': 'var(--rank-a)',
      'S': 'var(--rank-s)',
    };
    return colors[diff] || 'var(--text-muted)';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}> Dungeons</h1>
        <p className={styles.subtitle}>Enter the gates and prove your strength</p>
      </header>

      {activeDungeon && (
        <div className={styles.activeSection}>
          <h2> Active Dungeon</h2>
          <div className={styles.activeCard}>
            <div 
              className={styles.difficulty}
              style={{ background: `${getDifficultyColor(activeDungeon.difficulty)}20`, color: getDifficultyColor(activeDungeon.difficulty) }}
            >
              {activeDungeon.difficulty}-Rank
            </div>
            <h3>{activeDungeon.name}</h3>
            <p>Progress: {activeDungeon.quests_completed} quests completed</p>
            <div className={styles.timer}>
               Time remaining: {Math.floor((activeDungeon.time_remaining || 0) / 3600000)}h {Math.floor(((activeDungeon.time_remaining || 0) % 3600000) / 60000)}m
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))
        ) : (
          dungeons.map(dungeon => (
            <div 
              key={dungeon.id} 
              className={`dungeon-card ${styles.card}`}
            >
              <div className="dungeon-header">
                <div 
                  className="dungeon-difficulty"
                  style={{ 
                    background: `${getDifficultyColor(dungeon.difficulty)}20`, 
                    color: getDifficultyColor(dungeon.difficulty) 
                  }}
                >
                  {dungeon.difficulty}-Rank
                </div>
                <h3 className={styles.dungeonName}>{dungeon.name}</h3>
                <p className={styles.dungeonDesc}>{dungeon.description}</p>
              </div>
              <div className={styles.dungeonBody}>
                <div className={styles.dungeonStats}>
                  <span> {dungeon.quest_count} quests</span>
                  <span> {dungeon.time_limit_hours}h limit</span>
                  <span>Lv.{dungeon.required_level} required</span>
                </div>
                <div className={styles.reward}>
                  <span className={styles.xp}>+{dungeon.xp_reward.toLocaleString()} XP</span>
                  {dungeon.rewards?.stat_points && (
                    <span>+{dungeon.rewards.stat_points} stat points</span>
                  )}
                </div>
                {dungeon.times_completed > 0 && (
                  <span className={styles.completed}> Cleared {dungeon.times_completed}x</span>
                )}
                {dungeon.unlocked && !activeDungeon && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStart(dungeon.id)}
                  >
                    Enter Gate
                  </button>
                )}
                {!dungeon.unlocked && (
                  <span className={styles.locked}> Requires Level {dungeon.required_level}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
