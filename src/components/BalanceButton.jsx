import React, { useEffect, useRef } from 'react';

const BalanceButton = ({ onBalanceTeams, isLoading, randomness, onRandomnessChange }) => {
  const sliderRef = useRef(null);

  // Function to snap value to nearest fixed percentage
  const snapToFixedPercentage = (value) => {
    // Define the step size (5% increments)
    const step = 5;
    // Calculate the nearest step value
    return Math.round(value / step) * step;
  };

  // Handle slider change with snapping
  const handleSliderChange = (e) => {
    const rawValue = parseInt(e.target.value);
    const snappedValue = snapToFixedPercentage(rawValue);
    onRandomnessChange(snappedValue);
  };

  // Add tick marks to the slider track
  useEffect(() => {
    if (sliderRef.current) {
      const slider = sliderRef.current;
      const sliderWidth = slider.offsetWidth;

      // Remove any existing tick marks
      const existingTicks = document.querySelectorAll('.slider-tick');
      existingTicks.forEach(tick => tick.remove());

      // Create tick marks container
      const ticksContainer = document.createElement('div');
      ticksContainer.className = 'slider-ticks';
      ticksContainer.style.position = 'relative';
      ticksContainer.style.width = '100%';
      ticksContainer.style.height = '10px';
      ticksContainer.style.marginTop = '2px';

      // Add tick marks for each 5% increment
      for (let i = 0; i <= 100; i += 5) {
        const tick = document.createElement('div');
        tick.className = 'slider-tick';
        tick.style.position = 'absolute';
        tick.style.left = `${i}%`;
        tick.style.width = '1px';
        tick.style.height = i % 25 === 0 ? '8px' : '5px';
        tick.style.backgroundColor = '#999';
        tick.style.transform = 'translateX(-50%)';

        ticksContainer.appendChild(tick);
      }

      // Insert ticks after the slider
      slider.parentNode.insertBefore(ticksContainer, slider.nextSibling);
    }
  }, []);

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
          <div style={{ position: 'relative' }}>
            <input
              ref={sliderRef}
              id="randomness-slider"
              type="range"
              min="0"
              max="100"
              value={randomness}
              onChange={handleSliderChange}
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
          transition: background 0.15s ease-in-out, transform 0.1s ease-out;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        input[type=range]::-webkit-slider-thumb:hover {
          background: #7E57C2;
          transform: scale(1.1);
        }

        input[type=range]::-webkit-slider-thumb:active {
          background: #5E35B1;
          transform: scale(1.2);
        }

        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #673AB7;
          cursor: pointer;
          transition: background 0.15s ease-in-out, transform 0.1s ease-out;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        input[type=range]::-moz-range-thumb:hover {
          background: #7E57C2;
          transform: scale(1.1);
        }

        input[type=range]::-moz-range-thumb:active {
          background: #5E35B1;
          transform: scale(1.2);
        }

        input[type=range]::-ms-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #673AB7;
          cursor: pointer;
          transition: background 0.15s ease-in-out, transform 0.1s ease-out;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        /* Slider tick marks styling */
        .slider-tick {
          transition: background-color 0.2s;
        }

        /* Highlight ticks at 0%, 25%, 50%, 75%, and 100% */
        .slider-tick:nth-child(6n+1) {
          background-color: #673AB7;
          height: 10px !important;
        }
      `}</style>
    </div>
  );
};

export default BalanceButton;
