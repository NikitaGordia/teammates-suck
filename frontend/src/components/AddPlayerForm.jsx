import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './AddPlayerForm.css';

// Helper function to get color based on score
const getScoreColor = (score) => {
  switch (Number(score)) {
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

const AddPlayerForm = ({ onAddPlayer, scoreMappings = {}, noPlayersAdded = false }) => {
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

      onAddPlayer({ nickname, score: playerScore });
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
        handleSuggestionClick(selectedSuggestion);
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
              <td style={{ padding: '8px', width: '100%' }}>
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
                      padding: '8px',
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
                          {scoreMappings[suggestion] !== undefined && (
                            <span style={{
                              fontWeight: 'bold',
                              color: getScoreColor(scoreMappings[suggestion])
                            }}>
                              {scoreMappings[suggestion]}
                            </span>
                          )}
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
                  <option value="2" style={{ color: getScoreColor(2), fontWeight: 'bold' }}>2</option>
                  <option value="3" style={{ color: getScoreColor(3), fontWeight: 'bold' }}>3</option>
                  <option value="4" style={{ color: getScoreColor(4), fontWeight: 'bold' }}>4</option>
                </select>
              </td>
              <td style={{ padding: '8px', textAlign: 'center', width: '100px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '5px 10px',
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
