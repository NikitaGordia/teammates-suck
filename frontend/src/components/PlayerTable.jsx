import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getScoreColor, SCORES } from '../utils/scoreUtils';

const PlayerTable = ({ players, onScoreChange, onRemovePlayer, onReorderPlayers, onRemoveAllPlayers }) => {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  // Handle drag start
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Create a copy of the players array
      const newPlayers = [...players];
      // Remove the dragged item
      const draggedItem = newPlayers.splice(draggedIndex, 1)[0];
      // Insert it at the new position
      newPlayers.splice(dragOverIndex, 0, draggedItem);
      // Call the callback to update the players array in the parent component
      onReorderPlayers(newPlayers);
    }
    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drag end (cleanup)
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="player-table">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.nickname')}</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.score')}</th>
            <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.winLoss')}</th>
            <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
              {players.length > 0 ? (
                <button
                  onClick={onRemoveAllPlayers}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'normal'
                  }}
                >
                  {t('players.removeAll')}
                </button>
              ) : (
                t('players.actions')
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {players.length > 0 ? (
            players.map((player, index) => (
              <tr
                key={index}
                draggable={true}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                style={{
                  cursor: 'grab',
                  backgroundColor: dragOverIndex === index ? '#f0f0f0' : 'transparent',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  transition: 'background-color 0.2s, opacity 0.2s'
                }}
              >
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', color: '#999', cursor: 'grab' }}>⋮⋮</span>
                    {player.nickname}
                  </div>
                </td>
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
                    {SCORES.map(score => (
                      <option
                        key={score}
                        value={score}
                        style={{ color: getScoreColor(score), fontWeight: 'bold' }}
                      >
                        {score}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                  {player.wins !== undefined && player.losses !== undefined ? (
                    <div style={{ display: 'inline-block', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{player.wins}</span>
                      <span style={{ margin: '0 2px' }}>/</span>
                      <span style={{ color: '#F44336', fontWeight: 'bold' }}>{player.losses}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                  )}
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
                <td style={{ padding: 0, border: 'none', textAlign: 'center' }}></td>
                <td style={{ padding: 0, border: 'none', textAlign: 'center', width: '100px' }}></td>
              </tr>
              {/* Message row */}
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic', borderBottom: '1px solid #ddd' }}>
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
