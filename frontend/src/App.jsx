import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PlayerTable from './components/PlayerTable';
import AddPlayerForm from './components/AddPlayerForm';
import BalanceButton from './components/BalanceButton';
import TeamsDisplay from './components/TeamsDisplay';
import TeamCopyText, { copyTeamsToClipboard } from './components/TeamCopyText';
import BalancingInfo from './components/BalancingInfo';
import LanguageSwitcher from './components/LanguageSwitcher';
import LogoutButton from './components/LogoutButton';
import DigestButton from './components/DigestButton';
import LeaderboardButton from './components/LeaderboardButton';
import PlayerInfoButton from './components/PlayerInfoButton';
import { PlayerInfoProvider } from './contexts/PlayerInfoContext';
import { API_CONFIG, getApiUrl } from './config';
import { handleApiResponse } from './utils/apiUtils';
import './App.css';

function App() {
  const { t } = useTranslation();
  // Players state - initialize with empty array
  const [players, setPlayers] = useState([]);

  // Teams state
  const [teams, setTeams] = useState({ team1: [], team2: [] });

  // State to track if teams were just copied to clipboard
  const [teamsCopied, setTeamsCopied] = useState(false);

  // State for user data from backend (includes scores, wins, losses)
  const [userData, setUserData] = useState({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Throttle state for refresh button
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);

  // Toggle for showing all known players
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  // Randomness slider state (0-100%)
  const [randomness, setRandomness] = useState(0);

  // Dimming state for 10-minute timer after Balance button click
  const [isDimmed, setIsDimmed] = useState(false);
  const dimTimerRef = useRef(null);

  // Ref for teams-section to measure its position
  const teamsSectionRef = useRef(null);

  // State to track teams section position for overlay
  const [teamsSectionPosition, setTeamsSectionPosition] = useState({ top: 0, left: 0 });

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
  // Fetch user data from backend with optional force refresh
  const fetchScoreMappings = async (force_refresh = false) => {
    // If force_refresh is true and already throttled, don't allow another fetch
    if (force_refresh && isThrottled) return;

    // Set loading state
    setIsLoading(true);

    // Apply throttling only for manual refresh (force_refresh = true)
    if (force_refresh) {
      setIsThrottled(true);

      // Start the throttle countdown
      let timeRemaining = API_CONFIG.THROTTLE_TIME;
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
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      // Create API URL and add force_refresh parameter if needed
      let url = getApiUrl(API_CONFIG.ENDPOINTS.GET_MAPPINGS);
      if (force_refresh) {
        url = `${url}?force_refresh=true`;
      }

      const response = await fetch(url, {
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Use the handleApiResponse utility to check for errors
      const data = await handleApiResponse(response);

      // Update userData with the new response format
      setUserData(data.users || {});

      // Create a simplified score mappings object for backward compatibility
      const simplifiedScoreMappings = {};
      Object.entries(data.users || {}).forEach(([nickname, userData]) => {
        simplifiedScoreMappings[nickname] = userData.score;
      });

      // For backward compatibility with existing code
      window.scoreMappings = simplifiedScoreMappings;

      // Store the full userData in window for components to access
      window.userData = data.users || {};

      if (force_refresh) {
        console.log('Fetched user data:', data.users);
      }
    } catch (error) {
      const errorType = force_refresh ? 'user data' : 'initial user data';
      console.error(`Error fetching ${errorType}:`, error);

      if (error.name === 'AbortError') {
        const timeoutMessage = force_refresh
          ? `Request timed out after ${API_CONFIG.TIMEOUT/1000} seconds. Please check if the backend server is running.`
          : `Initial request timed out after ${API_CONFIG.TIMEOUT/1000} seconds. Please check if the backend server is running.`;
        alert(timeoutMessage);
      } else {
        // The error message will already contain the API error message if present
        // because handleApiResponse extracts it from the 'error' key in the response
        const errorMessage = error.message || (force_refresh
          ? 'Failed to fetch user data from the server. Please try again later.'
          : 'Failed to fetch initial user data from the server.');
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
      // Note: We don't reset the throttle here for force_refresh=true as we want the button to remain disabled
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchScoreMappings(false);
  }, []);

  // We're not automatically updating players list when score mappings change
  // Instead, we'll just store the mappings for future use

  // Function to add a player from the user data
  const handleAddPlayerFromMappings = (nickname) => {
    if (userData[nickname] !== undefined) {
      const score = Number(userData[nickname].score);
      const wins = userData[nickname].wins;
      const losses = userData[nickname].losses;
      const id = userData[nickname].id || -1; // Use ID from backend, default to -1 for new users

      // Check if player already exists
      const playerExists = players.some(player => player.nickname === nickname);
      if (!playerExists) {
        setPlayers([...players, { nickname, score, wins, losses, id }]);
      } else {
        alert(t('players.alreadyInList', { nickname }));
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
      alert(t('players.alreadyInList', { nickname: player.nickname }));
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

  const handleRemoveAllPlayers = () => {
    console.log('handleRemoveAllPlayers called');
    setPlayers([]);
    // Also clear teams when removing all players
    setTeams({ team1: [], team2: [] });
    // Clear dimming since teams are cleared
    setIsDimmed(false);
    clearDimTimer();
  };

  const handleReorderPlayers = (newPlayers) => {
    console.log('handleReorderPlayers called with new order');
    setPlayers(newPlayers);
  };

  // Handle game submission - refresh user data, reset teams, and update players
  const handleGameSubmitted = async (gameData) => {
    console.log('Game submitted:', gameData);

    try {
      // First, refresh the user data to get updated wins/losses
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      // Create API URL without force_refresh parameter
      let url = getApiUrl(API_CONFIG.ENDPOINTS.GET_MAPPINGS);

      const response = await fetch(url, {
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Use the handleApiResponse utility to check for errors
      const data = await handleApiResponse(response);
      const freshUserData = data.users || {};

      // Update the userData state with the fresh data
      setUserData(freshUserData);

      // Update window.userData and window.scoreMappings for compatibility
      window.userData = freshUserData;
      const simplifiedScoreMappings = {};
      Object.entries(freshUserData).forEach(([nickname, userData]) => {
        simplifiedScoreMappings[nickname] = userData.score;
      });
      window.scoreMappings = simplifiedScoreMappings;

      console.log('Fetched user data after game submission:', freshUserData);

      // Clear the current teams
      setTeams({ team1: [], team2: [] });

      // Clear dimming since admin has chosen a winner
      setIsDimmed(false);
      clearDimTimer();

      // Update existing players with fresh data while maintaining their order
      const updatedPlayers = players.map(player => {
        // If the player has updated data in the fresh userData, use it
        if (freshUserData[player.nickname]) {
          return {
            ...player,
            score: freshUserData[player.nickname].score || player.score,
            wins: freshUserData[player.nickname].wins || 0,
            losses: freshUserData[player.nickname].losses || 0,
            id: freshUserData[player.nickname].id || player.id || -1 // Preserve or update ID
          };
        }
        return player;
      });

      // Update the players state with the updated list (preserving order)
      setPlayers(updatedPlayers);

      // Ensure teams remain empty (no auto-rebalancing)
      setTeams({ team1: [], team2: [] });
    } catch (error) {
      console.error('Error refreshing data after game submission:', error);
      // Display the error message from the API if available
      if (error.name !== 'AbortError') {
        alert(error.message || 'Error refreshing data after game submission');
      }
      // Still clear teams even if refresh fails
      setTeams({ team1: [], team2: [] });
    }
  };

  // Function to get player count comment based on number of players
  const getPlayerCountComment = (count) => {
    if (count < 2) {
      return t('players.countComments.waiting');
    } else if (count >= 2 && count <= 4) {
      return t('players.countComments.needMore');
    } else if (count >= 5 && count <= 6) {
      return t('players.countComments.continue');
    } else if (count === 7) {
      return t('players.countComments.almostHere');
    } else if (count === 8) {
      return t('players.countComments.letsGo');
    } else if (count > 8 && count <= 30 &&count % 2 === 1) {
      return t('players.countComments.findOneMore');
    } else if (count > 8 && count <= 30) {
      return t('players.countComments.strange');
    } else if (count > 30) {
      return t('players.countComments.tooMany');
    }
    return "";
  };

  // Function to update teams section position for overlay
  const updateTeamsSectionPosition = () => {
    if (teamsSectionRef.current) {
      const rect = teamsSectionRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setTeamsSectionPosition({
        top: rect.top + scrollTop,
        left: rect.left + (rect.width / 2)
      });
    }
  };

  // Function to start the 10-minute dimming timer
  const startDimTimer = () => {
    // Clear any existing timer
    if (dimTimerRef.current) {
      clearTimeout(dimTimerRef.current);
    }

    // Start new 10-minute timer
    dimTimerRef.current = setTimeout(() => {
      setIsDimmed(true);
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
  };

  // Function to clear the dimming timer
  const clearDimTimer = () => {
    if (dimTimerRef.current) {
      clearTimeout(dimTimerRef.current);
      dimTimerRef.current = null;
    }
  };

  // Function to handle dimming overlay click (dismiss dimming)
  const handleDimOverlayClick = () => {
    setIsDimmed(false);
    clearDimTimer();
  };

  // Cleanup timer on component unmount and handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isDimmed) {
        updateTeamsSectionPosition();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearDimTimer();
      window.removeEventListener('resize', handleResize);
    };
  }, [isDimmed]);

  const handleBalanceTeams = async () => {
    console.log('handleBalanceTeams called');

    // Check if there are players to balance
    if (players.length === 0) {
      alert(t('balance.noPlayers'));
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

      // Add wins/losses data to the players in the teams
      const playersWithStats = players.map(player => {
        return {
          ...player,
          wins: player.wins || 0,
          losses: player.losses || 0
        };
      });

      // Include randomness in the request data
      const requestData = {
        users: usersData,
        randomness: randomness
      };

      console.log('Sending balance request with data:', requestData);

      // Make the POST request to the balance API
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BALANCE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        // Adding mode: 'cors' explicitly
        mode: 'cors',
      });

      // Use the handleApiResponse utility to check for errors
      const data = await handleApiResponse(response);
      console.log('Received balanced teams:', data);

      // Map the API response to the expected format for the teams state
      // API returns { teamA: [], teamB: [] } but our components expect { team1: [], team2: [] }
      // Also add wins/losses data to each player and preserve IDs from API response
      const balancedTeams = {
        team1: (data.teamA || []).map(player => {
          // Find the player in our local data to get wins/losses
          const localPlayer = playersWithStats.find(p => p.nickname === player.nickname);
          return {
            ...player,
            wins: localPlayer ? localPlayer.wins : 0,
            losses: localPlayer ? localPlayer.losses : 0,
            id: player.id || localPlayer?.id || -1 // Use ID from API response, fallback to local, then -1
          };
        }),
        team2: (data.teamB || []).map(player => {
          // Find the player in our local data to get wins/losses
          const localPlayer = playersWithStats.find(p => p.nickname === player.nickname);
          return {
            ...player,
            wins: localPlayer ? localPlayer.wins : 0,
            losses: localPlayer ? localPlayer.losses : 0,
            id: player.id || localPlayer?.id || -1 // Use ID from API response, fallback to local, then -1
          };
        })
      };

      setTeams(balancedTeams);

      updateTeamsSectionPosition();

      // Start the 10-minute dimming timer after successful balancing
      startDimTimer();

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
      // Display the error message from the API if available
      alert(error.message || t('balance.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PlayerInfoProvider>
      <div className="App">
      <div className="app-header">
        <LanguageSwitcher />
        <LogoutButton />
      </div>
      <div className="main-container">
        <div className="players-section">
          <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}}>
  <h2 style={{ margin: 0 }}>
    {t('app.players')} ({players.length})
  </h2>

  {/* Container for the bubble and the robot */}
       <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        padding: '10px', // Added padding to see the tail better
        background: 'white' // Ensure background is white for tail effect
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            key={getPlayerCountComment(players.length)}
            className="ios-mine-bubble" // Apply the main CSS class
            style={{
              // Keep essential styles, override/add others with CSS
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 15px', // iOS padding
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)', // More subtle shadow
              animation: 'messageSlideIn 0.3s ease-out',
              transform: 'scale(1)',
              transition: 'all 0.2s ease-in-out',
              // Increased margin to make space for the 10px tail + spacing
              marginRight: '15px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.15)';
            }}
          >
            {getPlayerCountComment(players.length)}
          </div>

          <div style={{
              fontSize: '32px',
              lineHeight: '1',
              marginTop: '8px',
              transition: 'transform 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            🤖
          </div>
        </div>
      </div>
      </div>
          <PlayerTable
            players={players}
            onScoreChange={handleScoreChange}
            onRemovePlayer={handleRemovePlayer}
            onReorderPlayers={handleReorderPlayers}
            onRemoveAllPlayers={handleRemoveAllPlayers}
          />
          <AddPlayerForm onAddPlayer={handleAddPlayer} scoreMappings={window.scoreMappings || {}} noPlayersAdded={players.length === 0} />
          <BalanceButton
            onBalanceTeams={handleBalanceTeams}
            isLoading={isLoading}
            randomness={randomness}
            onRandomnessChange={handleRandomnessChange}
            playerCount={players.length}
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
              {t('players.showAllKnown')}
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
                      <h4 style={{ margin: 0, fontSize: '13px' }}>{t('players.allKnownFromSheet')}</h4>
                    </td>
                    <td style={{ padding: '2px 0', textAlign: 'center', width: '100px' }}>
                      <button
                        onClick={() => fetchScoreMappings(true)}
                        disabled={isLoading || isThrottled}
                        className="refresh-button"
                      >
                        {isLoading ? (
                          <>
                            <div className="refresh-spinner"></div>
                            <span>{t('balance.loading')}</span>
                          </>
                        ) : isThrottled ? (
                          <span>{throttleTimeLeft}s</span>
                        ) : (
                          <span>{t('balance.refresh')}</span>
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
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.nickname')}</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.score')}</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.winLoss')}</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t('players.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(userData).map(([nickname, user], index) => (
                      <tr key={index}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{nickname}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{user.score}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                          <PlayerInfoButton
                            playerId={user.id || -1}
                            nickname={nickname}
                            className="wins-losses"
                          >
                            <div style={{ display: 'inline-block', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{user.wins}</span>
                              <span style={{ margin: '0 2px' }}>/</span>
                              <span style={{ color: '#F44336', fontWeight: 'bold' }}>{user.losses}</span>
                            </div>
                          </PlayerInfoButton>
                        </td>
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
                            {t('players.add')}
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
          <h2>{t('balance.statusTitle')}</h2>
          <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
            {t('balance.statusDescription')}
          </p>
          <BalancingInfo />
        </div>

        <div className="teams-section" ref={teamsSectionRef}>
          <h2>{t('app.balancedTeams')}</h2>
          <TeamsDisplay
            teams={teams}
            onGameSubmitted={handleGameSubmitted}
          />
          <TeamCopyText teams={teams} autocopied={teamsCopied} />
        </div>

        {/* Show "So who has won?" text when teams are present - under teams-section */}
      </div>

      {/* Buttons container - centered between main content and developer contacts */}
      <div className="buttons-container">
        <DigestButton />
        <LeaderboardButton />
      </div>

      {/* Developer Contacts - outside of main-container and without a white tile */}
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        color: '#555',
        fontSize: '14px',
        padding: '10px'
      }}>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{t('developer.contacts')}</div>
        <div>{t('developer.discord')}</div>
        <div>{t('developer.github').split(': ')[0]}: <a href="https://github.com/NikitaGordia" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none' }}>MykytaHordia</a></div>
        <div>{t('developer.cossacks3')}</div>
        <div>{t('developer.version', { version: import.meta.env.VITE_BUILD_TAG || 'dev' })}</div>
      </div>

      {/* Text overlay below teams-section when dimmed */}
      {isDimmed && (
        <div
          className="teams-overlay-text"
          style={{
            position: 'absolute',
            top: `${teamsSectionPosition.top - 32}px`,
            left: `${teamsSectionPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 1001,
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            pointerEvents: 'none',
            animation: 'slideUpFromBottom 0.6s ease-out'
          }}
        >
          {t('teams.clickToSelectOverlay')}
        </div>
      )}

      {/* Dimming overlay - appears after 10 minutes of Balance button click */}
      {isDimmed && (
        <div className="dim-overlay" onClick={handleDimOverlayClick}>
        </div>
      )}
      </div>
    </PlayerInfoProvider>
  );
}

export default App;
