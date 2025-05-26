import React from 'react';
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

const ActivityCharts = ({ hourlyData, weeklyData, monthlyData, dailyData }) => {
  const { t } = useTranslation();

  const dayNames = [
    t('digest.charts.activity.sunday'),
    t('digest.charts.activity.monday'),
    t('digest.charts.activity.tuesday'),
    t('digest.charts.activity.wednesday'),
    t('digest.charts.activity.thursday'),
    t('digest.charts.activity.friday'),
    t('digest.charts.activity.saturday'),
  ];

  // Hourly activity chart
  const hourlyChartData = {
    labels: hourlyData?.map(item => `${item.hour_of_day}:00`) || [],
    datasets: [
      {
        label: t('digest.charts.activity.games'),
        data: hourlyData?.map(item => item.game_count) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
    ],
  };

  const hourlyOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: t('digest.charts.activity.hourly'),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('digest.charts.activity.hour')
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

  // Weekly activity chart
  const weeklyChartData = {
    labels: weeklyData?.map(item => dayNames[item.day_numeric]) || [],
    datasets: [
      {
        label: t('digest.charts.activity.games'),
        data: weeklyData?.map(item => item.game_count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const weeklyOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: t('digest.charts.activity.weekly'),
        font: {
          size: 16,
          weight: 'bold'
        }
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
  };

  // Daily activity chart (total_activity_by_day_of_month)
  const dailyChartData = dailyData ? {
    labels: dailyData.map(item => `${t('digest.charts.activity.day')} ${item.day_of_month}`),
    datasets: [
      {
        label: t('digest.charts.activity.games'),
        data: dailyData.map(item => item.game_count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
      },
    ],
  } : null;

  const dailyOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: t('digest.charts.activity.daily'),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('digest.charts.activity.dayOfMonth')
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
    <div className="activity-charts">
      {/* Daily Activity Chart (by day of month) */}
      {dailyData && dailyData.length > 0 && (
        <div className="chart-section">
          <div className="chart-container">
            <Bar data={dailyChartData} options={dailyOptions} />
          </div>
        </div>
      )}

      {/* Hourly Activity Chart */}
      <div className="chart-section">
        <div className="chart-container">
          <Bar data={hourlyChartData} options={hourlyOptions} />
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="chart-section">
        <div className="chart-container">
          <Bar data={weeklyChartData} options={weeklyOptions} />
        </div>
      </div>
    </div>
  );
};

export default ActivityCharts;
