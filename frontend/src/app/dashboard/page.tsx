'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useSocket } from '@/lib/SocketContext';
import { Quest } from '@/lib/types';
import api from '@/lib/api';
import PlayerStatus from '@/components/PlayerStatus';
import QuestCard from '@/components/QuestCard';
import styles from './page.module.css';

export default function Dashboard() {
  const { player, refreshPlayer } = useAuth();
  const { activities } = useSocket();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const data = await api.getQuests();
      setQuests(data);
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestProgress = async (questId: number, progress: number) => {
    try {
      await api.updateQuestProgress(questId, progress);
      loadQuests();
      refreshPlayer();
    } catch (error) {
      console.error('Failed to update quest:', error);
    }
  };

  const handleQuestComplete = async (questId: number) => {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      await handleQuestProgress(questId, quest.target);
    }
  };

  const dailyQuests = quests.filter(q => q.quest_type === 'daily');
  const weeklyQuests = quests.filter(q => q.quest_type === 'weekly');
  const sideQuests = quests.filter(q => q.quest_type === 'side');

  if (!player) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, Hunter.</p>
        </div>
        <div className={styles.date}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <PlayerStatus player={player} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}></span>
                Daily Quests
              </h2>
              <span className={styles.badge}>{dailyQuests.length}</span>
            </div>
            <div className={styles.questList}>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`skeleton ${styles.skeletonCard}`} />
                ))
              ) : dailyQuests.length > 0 ? (
                dailyQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest}
                    onComplete={handleQuestComplete}
                    onProgress={handleQuestProgress}
                  />
                ))
              ) : (
                <p className={styles.empty}>No daily quests available</p>
              )}
            </div>
          </section>

          {weeklyQuests.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}></span>
                  Weekly Quests
                </h2>
                <span className={styles.badge}>{weeklyQuests.length}</span>
              </div>
              <div className={styles.questList}>
                {weeklyQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest}
                    onComplete={handleQuestComplete}
                    onProgress={handleQuestProgress}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className={styles.sideColumn}>
          <section className={styles.activityFeed}>
            <h3 className={styles.feedTitle}> Live Activity</h3>
            <div className={styles.feedList}>
              {activities.length > 0 ? (
                activities.slice(0, 10).map((activity, i) => (
                  <div key={i} className={styles.feedItem}>
                    <span className={styles.feedType}>
                      {activity.type === 'quest_completed' && ''}
                      {activity.type === 'level_up' && ''}
                      {activity.type === 'dungeon_completed' && ''}
                      {activity.type === 'rank_up' && ''}
                    </span>
                    <div className={styles.feedContent}>
                      <strong>{activity.player}</strong>
                      {activity.type === 'quest_completed' && ' completed a quest'}
                      {activity.type === 'level_up' && ` reached level ${activity.newLevel}`}
                      {activity.type === 'dungeon_completed' && ` cleared ${activity.dungeon}`}
                      {activity.type === 'rank_up' && ` ranked up to ${activity.newRank}`}
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.empty}>No recent activity</p>
              )}
            </div>
          </section>

          {sideQuests.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}></span>
                Side Quests
              </h3>
              <div className={styles.questList}>
                {sideQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest}
                    onComplete={handleQuestComplete}
                    onProgress={handleQuestProgress}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
