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

function convertHoursUtcToLocal(hourlyDataUTC) {
  if (!hourlyDataUTC || hourlyDataUTC.length === 0) {
    return [];
  }

  // Use a consistent reference date for UTC to local conversion.
  // The specific date doesn't affect the hour conversion itself,
  // but provides the necessary context for the Date object.
  const refDate = new Date();
  const refYear = refDate.getUTCFullYear();
  const refMonth = refDate.getUTCMonth(); // 0-11
  const refDay = refDate.getUTCDate();

  const transformedList = hourlyDataUTC
    .map(item => {
      const utcHourString = item.hour_of_day;
      const gameCount = item.game_count || 0; // Default to 0 if undefined

      const utcHour = parseInt(utcHourString, 10);

      // Validate the parsed UTC hour
      if (isNaN(utcHour) || utcHour < 0 || utcHour > 23) {
        console.warn(`Invalid UTC hour_of_day encountered: "${utcHourString}". Skipping this item.`);
        return null; // Mark for filtering
      }

      // Create a Date object representing the specific UTC hour on the reference date
      const dateInUtc = new Date(Date.UTC(refYear, refMonth, refDay, utcHour, 0, 0));

      // .getHours() will return the hour in the browser's local timezone (as a number 0-23)
      const localHourNumber = dateInUtc.getHours();

      return {
        hour_of_day: String(localHourNumber).padStart(2, '0'), // Format as "HH" string
        game_count: gameCount
      };
    })
    .filter(item => item !== null); // Remove items that were marked as null due to invalid hour

  // Sort the resulting list by the local hour_of_day
  transformedList.sort((a, b) => a.hour_of_day.localeCompare(b.hour_of_day));

  return transformedList;
}

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

  const localHourlyData = convertHoursUtcToLocal(hourlyData);

  // Hourly activity chart
  const hourlyChartData = {
    labels: localHourlyData?.map(item => `${item.hour_of_day}:00`) || [],
    datasets: [
      {
        label: t('digest.charts.activity.games'),
        data: localHourlyData?.map(item => item.game_count) || [],
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
