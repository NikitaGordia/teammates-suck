import React from 'react';
import { useTranslation } from 'react-i18next';

// Simple mock implementation of AddPlayerForm
const AddPlayerForm = ({ onAddPlayer, scoreMappings = {}, noPlayersAdded = false }) => {
  const { t } = useTranslation();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddPlayer({ nickname: 'TestPlayer', score: 3 });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder={noPlayersAdded ? 'players.addFirstPlayer' : 'players.nickname'} 
          data-testid="nickname-input"
        />
        <select data-testid="score-select">
          <option value="-1">-1</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
        <button type="submit">players.addPlayer</button>
      </form>
    </div>
  );
};

export default AddPlayerForm;
