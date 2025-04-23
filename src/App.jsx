import React, { useState, useEffect } from 'react';
import PlayerTable from './components/PlayerTable';
import AddPlayerForm from './components/AddPlayerForm';
import BalanceButton from './components/BalanceButton';
import TeamsDisplay from './components/TeamsDisplay';
import TeamCopyText, { copyTeamsToClipboard } from './components/TeamCopyText';
import BalancingInfo from './components/BalancingInfo';
import './App.css';

function App() {
  // Players state - initialize with empty array
  const [players, setPlayers] = useState([]);

  // Teams state
  const [teams, setTeams] = useState({ team1: [], team2: [] });

  // State to track if teams were just copied to clipboard
  const [teamsCopied, setTeamsCopied] = useState(false);

  // State for score mappings from backend
  const [scoreMappings, setScoreMappings] = useState({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Throttle state for refresh button
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);

  // Toggle for showing all known players
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  // Randomness slider state (0-100%)
  const [randomness, setRandomness] = useState(0);

  // Function to ensure randomness is always one of the five snap points (0, 25, 50, 75, 100)
  const handleRandomnessChange = (value) => {
    // Value should already be snapped by the BalanceButton component
    // but we'll ensure it's one of our valid snap points
    const snapPoints = [0, 25, 50, 75, 100];
    const closestSnapPoint = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    setRandomness(closestSnapPoint);
  };

  // Handler functions
  // Fetch score mappings from backend
  const fetchScoreMappings = async () => {
    // If already throttled, don't allow another fetch
    if (isThrottled) return;

    // Set loading and throttle states
    setIsLoading(true);
    setIsThrottled(true);

    // Start the throttle countdown
    let timeRemaining = 30;
    setThrottleTimeLeft(timeRemaining);

    // Update the countdown every second
    const countdownInterval = setInterval(() => {
      timeRemaining -= 1;
      setThrottleTimeLeft(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        setIsThrottled(false);
      }
    }, 1000);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      // Add force_refresh=true parameter to the URL
      const url = new URL('http://127.0.0.1:5000/api/get_mappings');
      url.searchParams.append('force_refresh', 'true');

      const response = await fetch(url.toString(), {
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setScoreMappings(data.scores || {});
      console.log('Fetched score mappings:', data.scores);
    } catch (error) {
      console.error('Error fetching score mappings:', error);
      if (error.name === 'AbortError') {
        alert('Request timed out after 30 seconds. Please check if the backend server is running.');
      } else {
        alert('Failed to fetch score mappings from the server. Please try again later.');
      }
    } finally {
      setIsLoading(false);
      // Note: We don't reset the throttle here as we want the button to remain disabled for 30 seconds
    }
  };

  // Function to fetch data without throttling (for initial load)
  const initialFetchScoreMappings = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('http://127.0.0.1:5000/api/get_mappings', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setScoreMappings(data.scores || {});
    } catch (error) {
      console.error('Error fetching initial score mappings:', error);
      if (error.name === 'AbortError') {
        alert('Initial request timed out after 30 seconds. Please check if the backend server is running.');
      } else {
        alert('Failed to fetch initial score mappings from the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    initialFetchScoreMappings();
  }, []);

  // We're not automatically updating players list when score mappings change
  // Instead, we'll just store the mappings for future use

  // Function to add a player from the mappings
  const handleAddPlayerFromMappings = (nickname) => {
    if (scoreMappings[nickname] !== undefined) {
      const score = Number(scoreMappings[nickname]);
      // Check if player already exists
      const playerExists = players.some(player => player.nickname === nickname);
      if (!playerExists) {
        setPlayers([...players, { nickname, score }]);
      } else {
        alert(`Player ${nickname} is already in the list.`);
      }
    }
  };

  const handleAddPlayer = (player) => {
    console.log('handleAddPlayer called with:', player);
    // Check if player already exists
    const playerExists = players.some(p => p.nickname === player.nickname);
    if (!playerExists) {
      setPlayers([...players, player]);
    } else {
      alert(`Player ${player.nickname} is already in the list.`);
    }
  };

  const handleScoreChange = (index, newScore) => {
    console.log('handleScoreChange called with:', index, newScore);
    const updatedPlayers = [...players];
    updatedPlayers[index].score = newScore;
    setPlayers(updatedPlayers);
  };

  const handleRemovePlayer = (index) => {
    console.log('handleRemovePlayer called with:', index);
    const updatedPlayers = [...players];
    updatedPlayers.splice(index, 1);
    setPlayers(updatedPlayers);
  };

  const handleBalanceTeams = async () => {
    console.log('handleBalanceTeams called');

    // Check if there are players to balance
    if (players.length === 0) {
      alert('Please add players first!');
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Format the players data as required by the API
      const usersData = {};
      players.forEach(player => {
        usersData[player.nickname] = player.score;
      });

      // Include randomness in the request data
      const requestData = {
        users: usersData,
        randomness: randomness
      };

      console.log('Sending balance request with data:', requestData);

      // Make the POST request to the balance API
      // Note: Using /api/balance without trailing slash to match the server route
      const response = await fetch('http://127.0.0.1:5000/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        // Adding mode: 'cors' explicitly
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      console.log('Received balanced teams:', data);

      // Map the API response to the expected format for the teams state
      // API returns { teamA: [], teamB: [] } but our components expect { team1: [], team2: [] }
      const balancedTeams = {
        team1: data.teamA || [],
        team2: data.teamB || []
      };

      setTeams(balancedTeams);

      // Automatically copy teams to clipboard if there are players
      if ((balancedTeams.team1.length > 0 || balancedTeams.team2.length > 0) &&
          navigator.clipboard) {
        copyTeamsToClipboard(balancedTeams);
        setTeamsCopied(true);

        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setTeamsCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error balancing teams:', error);
      alert('Failed to balance teams. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="players-section">
          <h2>Players</h2>
          <PlayerTable
            players={players}
            onScoreChange={handleScoreChange}
            onRemovePlayer={handleRemovePlayer}
          />
          <AddPlayerForm onAddPlayer={handleAddPlayer} scoreMappings={scoreMappings} noPlayersAdded={players.length === 0} />
          <BalanceButton
            onBalanceTeams={handleBalanceTeams}
            isLoading={isLoading}
            randomness={randomness}
            onRandomnessChange={handleRandomnessChange}
          />

          {/* All known players toggle */}
          <div style={{ marginTop: '10px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showAllPlayers}
                onChange={() => setShowAllPlayers(!showAllPlayers)}
                style={{ marginRight: '8px' }}
              />
              Show all known players
            </label>
          </div>

          {/* All known players section */}
          {showAllPlayers && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 0', textAlign: 'left' }}>
                      <h4 style={{ margin: 0, fontSize: '13px' }}>All Known Players from Sheet</h4>
                    </td>
                    <td style={{ padding: '2px 0', textAlign: 'center', width: '100px' }}>
                      <button
                        onClick={fetchScoreMappings}
                        disabled={isLoading || isThrottled}
                        className="refresh-button"
                      >
                        {isLoading ? (
                          <>
                            <div className="refresh-spinner"></div>
                            <span>Loading</span>
                          </>
                        ) : isThrottled ? (
                          <span>{throttleTimeLeft}s</span>
                        ) : (
                          <span>Refresh</span>
                        )}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Nickname</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Score</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(scoreMappings).map(([nickname, score], index) => (
                      <tr key={index}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{nickname}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{score}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                          <button
                            onClick={() => handleAddPlayerFromMappings(nickname)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Raw Data section removed as requested */}
            </div>
          )}
        </div>

        <div className="balancing-status-section">
          <h2>Balancing Status</h2>
          <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
            Player scores determine how teams are balanced. Here's what each score means:
          </p>
          <BalancingInfo />
        </div>

        <div className="teams-section">
          <h2>Balanced Teams</h2>
          <TeamsDisplay teams={teams} />
          <TeamCopyText teams={teams} autocopied={teamsCopied} />
        </div>
      </div>
    </div>
  );
}

export default App;
