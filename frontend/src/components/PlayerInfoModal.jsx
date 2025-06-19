import { useEffect, useRef } from 'react';
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
import annotationPlugin from 'chartjs-plugin-annotation';
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
  Legend,
  annotationPlugin
);

const PlayerInfoModal = ({ isOpen, onClose, playerData, isLoading, error, nickname }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

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

  // Calculate 30-day wins, losses, and win rate
  const calculate30DayStats = (winRateData, dailyData) => {
    // For the win rate, we use the single LAST VALUE from the winRateData list.
    // This is correct because it represents the 30-day rolling average ending today.
    const winRate = winRateData.winRates.slice(-1)[0] || 0;

    // For total wins and losses, we sum the entire list of daily results.
    // This is necessary to get the total over all 30 days.
    const wins = dailyData.wins.reduce((sum, current) => sum + current, 0);
    const losses = dailyData.losses.reduce((sum, current) => sum + current, 0);
    const totalGames = wins + losses;

    return {
      wins,
      losses,
      totalGames,
      winRate, // This is the last value from the other calculation.
    };
  };

  // Find recent rank changes within the last 30 days
  const findRecentRankChanges = (rankHistory) => {
    if (!rankHistory || rankHistory.length === 0) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return rankHistory.filter(change => {
      const changeDate = convertToLocalDate(change.change_date);
      return changeDate >= thirtyDaysAgo;
    });
  };

  const generateDailyActivityData = (gamesHistory) => {
    if (!gamesHistory?.length) return { labels: [], wins: [], losses: [] };

    const toYMD = (date) => new Date(date).toISOString().split('T')[0];

    // 1. Aggregate game stats by day using reduce for a compact summary
    const statsByDay = gamesHistory.reduce((stats, { game_datetime, win }) => {
      const dayKey = toYMD(game_datetime);
      const s = stats.get(dayKey) || { wins: 0, losses: 0 };
      win ? s.wins++ : s.losses++;
      stats.set(dayKey, s);
      return stats;
    }, new Map());

    // 2. Build the final chart data over the last 30 days
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i)); // Generate dates from 29 days ago to today
      return date;
    }).reduce((chartData, date) => {
      const { wins = 0, losses = 0 } = statsByDay.get(toYMD(date)) || {};
      chartData.labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      chartData.wins.push(wins);
      chartData.losses.push(losses);
      return chartData;
    }, { labels: [], wins: [], losses: [] });
  };

  const generateWinRateData = (gamesHistory) => {
    if (!gamesHistory?.length) return { labels: [], winRates: [] };

    const toYMD = (date) => new Date(date).toISOString().split('T')[0];

    // 1. Aggregate all game stats by day in a single pass
    const dailyStats = gamesHistory.reduce((stats, { game_datetime, win }) => {
      const dayKey = toYMD(game_datetime);
      const s = stats.get(dayKey) || { wins: 0, total: 0 };
      stats.set(dayKey, { wins: s.wins + (win ? 1 : 0), total: s.total + 1 });
      return stats;
    }, new Map());

    // 2. Create the date range for the last 30 days
    const chartDates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    // 3. For each date, calculate its 30-day rolling win rate
    const winRates = chartDates.map(endDate => {
      let windowWins = 0, windowTotal = 0;
      for (let j = 0; j < 30; j++) {
        const day = new Date(endDate);
        day.setDate(endDate.getDate() - j);
        const { wins = 0, total = 0 } = dailyStats.get(toYMD(day)) || {};
        windowWins += wins;
        windowTotal += total;
      }
      return windowTotal ? (windowWins / windowTotal) * 100 : 0;
    });
    
    return {
      labels: chartDates.map(d => `${d.getDate()}/${d.getMonth() + 1}`),
      winRates,
    };
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
  const thirtyDayStats = calculate30DayStats(winRateOverTime, dailyActivity);
  const recentRankChanges = findRecentRankChanges(playerData.rank_history);

  return (
    <div className="player-info-modal-overlay">
      <div className="player-info-modal-container" ref={modalRef}>
        <div className="player-info-modal-header">
          <h2>👤 {t('playerInfo.title')}</h2>
          <button className="player-info-modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="player-info-modal-content">
          {/* Fancy nickname display with 30-day stats */}
          <div className="player-info-nickname">
            <div className="nickname-container">
               <div className="nickname-stats">
                <h1 className="epic-nickname">{nickname}</h1>
                {playerData.score !== undefined && (
                    <div className="stats-item">
                      <span
                        className="rank-score-header"
                        style={{
                          backgroundColor: getScoreColor(playerData.score),
                          color: getScoreTextColor(playerData.score),
                        }}
                      >
                        {playerData.score}
                      </span>
                    </div>
                  )}
               </div>
              <div className="nickname-stats">
                <div className="stats-item">
                  <span className="stats-label">{t('playerInfo.stats.last30Days')}:</span>
                  <span className="stats-wins">{thirtyDayStats.wins}W</span>
                  <span className="stats-separator">/</span>
                  <span className="stats-losses">{thirtyDayStats.losses}L</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">{t('playerInfo.stats.winRate')}:</span>
                  <span className="stats-winrate">{thirtyDayStats.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
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
                      annotation: {
                        annotations: recentRankChanges.reduce((acc, change, index) => {
                          const changeDate = convertToLocalDate(change.change_date);
                          const dateLabel = `${changeDate.getDate()}/${changeDate.getMonth() + 1}`;
                          const labelIndex = dailyActivity.labels.indexOf(dateLabel);

                          if (labelIndex !== -1) {
                            acc[`rankChange${index}`] = {
                              type: 'point',
                              xValue: labelIndex,
                              yValue: 0,
                              backgroundColor: change.change_type === 'promotion' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
                              borderColor: change.change_type === 'promotion' ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)',
                              borderWidth: 2,
                              radius: 8,
                              label: {
                                content: change.change_type === 'promotion' ? '📈' : '📉',
                                enabled: true,
                                position: 'top'
                              }
                            };
                          }
                          return acc;
                        }, {})
                      }
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
                      annotation: {
                        annotations: {
                          // Demotion line at 40%
                          demotionLine: {
                            type: 'line',
                            yMin: 40,
                            yMax: 40,
                            borderColor: 'rgba(244, 67, 54, 0.8)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                              content: t('playerInfo.charts.demotionThreshold') + ' (40%)',
                              enabled: true,
                              position: 'end',
                              backgroundColor: 'rgba(244, 67, 54, 0.8)',
                              color: 'white',
                              font: {
                                size: 10
                              }
                            }
                          },
                          // Promotion line at 60%
                          promotionLine: {
                            type: 'line',
                            yMin: 60,
                            yMax: 60,
                            borderColor: 'rgba(76, 175, 80, 0.8)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                              content: t('playerInfo.charts.promotionThreshold') + ' (60%)',
                              enabled: true,
                              position: 'end',
                              backgroundColor: 'rgba(76, 175, 80, 0.8)',
                              color: 'white',
                              font: {
                                size: 10
                              }
                            }
                          },
                          // Rank change marks
                          ...recentRankChanges.reduce((acc, change, index) => {
                            const changeDate = convertToLocalDate(change.change_date);
                            const dateLabel = `${changeDate.getDate()}/${changeDate.getMonth() + 1}`;
                            const labelIndex = winRateOverTime.labels.indexOf(dateLabel);

                            if (labelIndex !== -1) {
                              const winRateAtDate = winRateOverTime.winRates[labelIndex] || 50;
                              acc[`rankChangeWinRate${index}`] = {
                                type: 'point',
                                xValue: labelIndex,
                                yValue: winRateAtDate,
                                backgroundColor: change.change_type === 'promotion' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
                                borderColor: change.change_type === 'promotion' ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)',
                                borderWidth: 2,
                                radius: 8,
                                label: {
                                  content: change.change_type === 'promotion' ? '📈' : '📉',
                                  enabled: true,
                                  position: 'top'
                                }
                              };
                            }
                            return acc;
                          }, {})
                        }
                      }
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
                      const teams = game.game_name.split('|VS|');
                      return (
                        <div key={index} className={`game-item ${game.win ? 'win' : 'loss'}`}>
                          <div className="game-details">
                              <span>
                                <div className="game-date">
                                  {gameDate.toLocaleDateString()} {gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>
                              </span>
                              <span className={`game-result ${game.win ? 'win' : 'loss'}`}>
                                {game.win ? '🏆' : '💔'} {t(`playerInfo.gamesHistory.${game.win ? 'win' : 'loss'}`)}
                              </span>
                              <span className="game-admin">
                                👤 {game.admin_name}
                              </span>
                            </div>
                          <div className="game-info">
                            <div className="game-name" title={game.game_name}>
                              {teams[0].length > 50 ? teams[0].substring(0, 50) + '...' : teams[0]}
                            </div>
                            VS
                            <div className="game-name" title={game.game_name}>
                              {teams[1].length > 50 ? teams[1].substring(0, 50) + '...' : teams[1]}
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