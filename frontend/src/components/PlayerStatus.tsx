'use client';

import { Player } from '@/lib/types';
import XPBar from './XPBar';
import styles from './PlayerStatus.module.css';

interface PlayerStatusProps {
  player: Player;
}

export default function PlayerStatus({ player }: PlayerStatusProps) {
  const baseXP = 100;
  const xpForNextLevel = baseXP + Math.pow(player.level, 3);

  const getRankClass = (rankName?: string) => {
    if (!rankName) return 'e-rank';
    return rankName.toLowerCase().replace('-rank', '').replace(' ', '-');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <span className={styles.avatarLetter}>
            {player.username.charAt(0).toUpperCase()}
          </span>
          <div className={styles.avatarGlow} />
        </div>
        <div className={styles.info}>
          <h2 className={styles.username}>{player.username}</h2>
          <div className={styles.badges}>
            <span className={`rank-badge ${getRankClass(player.rank_name)}`}>
              {player.rank_name || 'E-Rank'}
            </span>
            <span className={styles.streak}>
               {player.streak_days} day streak
            </span>
          </div>
        </div>
      </div>

      <div className={styles.xpSection}>
        <XPBar 
          currentXP={player.xp}
          xpForNextLevel={xpForNextLevel}
          level={player.level}
        />
      </div>

      {player.stats && (
        <div className={styles.stats}>
          <div className={`stat-item ${styles.strength}`}>
            <div className="stat-icon strength"></div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{player.stats.strength}</span>
              <span className={styles.statLabel}>STR</span>
            </div>
          </div>
          <div className={`stat-item ${styles.agility}`}>
            <div className="stat-icon agility"></div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{player.stats.agility}</span>
              <span className={styles.statLabel}>AGI</span>
            </div>
          </div>
          <div className={`stat-item ${styles.intelligence}`}>
            <div className="stat-icon intelligence"></div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{player.stats.intelligence}</span>
              <span className={styles.statLabel}>INT</span>
            </div>
          </div>
          <div className={`stat-item ${styles.vitality}`}>
            <div className="stat-icon vitality"></div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{player.stats.vitality}</span>
              <span className={styles.statLabel}>VIT</span>
            </div>
          </div>
          <div className={`stat-item ${styles.luck}`}>
            <div className="stat-icon luck"></div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{player.stats.luck}</span>
              <span className={styles.statLabel}>LCK</span>
            </div>
          </div>
          {player.stats.stat_points > 0 && (
            <div className={styles.statPoints}>
              <span>+{player.stats.stat_points} points available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
