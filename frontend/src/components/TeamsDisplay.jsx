import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_CONFIG, getApiUrl } from '../config';
import { handleApiResponse } from '../utils/apiUtils';
import { validateAdminSecret } from '../utils/adminUtils';
import { getCookie, setCookie, COOKIE_NAMES } from '../utils/cookieUtils';
import AdminSecretModal from './AdminSecretModal';
import './TeamsDisplay.css';

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

const TeamsDisplay = ({ teams, onGameSubmitted }) => {
  const { t } = useTranslation();
  const [winningTeam, setWinningTeam] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Calculate total score for each team
  const team1Score = teams.team1.reduce((sum, player) => sum + player.score, 0);
  const team2Score = teams.team2.reduce((sum, player) => sum + player.score, 0);

  // Calculate score difference and balance percentage
  const scoreDifference = Math.abs(team1Score - team2Score);
  const totalScore = team1Score + team2Score;
  const balancePercentage = totalScore === 0 ? 100 : Math.max(0, 100 - (scoreDifference / totalScore * 100));

  // Determine which team has higher score
  const team1Higher = team1Score > team2Score;
  const team2Higher = team2Score > team1Score;
  const equalScores = team1Score === team2Score;

  // Determine balance quality
  let balanceQuality = '';
  let balanceDescription = '';

  if (balancePercentage >= 95) {
    balanceQuality = 'meter-perfect';
    balanceDescription = t('teams.balancePerfect');
  } else if (balancePercentage >= 85) {
    balanceQuality = 'meter-good';
    balanceDescription = t('teams.balanceGood');
  } else if (balancePercentage >= 70) {
    balanceQuality = 'meter-fair';
    balanceDescription = t('teams.balanceFair');
  } else {
    balanceQuality = 'meter-poor';
    balanceDescription = t('teams.balancePoor');
  }

  // Function to handle team selection
  const handleTeamSelect = (team) => {
    // If already submitting, do nothing
    if (isSubmitting) return;

    // If the team is already selected, deselect it
    if (winningTeam === team) {
      setWinningTeam(null);
      return;
    }

    // Set the winning team
    setWinningTeam(team);

    // Reset submission states
    setSubmitSuccess(false);
    setSubmitError(null);

    // Only proceed with submission if both teams have players
    if (teams.team1.length === 0 || teams.team2.length === 0) {
      setSubmitError(t('teams.notEnoughPlayers'));
      return;
    }

    // Store the selected team
    setSelectedTeam(team);

    // Check if we have a saved admin secret
    const savedAdminSecret = getCookie(COOKIE_NAMES.ADMIN_SECRET);

    if (savedAdminSecret) {
      // If we have a saved secret, use it directly
      handleAdminSecretSubmit(savedAdminSecret);
    } else {
      // Otherwise show the admin secret modal
      setShowAdminModal(true);
    }
  };

  // Check for saved admin secret on component mount
  useEffect(() => {
    const savedAdminSecret = getCookie(COOKIE_NAMES.ADMIN_SECRET);
    // We don't need to do anything with it here, just making sure it's available
    // when needed in handleTeamSelect
  }, []);

  // Function to handle admin secret submission
  const handleAdminSecretSubmit = async (adminSecret) => {
    // Close the modal
    setShowAdminModal(false);

    // Validate the admin secret
    const validationError = validateAdminSecret(adminSecret, t);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    // Save the admin secret in a cookie (30 days expiration)
    setCookie(COOKIE_NAMES.ADMIN_SECRET, adminSecret, 30);

    // Start submission
    setIsSubmitting(true);

    try {
      // Create a game name with date and players
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const team1Names = teams.team1.map(player => player.nickname).join(',');
      const team2Names = teams.team2.map(player => player.nickname).join(',');
      const gameName = `${date}-${team1Names}vs${team2Names}`;

      // Prepare the request data
      const requestData = {
        teamA: teams.team1.map(player => ({ nickname: player.nickname })),
        teamB: teams.team2.map(player => ({ nickname: player.nickname })),
        winningTeam: selectedTeam === 'team1' ? 'A' : 'B',
        gameName: gameName,
        adminPasscode: adminSecret
      };

      // Make the POST request
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBMIT_GAME), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        mode: 'cors',
      });

      // Use the handleApiResponse utility to check for errors
      const data = await handleApiResponse(response);
      console.log('Game submission successful:', data);

      // Set success state
      setSubmitSuccess(true);

      // Call the callback to notify parent component that a game was submitted
      if (onGameSubmitted && typeof onGameSubmitted === 'function') {
        // Pass the teams data to the callback
        onGameSubmitted({
          teamA: requestData.teamA.map(player => player.nickname),
          teamB: requestData.teamB.map(player => player.nickname),
          winningTeam: requestData.winningTeam
        });
      }

      // Reset winning team immediately since we'll be clearing the teams
      setWinningTeam(null);

      // Keep success message visible for 2 seconds, then clear it
      setTimeout(() => {
        setSubmitSuccess(false);
        setSubmitError(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting game:', error);
      // The error message will already contain the API error message if present
      // because handleApiResponse extracts it from the 'error' key in the response
      setSubmitError(error.message || t('teams.submissionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle admin modal close
  const handleAdminModalClose = () => {
    setShowAdminModal(false);
    // If user cancels, reset the winning team selection
    setWinningTeam(null);
  };

  return (
    <div className="teams-container">
      <div className="teams-grid">
        {/* Team 1 */}
        <div
          className={`team-card team1-card ${winningTeam === 'team1' ? 'winning-team' : ''} ${teams.team1.length === 0 || teams.team2.length === 0 ? 'team-disabled' : 'team-clickable'}`}
          onClick={() => teams.team1.length > 0 && teams.team2.length > 0 && handleTeamSelect('team1')}
          style={{ cursor: teams.team1.length > 0 && teams.team2.length > 0 ? 'pointer' : 'default' }}
        >
          <div className="team-header team1-header">
            <h3>
              {t('teams.team1')}
              {winningTeam === 'team1' && (
                <span className="winning-badge">{t('teams.winner')}</span>
              )}
            </h3>

          </div>
          <div className="team-content">
            {teams.team1.length > 0 && teams.team2.length > 0 && (
              <div className="click-indicator-center">
                <span className="click-text">{t('teams.clickToSelect')}</span>
              </div>
            )}
            {teams.team1.length > 0 ? (
              <ul className="player-list">
                {teams.team1.map((player, index) => (
                  <li key={index} className="player-item">
                    <span className="player-name">
                      {player.nickname}
                      {index === 0 && teams.team1.length > 0 && (
                        <span className="player-leader-tag">{t('teams.leader')}</span>
                      )}
                    </span>
                    <div className="player-stats">
                      {player.wins !== undefined && player.losses !== undefined && (
                        <span className="player-wl">
                          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{player.wins}</span>
                          <span style={{ margin: '0 2px' }}>/</span>
                          <span style={{ color: '#F44336', fontWeight: 'bold' }}>{player.losses}</span>
                        </span>
                      )}
                      <span className="player-score" style={{ backgroundColor: getScoreColor(player.score) }}>
                        {player.score}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-team">{t('teams.noPlayers')}</div>
            )}
          </div>

          {/* Paycheck for Team 1 */}
          {teams.team1.length > 0 && (
            <div className="paycheck">
              <div className="paycheck-amount">
                <span className="paycheck-label">{t('teams.total')}:</span>
                <div>
                  <span className="paycheck-value">{team1Score}</span>
                  {team1Higher && !equalScores && (
                    <span className="paycheck-badge higher-score">{t('teams.higher')}</span>
                  )}
                  {team2Higher && !equalScores && (
                    <span className="paycheck-badge lower-score">{t('teams.lower')}</span>
                  )}
                  {equalScores && totalScore > 0 && (
                    <span className="paycheck-badge equal-score">{t('teams.equal')}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div
          className={`team-card team2-card ${winningTeam === 'team2' ? 'winning-team' : ''} ${teams.team1.length === 0 || teams.team2.length === 0 ? 'team-disabled' : 'team-clickable'}`}
          onClick={() => teams.team1.length > 0 && teams.team2.length > 0 && handleTeamSelect('team2')}
          style={{ cursor: teams.team1.length > 0 && teams.team2.length > 0 ? 'pointer' : 'default' }}
        >
          <div className="team-header team2-header">
            <h3>
              {t('teams.team2')}
              {winningTeam === 'team2' && (
                <span className="winning-badge">{t('teams.winner')}</span>
              )}
            </h3>

          </div>
          <div className="team-content">
            {teams.team1.length > 0 && teams.team2.length > 0 && (
              <div className="click-indicator-center">
                <span className="click-text">{t('teams.clickToSelect')}</span>
              </div>
            )}
            {teams.team2.length > 0 ? (
              <ul className="player-list">
                {teams.team2.map((player, index) => (
                  <li key={index} className="player-item">
                    <span className="player-name">
                      {player.nickname}
                      {index === 0 && teams.team2.length > 0 && (
                        <span className="player-leader-tag">{t('teams.leader')}</span>
                      )}
                    </span>
                    <div className="player-stats">
                      {player.wins !== undefined && player.losses !== undefined && (
                        <span className="player-wl">
                          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{player.wins}</span>
                          <span style={{ margin: '0 2px' }}>/</span>
                          <span style={{ color: '#F44336', fontWeight: 'bold' }}>{player.losses}</span>
                        </span>
                      )}
                      <span className="player-score" style={{ backgroundColor: getScoreColor(player.score) }}>
                        {player.score}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-team">{t('teams.noPlayers')}</div>
            )}
          </div>

          {/* Paycheck for Team 2 */}
          {teams.team2.length > 0 && (
            <div className="paycheck">
              <div className="paycheck-amount">
                <span className="paycheck-label">{t('teams.total')}:</span>
                <div>
                  <span className="paycheck-value">{team2Score}</span>
                  {team2Higher && !equalScores && (
                    <span className="paycheck-badge higher-score">{t('teams.higher')}</span>
                  )}
                  {team1Higher && !equalScores && (
                    <span className="paycheck-badge lower-score">{t('teams.lower')}</span>
                  )}
                  {equalScores && totalScore > 0 && (
                    <span className="paycheck-badge equal-score">{t('teams.equal')}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status message for game submission */}
      {(isSubmitting || submitSuccess || submitError) && (
        <div className={`submission-status ${submitSuccess ? 'success' : submitError ? 'error' : ''}`}>
          {isSubmitting && <div className="loading-spinner"></div>}
          {isSubmitting && <span>{t('teams.submitting')}</span>}
          {submitSuccess && <span>{t('teams.submissionSuccess')}</span>}
          {submitError && <span>{t('teams.submissionError')}: {submitError}</span>}
        </div>
      )}

      {/* Balance meter - only show when there are players */}
      {(teams.team1.length > 0 || teams.team2.length > 0) && (
        <div className="balance-meter">
          <div className="meter-label">{balanceDescription}</div>
          <div className="meter-bar">
            <div
              className={`meter-fill ${balanceQuality}`}
              style={{ width: `${balancePercentage}%` }}
            ></div>
          </div>
          <div className="meter-value">
            {t('teams.balancePercentage', { percentage: balancePercentage.toFixed(1) })}
            {scoreDifference > 0 && t('teams.pointDifference', { difference: scoreDifference })}
          </div>
        </div>
      )}

      {/* Admin Secret Modal */}
      <AdminSecretModal
        isOpen={showAdminModal}
        onClose={handleAdminModalClose}
        onSubmit={handleAdminSecretSubmit}
      />
    </div>
  );
};

export default TeamsDisplay;
