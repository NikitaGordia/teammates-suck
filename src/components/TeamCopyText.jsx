import React, { useState } from 'react';
import './TeamCopyText.css';

// Utility function to generate clipboard text - exported for use in other components
export const generateClipboardText = (teams) => {
  const playersList = [];

  // Add Team 1 players
  teams.team1.forEach(player => {
    playersList.push(`${player.nickname}-1`);
  });

  // Add Team 2 players
  teams.team2.forEach(player => {
    playersList.push(`${player.nickname}-2`);
  });

  return playersList.join(',');
};

// Utility function to copy teams to clipboard - exported for use in other components
export const copyTeamsToClipboard = (teams) => {
  const clipboardText = generateClipboardText(teams);
  navigator.clipboard.writeText(clipboardText);
  return clipboardText;
};

const TeamCopyText = ({ teams, autocopied = false }) => {
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
      <h3>Copy Teams</h3>
      <div className="copy-text-box">
        <div className="clipboard-section">
          <strong>Format:</strong><br />
          {generateClipboardText(teams)}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`copy-button ${isCopied ? 'copied' : ''}`}
      >
        {isCopied ? (
          <>
            <span className="checkmark"></span>
            {autocopied ? 'Teams automatically copied to clipboard!' : 'Copied!'}
          </>
        ) : (
          <>
            <svg className="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="white"/>
            </svg>
            Copy to Clipboard
          </>
        )}
      </button>
    </div>
  );
};

export default TeamCopyText;
