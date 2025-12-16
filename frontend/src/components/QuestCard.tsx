'use client';

import { Quest } from '@/lib/types';
import styles from './QuestCard.module.css';

interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: number) => void;
  onProgress: (questId: number, progress: number) => void;
}

export default function QuestCard({ quest, onComplete, onProgress }: QuestCardProps) {
  const progressPercent = (quest.progress / quest.target) * 100;
  
  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'var(--quest-daily)';
      case 'weekly': return 'var(--quest-weekly)';
      case 'side': return 'var(--quest-side)';
      case 'dungeon': return 'var(--quest-dungeon)';
      default: return 'var(--accent-primary)';
    }
  };

  const getIcon = (icon: string) => {
    const icons: Record<string, string> = {
      dumbbell: '', water: '', brain: '', sunrise: '',
      moon: '', book: '', meditation: '', food: '',
      trophy: '', lightbulb: '', users: '', running: '',
      target: '', flame: '', star: '',
    };
    return icons[icon] || '';
  };

  const handleIncrement = () => {
    if (quest.progress < quest.target) {
      const newProgress = quest.progress + 1;
      if (newProgress >= quest.target) {
        onComplete(quest.id);
      } else {
        onProgress(quest.id, newProgress);
      }
    }
  };

  return (
    <div 
      className={styles.card}
      style={{ '--quest-color': getQuestTypeColor(quest.quest_type) } as React.CSSProperties}
    >
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{getIcon(quest.icon)}</span>
        </div>
        <div className={styles.info}>
          <h3 className={styles.title}>{quest.title}</h3>
          <p className={styles.description}>{quest.description}</p>
        </div>
        <div className={styles.reward}>
          <span className={styles.xp}>+{quest.xp_reward}</span>
          <span className={styles.xpLabel}>XP</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className={styles.progressText}>
          <span>{quest.progress}/{quest.target}</span>
          {quest.stat_bonus_type && (
            <span className={styles.bonus}>+{quest.stat_bonus_amount} {quest.stat_bonus_type}</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <span className={styles.type}>{quest.quest_type}</span>
        {!quest.completed && (
          <button 
            className={styles.completeBtn}
            onClick={handleIncrement}
          >
            {quest.progress + 1 >= quest.target ? 'Complete' : '+1'}
          </button>
        )}
      </div>
    </div>
  );
}
