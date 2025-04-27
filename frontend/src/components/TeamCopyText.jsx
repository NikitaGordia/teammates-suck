import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './TeamCopyText.css';

// Utility function to generate clipboard text - exported for use in other components
export const generateClipboardText = (teams) => {
  // Create team strings with different color prefixes for each team
  const team1ColorPrefix = "%color(2196F3)%"; // Blue for Team 1
  const team2ColorPrefix = "%color(FFC107)%"; // Yellow for Team 2

  // Format Team 1 players
  const team1String = teams.team1.length > 0
    ? `${team1ColorPrefix}${teams.team1.map(player => `${player.nickname}-1`).join(',')}`
    : '';

  // Format Team 2 players
  const team2String = teams.team2.length > 0
    ? `${team2ColorPrefix}${teams.team2.map(player => `${player.nickname}-2`).join(',')}`
    : '';

  // Join teams with newlines, filtering out empty teams, and add a newline at the beginning
  const teamsText = ['', team1String, team2String]
    .filter(teamStr => teamStr.length > 0)
    .join('\n');

  // Add a newline at the beginning if there's any team content
  return teamsText.length > 0 ? `\n${teamsText}` : '';
};

// Utility function to copy teams to clipboard - exported for use in other components
export const copyTeamsToClipboard = (teams) => {
  const clipboardText = generateClipboardText(teams);
  navigator.clipboard.writeText(clipboardText);
  return clipboardText;
};

const TeamCopyText = ({ teams, autocopied = false }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyTeamsToClipboard(teams);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Use either manual copy state or auto-copied state from props
  const isCopied = copied || autocopied;

  return (
    <div className="copy-container">
      <h3>{t('teams.copyTeams')}</h3>
      <div className="copy-text-box">
        <div className="clipboard-section">
          <strong>{t('teams.format')}</strong><br />
          <div className="team-format">
            {/* Display newline at the beginning */}
            <div className="newline-indicator">↵</div>

            {/* Display Team 1 */}
            {teams.team1.length > 0 && (
              <div className="team-line team1-line">
                <span className="color-prefix team1-color">%color(2196F3)%</span>
                {teams.team1.map(player => `${player.nickname}-1`).join(',')}
              </div>
            )}

            {/* Display Team 2 */}
            {teams.team2.length > 0 && (
              <div className="team-line team2-line">
                <span className="color-prefix team2-color">%color(FFC107)%</span>
                {teams.team2.map(player => `${player.nickname}-2`).join(',')}
              </div>
            )}

            {/* Show message if no teams */}
            {teams.team1.length === 0 && teams.team2.length === 0 && (
              <div>{t('teams.noPlayers')}</div>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`copy-button ${isCopied ? 'copied' : ''}`}
      >
        {isCopied ? (
          <>
            <span className="checkmark"></span>
            {autocopied ? t('teams.teamsAutoCopied') : t('teams.copied')}
          </>
        ) : (
          <>
            <svg className="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="white"/>
            </svg>
            {t('teams.copyToClipboard')}
          </>
        )}
      </button>
    </div>
  );
};

export default TeamCopyText;
