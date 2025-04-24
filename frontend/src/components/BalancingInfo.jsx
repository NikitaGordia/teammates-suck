import React from 'react';
import { useTranslation } from 'react-i18next';

const BalancingInfo = () => {
  const { t } = useTranslation();

  // Status information with descriptions
  const statusInfo = [
    { score: 4, description: t('balance.score4') },
    { score: 3, description: t('balance.score3') },
    { score: 2, description: t('balance.score2') },
    { score: 1, description: t('balance.score1') },
    { score: 0, description: t('balance.score0') },
    { score: -1, description: t('balance.scoreMinus1') }
  ];

  return (
    <div style={{ marginBottom: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #ddd', width: '60px' }}>{t('players.score')}</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' }}>{t('balance.description')}</th>
          </tr>
        </thead>
        <tbody>
          {statusInfo.map((status, index) => (
            <tr key={index} style={{
              backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
              transition: 'background-color 0.2s'
            }}>
              <td style={{
                textAlign: 'center',
                padding: '10px',
                borderBottom: '1px solid #ddd',
                fontWeight: 'bold',
                color: getScoreColor(status.score),
                fontSize: '16px'
              }}>
                {status.score}
              </td>
              <td style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                color: '#555'
              }}>
                {status.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to get color based on score
const getScoreColor = (score) => {
  switch (score) {
    case 4:
      return '#4CAF50'; // Green
    case 3:
      return '#8BC34A'; // Light Green
    case 2:
      return '#FFC107'; // Amber
    case 1:
      return '#FF9800'; // Orange
    case 0:
      return '#FF5722'; // Deep Orange
    case -1:
      return '#F44336'; // Red
    default:
      return '#000000'; // Black
  }
};

export default BalancingInfo;
