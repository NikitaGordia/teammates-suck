import React from 'react';

const BalanceButton = ({ onBalanceTeams }) => {
  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      <button
        onClick={onBalanceTeams}
        style={{
          padding: '12px 24px',
          backgroundColor: '#673AB7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        Balance Teams
      </button>
    </div>
  );
};

export default BalanceButton;
