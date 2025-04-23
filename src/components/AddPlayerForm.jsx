import React, { useState } from 'react';

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

const AddPlayerForm = ({ onAddPlayer }) => {
  const [nickname, setNickname] = useState('');
  const [score, setScore] = useState(3); // Default score

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      onAddPlayer({ nickname, score: Number(score) });
      setNickname('');
      setScore(3);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <form onSubmit={handleSubmit}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  required
                />
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                <select
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: `1px solid ${getScoreColor(score)}`,
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    color: getScoreColor(score),
                    fontWeight: 'bold'
                  }}
                  required
                >
                  <option value="-1" style={{ color: getScoreColor(-1), fontWeight: 'bold' }}>-1</option>
                  <option value="0" style={{ color: getScoreColor(0), fontWeight: 'bold' }}>0</option>
                  <option value="1" style={{ color: getScoreColor(1), fontWeight: 'bold' }}>1</option>
                  <option value="2" style={{ color: getScoreColor(2), fontWeight: 'bold' }}>2</option>
                  <option value="3" style={{ color: getScoreColor(3), fontWeight: 'bold' }}>3</option>
                  <option value="4" style={{ color: getScoreColor(4), fontWeight: 'bold' }}>4</option>
                </select>
              </td>
              <td style={{ padding: '8px', textAlign: 'center', width: '100px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#4CAF50', /* Green color for Add button */
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    width: '80px'
                  }}
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default AddPlayerForm;
