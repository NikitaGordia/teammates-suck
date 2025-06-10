import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerInfo } from '../contexts/PlayerInfoContext';
import './PlayerInfoButton.css';

const PlayerInfoButton = ({ playerId, nickname, children, className = '' }) => {
  const { t } = useTranslation();
  const { openPlayerInfo } = usePlayerInfo();

  const handlePlayerInfoClick = () => {
    openPlayerInfo(playerId, nickname);
  };

  return (
    <button
      className={`player-info-button ${className}`}
      onClick={handlePlayerInfoClick}
      title={t('playerInfo.title')}
    >
      {children}
    </button>
  );
};

export default PlayerInfoButton;
