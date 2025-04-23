import React from 'react';

const BalanceButton = ({ onBalanceTeams, isLoading }) => {
  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      <button
        onClick={onBalanceTeams}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading ? '#9E9E9E' : '#673AB7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {isLoading ? (
          <>
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                borderTopColor: 'white',
                animation: 'spin 1s linear infinite',
                marginRight: '10px'
              }}
            />
            Balancing...
          </>
        ) : (
          'Balance Teams'
        )}
      </button>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BalanceButton;
