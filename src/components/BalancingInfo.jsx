import React from 'react';

const BalancingInfo = () => {
  const statusInfo = [
    { score: 4, description: 'Positive balance' },
    { score: 3, description: 'No need to be balanced' },
    { score: 2, description: 'Moderate balance' },
    { score: 1, description: 'Needs to be significantly balanced' },
    { score: 0, description: 'Unbalanceable' },
    { score: -1, description: 'Ban' }
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>Balancing Status</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd', width: '60px' }}>Score</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {statusInfo.map((status, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
              <td style={{ 
                textAlign: 'center', 
                padding: '8px', 
                borderBottom: '1px solid #ddd',
                fontWeight: 'bold',
                color: getScoreColor(status.score)
              }}>
                {status.score}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
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
