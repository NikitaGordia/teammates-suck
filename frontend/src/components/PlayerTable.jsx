import React from 'react';
import { useTranslation } from 'react-i18next';

// Helper function to get color based on score
const getScoreColor = (score) => {
  switch (Number(score)) {
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

const PlayerTable = ({ players, onScoreChange, onRemovePlayer }) => {
  const { t } = useTranslation();
  return (
    <div className="player-table">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.nickname')}</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.score')}</th>
            <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {players.length > 0 ? (
            players.map((player, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{player.nickname}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  <select
                    value={player.score}
                    onChange={(e) => onScoreChange(index, Number(e.target.value))}
                    style={{
                      padding: '5px',
                      borderRadius: '3px',
                      border: `1px solid ${getScoreColor(player.score)}`,
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      color: getScoreColor(player.score),
                      fontWeight: 'bold'
                    }}
                  >
                    <option value="-1" style={{ color: getScoreColor(-1), fontWeight: 'bold' }}>-1</option>
                    <option value="0" style={{ color: getScoreColor(0), fontWeight: 'bold' }}>0</option>
                    <option value="1" style={{ color: getScoreColor(1), fontWeight: 'bold' }}>1</option>
                    <option value="2" style={{ color: getScoreColor(2), fontWeight: 'bold' }}>2</option>
                    <option value="3" style={{ color: getScoreColor(3), fontWeight: 'bold' }}>3</option>
                    <option value="4" style={{ color: getScoreColor(4), fontWeight: 'bold' }}>4</option>
                  </select>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', width: '100px' }}>
                  <button
                    onClick={() => onRemovePlayer(index)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      width: '80px'
                    }}
                  >
                    {t('players.remove')}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <>
              {/* Empty row to maintain column structure */}
              <tr style={{ height: 0, visibility: 'hidden' }}>
                <td style={{ padding: 0, border: 'none' }}></td>
                <td style={{ padding: 0, border: 'none', textAlign: 'right' }}></td>
                <td style={{ padding: 0, border: 'none', textAlign: 'center', width: '100px' }}></td>
              </tr>
              {/* Message row */}
              <tr>
                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic', borderBottom: '1px solid #ddd' }}>
                  {t('players.noPlayersYet')}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerTable;
