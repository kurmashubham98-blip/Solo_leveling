'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from './page.module.css';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await api.login(email, password);
      } else {
        response = await api.register(username, email, password);
      }

      if (response.token) {
        localStorage.setItem('token', response.token);
        router.push('/dashboard');
      } else {
        setError(response.error || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.background}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}></span>
            <h1 className={styles.logoText}>
              <span className="text-gradient">ARISE</span>
            </h1>
          </div>
          <p className={styles.tagline}>Level up your habits. Become a Hunter.</p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <span></span>
              <span>Complete Quests</span>
            </div>
            <div className={styles.feature}>
              <span></span>
              <span>Clear Dungeons</span>
            </div>
            <div className={styles.feature}>
              <span></span>
              <span>Track Progress</span>
            </div>
            <div className={styles.feature}>
              <span></span>
              <span>Rank Up</span>
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <button 
              className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`${styles.tab} ${!isLogin ? styles.activeTab : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <div className="input-group">
                <label className="input-label">Hunter Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your hunter name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button 
              type="submit" 
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                isLogin ? 'Enter the Gate' : 'Awaken'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
