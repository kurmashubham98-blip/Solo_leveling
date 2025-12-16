'use client';

import { useEffect, useState } from 'react';
import { ActivityData } from '@/lib/types';
import api from '@/lib/api';
import styles from './page.module.css';

export default function Statistics() {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [activity, sum] = await Promise.all([
        api.getActivityStats(30),
        api.getSummary()
      ]);
      setActivityData(activity);
      setSummary(sum);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxXP = Math.max(...activityData.map(d => d.total_xp), 1);
  const totalXP = activityData.reduce((sum, d) => sum + d.total_xp, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}> Statistics</h1>
        <p className={styles.subtitle}>Track your progress and analyze your habits</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}></span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalXP.toLocaleString()}</span>
            <span className={styles.statLabel}>Total XP (30 days)</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}></span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{summary?.quests?.completed || 0}</span>
            <span className={styles.statLabel}>Quests Completed</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}></span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{summary?.dungeons?.completed || 0}</span>
            <span className={styles.statLabel}>Dungeons Cleared</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}></span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{summary?.player?.streak_days || 0}</span>
            <span className={styles.statLabel}>Day Streak</span>
          </div>
        </div>
      </div>

      <section className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>XP Progress (Last 30 Days)</h2>
        <div className={styles.chart}>
          {loading ? (
            <div className={`skeleton ${styles.skeletonGraph}`} />
          ) : (
            <div className={styles.barChart}>
              {activityData.map((day, i) => (
                <div key={i} className={styles.barWrapper}>
                  <div 
                    className={styles.bar}
                    style={{ 
                      height: `${(day.total_xp / maxXP) * 100}%`,
                      animationDelay: `${i * 30}ms`
                    }}
                  >
                    <span className={styles.barTooltip}>{day.total_xp} XP</span>
                  </div>
                  <span className={styles.barLabel}>
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Activity Heatmap</h2>
        <div className={styles.heatmap}>
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dayData = activityData.find(d => 
              new Date(d.date).toDateString() === date.toDateString()
            );
            const level = dayData 
              ? Math.min(4, Math.ceil((dayData.total_xp / maxXP) * 4))
              : 0;
            
            return (
              <div 
                key={i}
                className={`calendar-day level-${level}`}
                title={`${date.toLocaleDateString()}: ${dayData?.total_xp || 0} XP`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
