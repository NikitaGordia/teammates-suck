import React, { useState } from 'react';

const TeamCopyText = ({ teams }) => {
  const [copied, setCopied] = useState(false);

  // Generate text representation of teams
  const generateTeamText = () => {
    // For display in the UI - formatted with teams
    let displayText = 'Team 1:\n';

    if (teams.team1.length === 0) {
      displayText += 'No players\n';
    } else {
      teams.team1.forEach(player => {
        displayText += `${player.nickname} (${player.score})\n`;
      });
    }

    displayText += '\nTeam 2:\n';

    if (teams.team2.length === 0) {
      displayText += 'No players\n';
    } else {
      teams.team2.forEach(player => {
        displayText += `${player.nickname} (${player.score})\n`;
      });
    }

    return displayText;
  };

  // Generate comma-separated list for clipboard
  const generateClipboardText = () => {
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

  const handleCopy = () => {
    const clipboardText = generateClipboardText();
    navigator.clipboard.writeText(clipboardText);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div>
      <h3 style={{ marginBottom: '10px' }}>Copy Teams</h3>
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        marginBottom: '15px',
        fontFamily: 'monospace'
      }}>
        <div style={{ whiteSpace: 'pre-line', marginBottom: '15px' }}>
          {generateTeamText().replace(/\\n/g, '\n')}
        </div>

        <div style={{
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px dashed #ccc',
          wordBreak: 'break-all'
        }}>
          <strong>Clipboard format:</strong><br />
          {generateClipboardText()}
        </div>
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: '10px 15px',
          backgroundColor: copied ? '#4CAF50' : '#607D8B',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  );
};

export default TeamCopyText;
