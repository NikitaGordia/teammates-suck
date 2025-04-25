import React from 'react';
import { useTranslation } from 'react-i18next';
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

const TeamsDisplay = ({ teams }) => {
  const { t } = useTranslation();
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

  // No longer need random check numbers

  return (
    <div className="teams-container">
      <div className="teams-grid">
        {/* Team 1 */}
        <div className={`team-card team1-card`}>
          <div className="team-header team1-header">
            <h3>{t('teams.team1')}</h3>
          </div>
          <div className="team-content">
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
        <div className={`team-card team2-card`}>
          <div className="team-header team2-header">
            <h3>{t('teams.team2')}</h3>
          </div>
          <div className="team-content">
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
    </div>
  );
};

export default TeamsDisplay;
