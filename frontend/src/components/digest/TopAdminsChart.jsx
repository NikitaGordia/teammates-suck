import React from 'react';
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

const TopAdminsChart = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="chart-section">
        <h3>{t('digest.charts.topAdmins.title')}</h3>
        <div className="no-data-message">
          {t('digest.charts.topAdmins.noData')}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(admin => admin.admin_name),
    datasets: [
      {
        label: t('digest.charts.topAdmins.gamesManaged'),
        data: data.map(admin => admin.distinct_games_count),
        backgroundColor: [
          'rgba(102, 187, 106, 0.8)',
          'rgba(66, 165, 245, 0.8)',
          'rgba(171, 71, 188, 0.8)',
          'rgba(255, 167, 38, 0.8)',
          'rgba(239, 83, 80, 0.8)',
        ],
        borderColor: [
          'rgba(102, 187, 106, 1)',
          'rgba(66, 165, 245, 1)',
          'rgba(171, 71, 188, 1)',
          'rgba(255, 167, 38, 1)',
          'rgba(239, 83, 80, 1)',
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
        text: t('digest.charts.topAdmins.title'),
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
          text: t('digest.charts.activity.admins')
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: t('digest.charts.topAdmins.gamesManaged')
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
      <div className="digest-top-admins-list">
        {data.map((admin, index) => (
          <div key={index} className="digest-top-admin-item">
            <span className="digest-rank">#{index + 1}</span>
            <span className="digest-top-admin-name">{admin.admin_name}</span>
            <span className="digest-games-managed">
              {admin.distinct_games_count} {t('digest.charts.activity.games').toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopAdminsChart;
