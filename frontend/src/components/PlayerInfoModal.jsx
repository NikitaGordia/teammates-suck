import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { getScoreColor, getScoreTextColor } from '../utils/scoreUtils';
import './PlayerInfoModal.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const PlayerInfoModal = ({ isOpen, onClose, playerData, isLoading, error, nickname }) => {
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

  // Convert UTC dates to local timezone
  const convertToLocalDate = (utcDateString) => {
    const utcDate = new Date(utcDateString + 'Z'); // Add Z to ensure UTC parsing
    return utcDate;
  };

  // Generate daily activity data for the last 30 days
  const generateDailyActivityData = (gamesHistory) => {
    if (!gamesHistory || gamesHistory.length === 0) return { labels: [], wins: [], losses: [] };

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dailyData = {};

    // Initialize all days with 0 wins and losses
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { wins: 0, losses: 0 };
    }

    // Count wins and losses for each day
    gamesHistory.forEach(game => {
      const gameDate = convertToLocalDate(game.game_datetime);
      const dateKey = gameDate.toISOString().split('T')[0];
      
      if (dailyData[dateKey]) {
        if (game.win) {
          dailyData[dateKey].wins++;
        } else {
          dailyData[dateKey].losses++;
        }
      }
    });

    const labels = Object.keys(dailyData).map(dateKey => {
      const date = new Date(dateKey);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const wins = Object.values(dailyData).map(day => day.wins);
    const losses = Object.values(dailyData).map(day => day.losses);

    return { labels, wins, losses };
  };

  // Generate win rate over time data
  const generateWinRateData = (gamesHistory) => {
    if (!gamesHistory || gamesHistory.length === 0) return { labels: [], winRates: [] };

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const winRateData = [];
    const labels = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      
      const windowStart = new Date(date);
      windowStart.setDate(date.getDate() - 30);
      
      const gamesInWindow = gamesHistory.filter(game => {
        const gameDate = convertToLocalDate(game.game_datetime);
        return gameDate >= windowStart && gameDate <= date;
      });

      let winRate = 0;
      if (gamesInWindow.length > 0) {
        const wins = gamesInWindow.filter(game => game.win).length;
        winRate = (wins / gamesInWindow.length) * 100;
      }

      labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      winRateData.push(winRate);
    }

    return { labels, winRates: winRateData };
  };

  if (!isOpen) return null;

  if (error) {
    return (
      <div className="player-info-modal-overlay">
        <div className="player-info-modal-container" ref={modalRef}>
          <div className="player-info-modal-header">
            <h2>❌ {t('playerInfo.error')}</h2>
            <button className="player-info-modal-close-button" onClick={onClose}>×</button>
          </div>
          <div className="player-info-modal-content">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="player-info-modal-overlay">
        <div className="player-info-modal-container" ref={modalRef}>
          <div className="player-info-modal-header">
            <h2>⏳ {t('playerInfo.loading')}</h2>
            <button className="player-info-modal-close-button" onClick={onClose}>×</button>
          </div>
          <div className="player-info-modal-content">
            <div className="player-info-loading">
              <div className="player-info-spinner"></div>
              <p>{t('playerInfo.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="player-info-modal-overlay">
        <div className="player-info-modal-container" ref={modalRef}>
          <div className="player-info-modal-header">
            <h2>ℹ️ {t('playerInfo.noInfo')}</h2>
            <button className="player-info-modal-close-button" onClick={onClose}>×</button>
          </div>
        </div>
      </div>
    );
  }

  const dailyActivity = generateDailyActivityData(playerData.games_history);
  const winRateOverTime = generateWinRateData(playerData.games_history);

  return (
    <div className="player-info-modal-overlay">
      <div className="player-info-modal-container" ref={modalRef}>
        <div className="player-info-modal-header">
          <h2>👤 {t('playerInfo.title')}</h2>
          <button className="player-info-modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="player-info-modal-content">
          {/* Fancy nickname display */}
          <div className="player-info-nickname">
            <h1 className="epic-nickname">{nickname}</h1>
          </div>

          {/* Charts section */}
          <div className="player-info-charts">
            {/* Daily activity chart */}
            <div className="chart-section">
              <h3>{t('playerInfo.charts.dailyActivity')}</h3>
              <div className="chart-container">
                <Bar
                  data={{
                    labels: dailyActivity.labels,
                    datasets: [
                      {
                        label: t('playerInfo.charts.wins'),
                        data: dailyActivity.wins,
                        backgroundColor: 'rgba(76, 175, 80, 0.8)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: t('playerInfo.charts.losses'),
                        data: dailyActivity.losses,
                        backgroundColor: 'rgba(244, 67, 54, 0.8)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 1,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: true,
                      },
                    },
                    scales: {
                      x: {
                        display: true,
                        title: {
                          display: true,
                          text: t('digest.charts.activity.day')
                        }
                      },
                      y: {
                        display: true,
                        title: {
                          display: true,
                          text: t('digest.charts.activity.games')
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Win rate over time chart */}
            <div className="chart-section">
              <h3>{t('playerInfo.charts.winRate')}</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: winRateOverTime.labels,
                    datasets: [
                      {
                        label: t('playerInfo.charts.winRateOverTime'),
                        data: winRateOverTime.winRates,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        display: true,
                        title: {
                          display: true,
                          text: t('digest.charts.activity.day')
                        }
                      },
                      y: {
                        display: true,
                        title: {
                          display: true,
                          text: t('playerInfo.charts.winRateOverTime') + ' (%)'
                        },
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Two sections: rank history and games history */}
          <div className="player-info-sections">
            {/* Rank History Section */}
            <div className="player-info-section">
              <h3>{t('playerInfo.sections.rankHistory')}</h3>
              <div className="rank-history-container">
                {playerData.rank_history && playerData.rank_history.length > 0 ? (
                  <div className="rank-history-list">
                    {playerData.rank_history.map((change, index) => {
                      const changeDate = convertToLocalDate(change.change_date);
                      const isPromotion = change.change_type === 'promotion';
                      return (
                        <div key={index} className={`rank-change-item ${change.change_type}`}>
                          <div className="rank-change-date">
                            {changeDate.toLocaleDateString()}
                          </div>
                          <div className="rank-change-info">
                            <div className="rank-change-type">
                              {isPromotion ? '📈' : '📉'} {t(`playerInfo.rankHistory.${change.change_type}`)}
                            </div>
                            <div className="rank-change-scores">
                              <span
                                className="rank-score old"
                                style={{
                                  backgroundColor: getScoreColor(change.old_rank),
                                  color: getScoreTextColor(change.old_rank)
                                }}
                              >
                                {change.old_rank}
                              </span>
                              <span className="rank-arrow">→</span>
                              <span
                                className="rank-score new"
                                style={{
                                  backgroundColor: getScoreColor(change.new_rank),
                                  color: getScoreTextColor(change.new_rank)
                                }}
                              >
                                {change.new_rank}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-data-message">
                    {t('playerInfo.rankHistory.noChanges')}
                  </div>
                )}
              </div>
            </div>

            {/* Games History Section */}
            <div className="player-info-section">
              <h3>{t('playerInfo.sections.gamesHistory')}</h3>
              <div className="games-history-container">
                {playerData.games_history && playerData.games_history.length > 0 ? (
                  <div className="games-history-list">
                    {playerData.games_history.slice(0, 20).map((game, index) => {
                      const gameDate = convertToLocalDate(game.game_datetime);
                      return (
                        <div key={index} className={`game-item ${game.win ? 'win' : 'loss'}`}>
                          <div className="game-date">
                            {gameDate.toLocaleDateString()} {gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="game-info">
                            <div className="game-name" title={game.game_name}>
                              {game.game_name.length > 50 ? game.game_name.substring(0, 50) + '...' : game.game_name}
                            </div>
                            <div className="game-details">
                              <span className={`game-result ${game.win ? 'win' : 'loss'}`}>
                                {game.win ? '🏆' : '💔'} {t(`playerInfo.gamesHistory.${game.win ? 'win' : 'loss'}`)}
                              </span>
                              <span className="game-admin">
                                👤 {game.admin_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {playerData.games_history.length > 20 && (
                      <div className="games-history-more">
                        ... {t('playerInfo.gamesHistory.andMore', { count: playerData.games_history.length - 20 })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data-message">
                    {t('playerInfo.gamesHistory.noGames')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfoModal;
