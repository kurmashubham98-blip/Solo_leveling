'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useSocket } from '@/lib/SocketContext';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', icon: '', label: 'Dashboard' },
  { href: '/quests', icon: '', label: 'Quests' },
  { href: '/dungeons', icon: '', label: 'Dungeons' },
  { href: '/inventory', icon: '', label: 'Inventory' },
  { href: '/achievements', icon: '', label: 'Achievements' },
  { href: '/statistics', icon: '', label: 'Statistics' },
  { href: '/leaderboard', icon: '', label: 'Leaderboard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { player, logout } = useAuth();
  const { onlinePlayers } = useSocket();

  const getRankClass = (rankName?: string) => {
    if (!rankName) return 'e-rank';
    const rank = rankName.toLowerCase().replace('-rank', '').replace(' ', '-');
    return rank;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}></span>
        <span className={styles.logoText}>
          <span className="text-gradient">ARISE</span>
        </span>
      </div>

      {player && (
        <div className={styles.playerCard}>
          <div className={styles.playerAvatar}>
            {player.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{player.username}</span>
            <span className={`rank-badge ${getRankClass(player.rank_name)}`}>
              {player.rank_name || 'E-Rank'}
            </span>
          </div>
          <div className={styles.playerLevel}>Lv.{player.level}</div>
        </div>
      )}

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.onlineStatus}>
          <span className={styles.onlineDot}></span>
          <span>{onlinePlayers} players online</span>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </aside>
  );
}
