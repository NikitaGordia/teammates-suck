import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getScoreColor } from '../utils/scoreUtils';
import './AddPlayerForm.css';

const AddPlayerForm = ({ onAddPlayer, scoreMappings = {}, noPlayersAdded = false }) => {
  // Note: scoreMappings is now expected to be window.scoreMappings which is a simplified version of userData
  const { t } = useTranslation();
  const [nickname, setNickname] = useState('');
  const [score, setScore] = useState(3); // Default score
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const suggestionsRef = useRef(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (nickname.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filteredSuggestions = Object.keys(scoreMappings)
      .filter(name =>
        name.toLowerCase().includes(nickname.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
    setActiveSuggestionIndex(0);
  }, [nickname, scoreMappings]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      // If the nickname exists in scoreMappings, use its score
      const playerScore = scoreMappings[nickname] !== undefined
        ? Number(scoreMappings[nickname])
        : Number(score);

      // Get wins and losses from window.userData if available
      const wins = window.userData && window.userData[nickname] ? window.userData[nickname].wins : 0;
      const losses = window.userData && window.userData[nickname] ? window.userData[nickname].losses : 0;

      onAddPlayer({ nickname, score: playerScore, wins, losses });
      setNickname('');
      setScore(3);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setNickname(suggestion);
    if (scoreMappings[suggestion] !== undefined) {
      setScore(Number(scoreMappings[suggestion]));
    }
    setShowSuggestions(false);

    // Get wins and losses from window.userData if available
    const wins = window.userData && window.userData[suggestion] ? window.userData[suggestion].wins : 0;
    const losses = window.userData && window.userData[suggestion] ? window.userData[suggestion].losses : 0;

    // Submit the form with the selected player
    const playerScore = scoreMappings[suggestion] !== undefined
      ? Number(scoreMappings[suggestion])
      : Number(score);

    onAddPlayer({ nickname: suggestion, score: playerScore, wins, losses });

    // Reset the form
    setNickname('');
    setScore(3);
  };

  const handleKeyDown = (e) => {
    // If no suggestions or not showing suggestions, return
    if (!showSuggestions || suggestions.length === 0) return;

    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prevIndex =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prevIndex =>
        prevIndex > 0 ? prevIndex - 1 : 0
      );
    }
    // Enter
    else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      const selectedSuggestion = suggestions[activeSuggestionIndex];
      if (selectedSuggestion) {
        // Set the nickname and score
        setNickname(selectedSuggestion);
        if (scoreMappings[selectedSuggestion] !== undefined) {
          setScore(Number(scoreMappings[selectedSuggestion]));
        }
        setShowSuggestions(false);

        // Get wins and losses from window.userData if available
        const wins = window.userData && window.userData[selectedSuggestion] ? window.userData[selectedSuggestion].wins : 0;
        const losses = window.userData && window.userData[selectedSuggestion] ? window.userData[selectedSuggestion].losses : 0;

        // Submit the form with the selected player
        const playerScore = scoreMappings[selectedSuggestion] !== undefined
          ? Number(scoreMappings[selectedSuggestion])
          : Number(score);

        onAddPlayer({ nickname: selectedSuggestion, score: playerScore, wins, losses });

        // Reset the form
        setNickname('');
        setScore(3);
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div style={{ marginBottom: '5px' }}>
      <form onSubmit={handleSubmit} role="form">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ paddingRight: '8px', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%' }} ref={suggestionsRef}>
                  <input
                    type="text"
                    placeholder={noPlayersAdded ? t('players.addFirstPlayer') : t('players.nickname')}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => nickname.trim() !== '' && setShowSuggestions(suggestions.length > 0)}
                    className={noPlayersAdded ? 'nickname-input glow-effect' : 'nickname-input'}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: noPlayersAdded ? '1px solid #673AB7' : '1px solid #ddd'
                    }}
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '100%',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                      border: '1px solid #ddd',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      backgroundColor: 'white',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: index === activeSuggestionIndex ? '#f0f0f0' : 'white',
                            borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{suggestion}</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {window.userData && window.userData[suggestion] && (
                              <span style={{
                                fontSize: '12px',
                                marginRight: '8px',
                                whiteSpace: 'nowrap'
                              }}>
                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{window.userData[suggestion].wins}</span>
                                <span style={{ margin: '0 2px' }}>/</span>
                                <span style={{ color: '#F44336', fontWeight: 'bold' }}>{window.userData[suggestion].losses}</span>
                              </span>
                            )}
                            {scoreMappings[suggestion] !== undefined && (
                              <span style={{
                                fontWeight: 'bold',
                                color: getScoreColor(scoreMappings[suggestion])
                              }}>
                                {scoreMappings[suggestion]}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
                  <option value="1.5" style={{ color: getScoreColor(1.5), fontWeight: 'bold' }}>1.5</option>
                  <option value="2" style={{ color: getScoreColor(2), fontWeight: 'bold' }}>2</option>
                  <option value="2.5" style={{ color: getScoreColor(2.5), fontWeight: 'bold' }}>2.5</option>
                  <option value="3" style={{ color: getScoreColor(3), fontWeight: 'bold' }}>3</option>
                  <option value="3.3" style={{ color: getScoreColor(3.3), fontWeight: 'bold' }}>3.3</option>
                  <option value="3.5" style={{ color: getScoreColor(3.5), fontWeight: 'bold' }}>3.5</option>
                  <option value="4" style={{ color: getScoreColor(4), fontWeight: 'bold' }}>4</option>
                  <option value="4.1" style={{ color: getScoreColor(4.1), fontWeight: 'bold' }}>4.1</option>
                  <option value="4.2" style={{ color: getScoreColor(4.2), fontWeight: 'bold' }}>4.2</option>
                  <option value="4.3" style={{ color: getScoreColor(4.3), fontWeight: 'bold' }}>4.3</option>
                  <option value="4.4" style={{ color: getScoreColor(4.4), fontWeight: 'bold' }}>4.4</option>
                  <option value="4.5" style={{ color: getScoreColor(4.5), fontWeight: 'bold' }}>4.5</option>
                  <option value="4.6" style={{ color: getScoreColor(4.6), fontWeight: 'bold' }}>4.6</option>
                  <option value="4.7" style={{ color: getScoreColor(4.7), fontWeight: 'bold' }}>4.7</option>
                  <option value="4.8" style={{ color: getScoreColor(4.8), fontWeight: 'bold' }}>4.8</option>
                  <option value="4.9" style={{ color: getScoreColor(4.9), fontWeight: 'bold' }}>4.9</option>
                  <option value="5" style={{ color: getScoreColor(5), fontWeight: 'bold' }}>5</option>
                </select>
              </td>
              <td style={{ padding: '8px', textAlign: 'center', width: '100px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 10px',
                    backgroundColor: '#4CAF50', /* Green color for Add button */
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    width: '80px'
                  }}
                >
                  {t('players.addPlayer')}
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
