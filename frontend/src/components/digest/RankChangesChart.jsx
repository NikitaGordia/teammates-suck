import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RankChangesChart = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="chart-section">
        <h3>{t('digest.charts.rankChanges.title')}</h3>
        <div className="no-data-message">
          {t('digest.charts.rankChanges.noChanges')}
        </div>
      </div>
    );
  }

  // Sort data by win rate in descending order
  const sortedData = [...data].sort((a, b) => b.win_rate_percentage - a.win_rate_percentage);

  const chartData = {
    labels: sortedData.map(player => player.nickname),
    datasets: [
      {
        label: t('digest.charts.rankChanges.gamesPlayed'),
        data: sortedData.map(player => player.total_games_played),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: t('digest.charts.rankChanges.wonGames'),
        data: sortedData.map(player => player.wins),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      }
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('digest.charts.rankChanges.title'),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const dataIndex = context.dataIndex;
            const player = sortedData[dataIndex];
            const statusEmoji = player.status.toLowerCase() === 'promote' ? '📈' : '📉';
            return [
              `${t('digest.charts.rankChanges.status')}: ${statusEmoji} ${t(`digest.charts.rankChanges.${player.status.toLowerCase()}`)}`,
              `${player.wins}W / ${player.losses}L`,
              `${t('digest.charts.rankChanges.winRate')}: ${player.win_rate_percentage.toFixed(1)}%`,
              `${t('digest.charts.rankChanges.currentScore')}: ${player.current_score || t('digest.charts.activity.notAvailable')}`,
              `${t('digest.charts.rankChanges.newScore')}: ${player.new_score || t('digest.charts.activity.notAvailable')}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('digest.charts.activity.players')
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
  };

  return (
    <div className="chart-section">
      <div className="digest-rank-changes-info">
        {sortedData.map((player, index) => {
          const statusEmoji = player.status.toLowerCase() === 'promote' ? '📈' : '📉';
          return (
            <div key={index} className={`digest-rank-change-card ${player.status.toLowerCase()}`}>
              <div className="digest-player-header">
                <div className="digest-player-name">{player.nickname}</div>
                <div className="digest-status-badge">
                  {statusEmoji} {t(`digest.charts.rankChanges.${player.status.toLowerCase()}`)}
                </div>
              </div>
              <div className="digest-player-stats">
                <div className="digest-stat-item">
                  <span className="digest-stat-label">{t('digest.charts.rankChanges.winRate')}:</span>
                  <span className="digest-stat-value">{player.win_rate_percentage.toFixed(1)}%</span>
                </div>
                <div className="digest-stat-item">
                  <span className="digest-stat-label">{t('digest.charts.rankChanges.gamesPlayed')}:</span>
                  <span className="digest-stat-value">{player.total_games_played}</span>
                </div>
              </div>
              <div className="digest-score-change">
                <div className="digest-score-item current">
                  <span className="digest-score-label">{t('digest.charts.rankChanges.currentScore')}:</span>
                  <span className="digest-score-value">{player.current_score || t('digest.charts.activity.notAvailable')}</span>
                </div>
                <div className="digest-score-arrow">→</div>
                <div className="digest-score-item new">
                  <span className="digest-score-label">{t('digest.charts.rankChanges.newScore')}:</span>
                  <span className="digest-score-value">{player.new_score || t('digest.charts.activity.notAvailable')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default RankChangesChart;
