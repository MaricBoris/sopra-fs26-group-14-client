"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, message } from "antd";
import HomeButton from "@/components/HomeButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { UserStatistics } from "@/types/userStatistics";

export default function UserStatsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.statsId;
  const api = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: currentUserId } = useLocalStorage<string>("userId", "");

  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [hqLoaded, setHqLoaded] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    if (!token || !currentUserId) { router.push("/login"); return; }
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, userData] = await Promise.all([
          api.get<UserStatistics>(`/stats/user/${userId}`, token),
          api.get<{ username: string }>(`/users/${userId}`, token),
        ]);
        setStats(statsData);
        setUsername(userData.username ?? "");
      } catch (e) {
        message.error(`Failed to load statistics: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isMounted, token, currentUserId, userId, api, router]);

  if (!isMounted) return null;

  const winRate =
    stats && stats.gamesPlayed > 0
      ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1)
      : "0.0";

  const suddenDeathRate =
    stats && stats.suddenDeathEntries > 0
      ? ((stats.suddenDeathWins / stats.suddenDeathEntries) * 100).toFixed(1)
      : "0.0";

  const topGenre =
    stats && Object.keys(stats.winsByGenre ?? {}).length > 0
      ? Object.entries(stats.winsByGenre).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return (
    <div className="stats-page">
    
      <div
        className="stats-bg-lq"
        aria-hidden="true"
        style={{ backgroundImage: "url('/trees_lq.webp')" }}
      />
      <img
        src="/trees_hq.webp"
        alt=""
        aria-hidden="true"
        onLoad={() => setHqLoaded(true)}
        className="stats-bg-hq"
        style={{ opacity: hqLoaded ? 1 : 0 }}
      />

      <HomeButton />

      {/* Profile button top-right, same as home page */}
      {token && currentUserId && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
          <Button
            className="profile-nav-btn"
            onClick={() => router.push(`/users/${currentUserId}`)}
            style={{ width: 104, height: 50, fontSize: 18, padding: 0 }}
          >
            Profile
          </Button>
        </div>
      )}

      <div className="stats-title-wrap">
        <h1 className="stats-title">PLAYER STATS</h1>
        <div className="results-title-divider stats-divider">◆</div>
      </div>

      <div className="stats-stage">
        {loading ? (
          <div className="stats-loading">
            <span className="stats-loading-dot" />
            <span className="stats-loading-dot" />
            <span className="stats-loading-dot" />
          </div>
        ) : stats ? (
          <>
            {/* Username — plain text, no circle */}
            {username && (
              <div className="stats-username">{username}</div>
            )}

            <div className="stats-section-label">GENERAL</div>
            <div className="stats-grid">
              <StatCard label="GAMES PLAYED" value={stats.gamesPlayed} />
              <StatCard label="WINS" value={stats.gamesWon} />
              <StatCard label="LOSSES" value={stats.gamesLost} />
              <StatCard label="WIN RATE" value={`${winRate}%`} />
            </div>

            <div className="stats-section-label">STREAKS</div>
            <div className="stats-grid">
              <StatCard label="CURRENT STREAK" value={stats.currentWinStreak} accent={stats.currentWinStreak > 0} />
              <StatCard label="BEST STREAK" value={stats.highestWinStreak} />
            </div>

            <div className="stats-section-label">ROLE</div>
            <div className="stats-grid">
              <StatCard label="WINS AS WRITER" value={stats.winsAsWriter} />
              <StatCard label="WINS AS JUDGE" value={stats.winsAsJudge} />
              <StatCard label="VOTES CAST" value={stats.totalVotesCast} />
              <StatCard label="UNANIMOUS WINS" value={stats.unanimousWins} />
            </div>

            <div className="stats-section-label">SUDDEN DEATH</div>
            <div className="stats-grid">
              <StatCard label="ENTRIES" value={stats.suddenDeathEntries} />
              <StatCard label="WINS" value={stats.suddenDeathWins} />
              <StatCard label="SURVIVAL RATE" value={`${suddenDeathRate}%`} />
            </div>

            <div className="stats-section-label">LITERARY</div>
            <div className="stats-grid">
              <StatCard label="WORDS WRITTEN" value={stats.totalWordsWritten.toLocaleString()} wide />
              {topGenre && <StatCard label="TOP GENRE" value={topGenre} wide />}
            </div>

            {stats.winsByGenre && Object.keys(stats.winsByGenre).length > 0 && (
              <>
                <div className="stats-section-label">WINS BY GENRE</div>
                <div className="stats-genre-list">
                  {Object.entries(stats.winsByGenre)
                    .sort((a, b) => b[1] - a[1])
                    .map(([genre, count]) => (
                      <div key={genre} className="stats-genre-row">
                        <span className="stats-genre-name">{genre}</span>
                        <div className="stats-genre-bar-wrap">
                          <div
                            className="stats-genre-bar"
                            style={{
                              width: `${(count / Math.max(...Object.values(stats.winsByGenre))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="stats-genre-count">{count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="stats-empty">No statistics found.</div>
        )}

      </div>

      <style>{`
        .stats-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem 4rem;
          position: relative;
        }
        .stats-bg-lq,
        .stats-bg-hq {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          pointer-events: none;
        }
        .stats-bg-lq {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .stats-bg-hq {
          object-fit: cover;
          object-position: center;
          transition: opacity 400ms ease-in;
        }
        .stats-title-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 2rem 0 0.5rem;
        }
        .stats-title-wrap .results-title-divider {
          position: static;
          top: auto;
          left: auto;
          transform: none;
          margin-top: 0.25rem;
        }
        .stats-title {
          font-family: var(--font-display);
          font-size: clamp(26px, 5vh, 38px);
          letter-spacing: 8px;
          color: var(--gold-warm);
          text-shadow: 0 0 24px rgba(232, 216, 150, 0.55), 0 0 8px rgba(0, 0, 0, 0.8);
          margin: 0;
          text-align: center;
        }
        .stats-stage {
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }
        .stats-username {
          font-family: var(--font-cinzel), serif;
          font-size: 1.6rem;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 24px rgba(232, 216, 150, 0.55), 0 0 8px rgba(0, 0, 0, 0.8);
        }
        .stats-section-label {
          font-family: var(--font-cinzel), serif;
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          opacity: 0.7;
          align-self: flex-start;
          margin-top: 0.5rem;
          text-shadow: 0 0 24px rgba(232, 216, 150, 0.55), 0 0 8px rgba(0, 0, 0, 0.8);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          width: 100%;
        }
        .stats-card {
          background: rgba(10, 14, 40, 0.55);
          border: 1px solid rgba(212, 175, 93, 0.25);
          border-radius: 4px;
          padding: 1.1rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          text-align: center;
          backdrop-filter: blur(2px);
        }
        .stats-card.wide { grid-column: span 2; }
        .stats-card.accent { border-color: rgba(255,200,80,0.5); }
        .stats-card-label {
          font-family: var(--font-cinzel), serif;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          opacity: 0.5;
        }
        .stats-card-value {
          font-family: var(--font-cinzel), serif;
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1;
        }
        .stats-card.accent .stats-card-value { color: rgb(255,200,80); }
        .stats-genre-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .stats-genre-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-cinzel), serif;
        }
        .stats-genre-name {
          width: 90px;
          flex-shrink: 0;
          opacity: 0.7;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
        }
        .stats-genre-bar-wrap {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .stats-genre-bar {
          height: 100%;
          background: rgba(255,200,80,0.7);
          border-radius: 2px;
        }
        .stats-genre-count {
          width: 24px;
          text-align: right;
          opacity: 0.6;
          font-size: 0.7rem;
        }
        .stats-loading {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
        }
        .stats-loading-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
          animation: statsPulse 1.2s ease-in-out infinite;
        }
        .stats-loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .stats-loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes statsPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 0.8; transform: scale(1); }
        }
        .stats-empty {
          font-family: var(--font-cinzel), serif;
          opacity: 0.5;
          letter-spacing: 0.1em;
          padding: 2rem 0;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
  wide = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`stats-card${accent ? " accent" : ""}${wide ? " wide" : ""}`}>
      <div className="stats-card-label">{label}</div>
      <div className="stats-card-value">{value ?? "—"}</div>
    </div>
  );
}