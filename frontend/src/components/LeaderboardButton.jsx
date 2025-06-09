import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LeaderboardModal from './LeaderboardModal';
import { API_CONFIG, getApiUrl } from '../config';
import { handleApiResponse } from '../utils/apiUtils';
import './LeaderboardButton.css';

const LeaderboardButton = () => {
  const { t } = useTranslation();
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [digestData, setDigestData] = useState(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  const handleLeaderboardClick = async () => {
    setIsLeaderboardModalOpen(true);
    setIsLeaderboardLoading(true);
    setLeaderboardError(null);
    setLeaderboardData(null);
    setDigestData(null);

    try {
      // Fetch both leaderboard data and digest data in parallel
      const [leaderboardResponse, digestResponse] = await Promise.all([
        fetch(getApiUrl(API_CONFIG.ENDPOINTS.GET_MAPPINGS)),
        fetch(getApiUrl(API_CONFIG.ENDPOINTS.DIGEST))
      ]);

      const [leaderboardData, digestData] = await Promise.all([
        handleApiResponse(leaderboardResponse),
        handleApiResponse(digestResponse)
      ]);

      setLeaderboardData(leaderboardData);
      setDigestData(digestData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardError(error.message);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const closeLeaderboardModal = () => {
    setIsLeaderboardModalOpen(false);
    setLeaderboardData(null);
    setDigestData(null);
    setLeaderboardError(null);
  };

  return (
    <>
      <button
        className={`leaderboard-button ${isLeaderboardLoading ? 'loading' : ''}`}
        onClick={handleLeaderboardClick}
        disabled={isLeaderboardLoading}
      >
        {isLeaderboardLoading ? (
          <>
            <span className="leaderboard-spinner"></span>
            {t('leaderboard.loading')}
          </>
        ) : (
          <>
            🏆 {t('leaderboard.title')}
          </>
        )}
      </button>
      
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={closeLeaderboardModal}
        leaderboardData={leaderboardData}
        digestData={digestData}
        isLoading={isLeaderboardLoading}
        error={leaderboardError}
      />
    </>
  );
};

export default LeaderboardButton;
