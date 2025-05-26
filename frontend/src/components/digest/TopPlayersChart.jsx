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

const TopPlayersChart = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="chart-section">
        <h3>{t('digest.charts.topPlayers.title')}</h3>
        <div className="no-data-message">
          {t('digest.charts.topPlayers.noData')}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(player => player.nickname),
    datasets: [
      {
        label: t('digest.charts.topPlayers.gamesCount'),
        data: data.map(player => player.game_count),
        backgroundColor: [
          'rgba(255, 206, 84, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
        ],
        borderColor: [
          'rgba(255, 206, 84, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: t('digest.charts.topPlayers.title'),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} ${t('digest.charts.activity.games').toLowerCase()}`;
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
          text: t('digest.charts.topPlayers.gamesCount')
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="chart-section">
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
      <div className="digest-top-players-list">
        {data.slice(0, 5).map((player, index) => (
          <div key={index} className="digest-top-player-item">
            <span className="digest-rank">#{index + 1}</span>
            <span className="digest-top-player-name">{player.nickname}</span>
            <span className="digest-game-count">{player.game_count} {t('digest.charts.activity.games').toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPlayersChart;
