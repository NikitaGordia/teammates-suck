import React, { useEffect, useRef } from 'react';

const BalanceButton = ({ onBalanceTeams, isLoading, randomness, onRandomnessChange }) => {
  const sliderRef = useRef(null);

  // Function to snap value to nearest fixed percentage
  const snapToFixedPercentage = (value) => {
    // Define the specific snap points (0, 25, 50, 75, 100)
    const snapPoints = [0, 25, 50, 75, 100];

    // Find the closest snap point
    return snapPoints.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
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
      ticksContainer.style.width = 'calc(100% - 20px)';
      ticksContainer.style.height = '10px';
      ticksContainer.style.marginTop = '2px';
      ticksContainer.style.marginLeft = '10px';
      ticksContainer.style.marginRight = '10px';

      // Define main snap points
      const mainSnapPoints = [0, 25, 50, 75, 100];

      // Add tick marks for each 5% increment
      for (let i = 0; i <= 100; i += 5) {
        const tick = document.createElement('div');
        const isMainTick = mainSnapPoints.includes(i);

        tick.className = isMainTick ? 'slider-tick main-tick' : 'slider-tick';
        tick.style.position = 'absolute';
        tick.style.left = `${i}%`;
        tick.style.width = '1px';

        // Main ticks are 60% larger and slightly purple
        if (isMainTick) {
          tick.style.height = '8px';
          tick.style.backgroundColor = '#673AB7';
        } else {
          tick.style.height = '5px';
          tick.style.backgroundColor = '#999';
        }

        tick.style.transform = 'translateX(-50%)';

        ticksContainer.appendChild(tick);
      }

      // Insert ticks after the slider
      slider.parentNode.insertBefore(ticksContainer, slider.nextSibling);
    }
  }, []);

  return (
    <div style={{ marginTop: '5px', marginBottom: '5px' }}>
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
            alignItems: 'center',
            height: '42px' // Fixed height to match slider height
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
        <div style={{ width: '48%', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', paddingBottom: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
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

        /* Styling for main ticks (0%, 25%, 50%, 75%, 100%) */
        .main-tick {
          background-color: #673AB7 !important;
          height: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default BalanceButton;
