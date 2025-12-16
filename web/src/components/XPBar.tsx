'use client';

import { useEffect, useState } from 'react';
import styles from './XPBar.module.css';

interface XPBarProps {
  currentXP: number;
  xpForNextLevel: number;
  level: number;
  animated?: boolean;
}

export default function XPBar({ currentXP, xpForNextLevel, level, animated = true }: XPBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const progress = (currentXP / xpForNextLevel) * 100;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className={styles.container}>
      <div className={styles.levelBadge}>
        <span className={styles.levelNumber}>{level}</span>
      </div>
      <div className={styles.barWrapper}>
        <div className={styles.bar}>
          <div 
            className={styles.fill}
            style={{ width: `${displayProgress}%` }}
          />
          <div className={styles.shimmer} />
        </div>
        <div className={styles.xpText}>
          <span>{currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
          <span className={styles.toNext}>
            {(xpForNextLevel - currentXP).toLocaleString()} to next level
          </span>
        </div>
      </div>
      <div className={styles.nextLevel}>
        <span className={styles.nextNumber}>{level + 1}</span>
      </div>
    </div>
  );
}
