import React from 'react';
import { useTranslation } from 'react-i18next';
import { getScoreColor } from '../utils/scoreUtils';

// Import score icons
import scoreIcon4 from '../resources/icons/score_4.png';
import scoreIcon3 from '../resources/icons/score_3.png';
import scoreIcon2 from '../resources/icons/score_2.png';
import scoreIcon1 from '../resources/icons/score_1.png';
import scoreIcon0 from '../resources/icons/score_0.png';
import scoreIconMinus1 from '../resources/icons/score_-1.png';

const BalancingInfo = () => {
  const { t } = useTranslation();

  // Status information with descriptions and icons
  const statusInfo = [
    { score: 4, description: t('balance.score4'), icon: scoreIcon4 },
    { score: 3, description: t('balance.score3'), icon: scoreIcon3 },
    { score: 2, description: t('balance.score2'), icon: scoreIcon2 },
    { score: 1, description: t('balance.score1'), icon: scoreIcon1 },
    { score: 0, description: t('balance.score0'), icon: scoreIcon0 },
    { score: -1, description: t('balance.scoreMinus1'), icon: scoreIconMinus1 }
  ];

  return (
    <div style={{ marginBottom: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #ddd', width: '80px' }}>{t('players.score')}</th>
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
                fontSize: '16px',
                color: getScoreColor(status.score)
              }}>
                {status.score}
              </td>
              <td style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                color: '#555'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={status.icon}
                    alt={`Score ${status.score}`}
                    style={{
                      width: '28px',
                      height: '28px',
                      marginRight: '10px'
                    }}
                  />
                  {status.description}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



export default BalancingInfo;
