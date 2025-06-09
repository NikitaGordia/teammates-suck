import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getScoreColor, getScoreTextColor } from '../utils/scoreUtils';
import './LeaderboardModal.css';

const LeaderboardModal = ({ isOpen, onClose, leaderboardData, digestData, isLoading, error }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Process leaderboard data
  const processLeaderboardData = (data, digest) => {
    if (!data || !data.users) return [];

    // Create a map of players with status changes from digest
    const statusChanges = {};
    if (digest && digest.players_for_status_change) {
      digest.players_for_status_change.forEach(player => {
        statusChanges[player.nickname] = {
          status: player.status.toLowerCase(), // 'promote' or 'demote'
          emoji: player.status.toLowerCase() === 'promote' ? '⬆️' : '⬇️'
        };
      });
    }

    const players = Object.entries(data.users).map(([nickname, stats]) => {
      const totalGames = stats.wins + stats.losses;
      const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;

      return {
        nickname,
        score: stats.score,
        wins: stats.wins,
        losses: stats.losses,
        totalGames,
        winRate,
        statusChange: statusChanges[nickname] || null
      };
    });

    // Sort by score (rank) first, then by win rate
    players.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher score first
      }
      return b.winRate - a.winRate; // Higher win rate first
    });

    // Add placement and percentile
    return players.map((player, index) => ({
      ...player,
      placement: index + 1,
      percentile: players.length > 0 ? Math.round(((players.length - index) / players.length) * 100) : 0
    }));
  };

  if (!isOpen) return null;

  const processedData = leaderboardData ? processLeaderboardData(leaderboardData, digestData) : [];

  return (
    <div className="leaderboard-modal-overlay">
      <div className="leaderboard-modal-container" ref={modalRef}>
        <div className="leaderboard-modal-header">
          <h2>🏆 {t('leaderboard.title')}</h2>
          <button className="leaderboard-modal-close-button" onClick={onClose}>×</button>
        </div>

        <div className="leaderboard-modal-content">
          {isLoading && (
            <div className="leaderboard-loading">
              <div className="loading-spinner"></div>
              <p>{t('leaderboard.loading')}</p>
            </div>
          )}

          {error && (
            <div className="leaderboard-error">
              <p>{t('leaderboard.error')}: {error}</p>
            </div>
          )}

          {!isLoading && !error && processedData.length === 0 && (
            <div className="leaderboard-no-data">
              <p>{t('leaderboard.noData')}</p>
            </div>
          )}

          {!isLoading && !error && processedData.length > 0 && (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>{t('leaderboard.placement')}</th>
                    <th>{t('leaderboard.rank')}</th>
                    <th>{t('leaderboard.nickname')}</th>
                    <th className="info-header">
                      {t('leaderboard.winRate')}
                      <span className="info-icon" title={t('leaderboard.winRateInfo')}>ℹ️</span>
                    </th>
                    <th className="info-header">
                      {t('leaderboard.totalGames')}
                      <span className="info-icon" title={t('leaderboard.totalGamesInfo')}>ℹ️</span>
                    </th>
                    <th>{t('leaderboard.percentile')}</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((player) => (
                    <tr key={player.nickname} className={player.statusChange ? `status-${player.statusChange.status}` : ''}>
                      <td className="placement-cell">#{player.placement}</td>
                      <td className="rank-cell">
                        <span
                          className="rank-badge"
                          style={{
                            backgroundColor: getScoreColor(player.score),
                            color: getScoreTextColor(player.score)
                          }}
                        >
                          {player.score}
                        </span>
                      </td>
                      <td className="nickname-cell">
                        {player.nickname}
                        {player.statusChange && (
                          <span
                            className={`status-arrow ${player.statusChange.status}`}
                            title={t(`leaderboard.${player.statusChange.status}`)}
                          >
                            {player.statusChange.emoji}
                          </span>
                        )}
                      </td>
                      <td className={`winrate-cell ${player.totalGames === 0 ? 'na-value' : ''}`}>
                        {player.totalGames > 0 ? `${player.winRate.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="totalgames-cell">{player.totalGames}</td>
                      <td className="percentile-cell">{player.percentile}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
