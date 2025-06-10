import React, { createContext, useContext, useState } from 'react';
import PlayerInfoModal from '../components/PlayerInfoModal';
import { API_CONFIG, getApiUrl } from '../config';

const PlayerInfoContext = createContext();

export const usePlayerInfo = () => {
  const context = useContext(PlayerInfoContext);
  if (!context) {
    throw new Error('usePlayerInfo must be used within a PlayerInfoProvider');
  }
  return context;
};

export const PlayerInfoProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nickname, setNickname] = useState('');

  const openPlayerInfo = async (playerId, playerNickname) => {
    // Check if player ID is -1 (new user)
    if (playerId === -1 || playerId === undefined || playerId === null) {
      alert('No info');
      return;
    }

    setNickname(playerNickname);
    setIsModalOpen(true);
    setIsLoading(true);
    setError(null);
    setPlayerData(null);

    try {
      console.log('Fetching player info for ID:', playerId);
      const url = getApiUrl(`${API_CONFIG.ENDPOINTS.USER_INFO}/${playerId}`);
      console.log('API URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Player data received:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPlayerData(data);
    } catch (error) {
      console.error('Error fetching player info:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closePlayerInfo = () => {
    setIsModalOpen(false);
    setPlayerData(null);
    setError(null);
    setNickname('');
  };

  return (
    <PlayerInfoContext.Provider value={{ openPlayerInfo }}>
      {children}
      <PlayerInfoModal
        isOpen={isModalOpen}
        onClose={closePlayerInfo}
        playerData={playerData}
        isLoading={isLoading}
        error={error}
        nickname={nickname}
      />
    </PlayerInfoContext.Provider>
  );
};
