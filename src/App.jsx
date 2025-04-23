import React, { useState, useEffect } from 'react';
import PlayerTable from './components/PlayerTable';
import AddPlayerForm from './components/AddPlayerForm';
import BalanceButton from './components/BalanceButton';
import TeamsDisplay from './components/TeamsDisplay';
import TeamCopyText from './components/TeamCopyText';
import BalancingInfo from './components/BalancingInfo';
import './App.css';

function App() {
  // Players state - initialize with empty array
  const [players, setPlayers] = useState([]);

  // Teams state
  const [teams, setTeams] = useState({ team1: [], team2: [] });

  // State for score mappings from backend
  const [scoreMappings, setScoreMappings] = useState({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Toggle for showing all known players
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  // Handler functions
  // Fetch score mappings from backend
  const fetchScoreMappings = async () => {
    setIsLoading(true);
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      const response = await fetch('http://127.0.0.1:5000/api/get_mappings', {
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
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchScoreMappings();
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

  const handleBalanceTeams = () => {
    console.log('handleBalanceTeams called');

    // Simple team balancing algorithm
    if (players.length === 0) {
      alert('Please add players first!');
      return;
    }

    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // Initialize teams
    const team1 = [];
    const team2 = [];
    let team1Score = 0;
    let team2Score = 0;

    // Distribute players to balance teams
    sortedPlayers.forEach(player => {
      if (team1Score <= team2Score) {
        team1.push(player);
        team1Score += player.score;
      } else {
        team2.push(player);
        team2Score += player.score;
      }
    });

    setTeams({ team1, team2 });
  };

  return (
    <div className="App">
      <h1 className="title">Team <span className="fancy-title">Balancer</span></h1>

      <div className="main-container">
        <div className="players-section">
          <h2>Players</h2>
          <PlayerTable
            players={players}
            onScoreChange={handleScoreChange}
            onRemovePlayer={handleRemovePlayer}
          />
          <AddPlayerForm onAddPlayer={handleAddPlayer} />
          <BalanceButton onBalanceTeams={handleBalanceTeams} />

          {/* Refresh scores button */}
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <button
              onClick={fetchScoreMappings}
              disabled={isLoading}
              style={{
                padding: '10px 15px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                width: '100%',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Refreshing scores...' : 'Refresh scores from Sheet'}
            </button>
          </div>

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
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}>
              <h4 style={{ marginBottom: '8px' }}>All Known Players from Sheet</h4>
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

          <BalancingInfo />
        </div>

        <div className="teams-section">
          <h2>Balanced Teams</h2>
          <TeamsDisplay teams={teams} />
          <TeamCopyText teams={teams} />
        </div>
      </div>
    </div>
  );
}

export default App;
