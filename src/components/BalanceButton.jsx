import React from 'react';

const BalanceButton = ({ onBalanceTeams, isLoading, randomness, onRandomnessChange }) => {
  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      {/* Container for button and slider in a row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Balance button */}
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
            width: '48%',
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

        {/* Randomness slider container */}
        <div style={{ width: '48%' }}>
          <div style={{ marginBottom: '5px' }}>
            <label
              htmlFor="randomness-slider"
              style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}
            >
              Randomness: {randomness}%
            </label>
          </div>
          <input
            id="randomness-slider"
            type="range"
            min="0"
            max="100"
            value={randomness}
            onChange={(e) => onRandomnessChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              appearance: 'none',
              backgroundColor: '#e0e0e0',
              outline: 'none',
              opacity: isLoading ? '0.7' : '1',
              transition: 'opacity 0.2s',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={isLoading}
          />
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Custom slider styling */
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #673AB7;
          cursor: pointer;
          transition: background 0.15s ease-in-out;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        input[type=range]::-webkit-slider-thumb:hover {
          background: #7E57C2;
        }

        input[type=range]::-webkit-slider-thumb:active {
          background: #5E35B1;
        }

        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #673AB7;
          cursor: pointer;
          transition: background 0.15s ease-in-out;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        input[type=range]::-moz-range-thumb:hover {
          background: #7E57C2;
        }

        input[type=range]::-moz-range-thumb:active {
          background: #5E35B1;
        }

        input[type=range]::-ms-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #673AB7;
          cursor: pointer;
          transition: background 0.15s ease-in-out;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default BalanceButton;
