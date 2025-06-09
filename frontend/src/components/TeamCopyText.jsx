import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TeamCopyText.css';

// Nations pool for random assignment
const NATIONS_POOL = [
  'Austria', 'France', 'England', 'Spain', 'Russia', 'Ukraine', 'Poland',
  'Sweden', 'Prussia', 'Venice', 'Turkey', 'Algeria', 'Netherlands',
  'Denmark', 'Portugal', 'Piedmont', 'Saxony', 'Bavaria', 'Hungary',
  'Switzerland', 'Scotland'
];

// Utility function to generate random nations assignments - exported for use in other components
export const generateNationsAssignments = (teams) => {
  // Shuffle using Array.prototype.sort and Math.random
  const team1Shuffled = [...teams.team1].sort(() => Math.random() - 0.5);
  const team2Shuffled = [...teams.team2].sort(() => Math.random() - 0.5);

  const playersPerTeam = Math.max(team1Shuffled.length, team2Shuffled.length);
  if (playersPerTeam === 0) return [];

  // Randomly select nations (with replacement), like Python's random.choice
  const selectedNations = Array.from({ length: playersPerTeam }, () => 
    NATIONS_POOL[Math.floor(Math.random() * NATIONS_POOL.length)]
  );

  // Create nation assignments
  const assignments = [];
  for (let i = 0; i < playersPerTeam; i++) {
    const team1Player = team1Shuffled[i]?.nickname || '';
    const team2Player = team2Shuffled[i]?.nickname || '';
    const nation = selectedNations[i];

    if (team1Player && team2Player) {
      assignments.push(`${nation} - ${team1Player}/${team2Player}`);
    } else if (team1Player) {
      assignments.push(`${nation} - ${team1Player}`);
    } else if (team2Player) {
      assignments.push(`${nation} - ${team2Player}`);
    }
  }

  return assignments;
};

// Utility function to generate clipboard text - exported for use in other components
export const generateClipboardText = (teams, withNations = false) => {
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

  // Join teams with newlines, filtering out empty teams
  const teamsText = [team1String, team2String]
    .filter(teamStr => teamStr.length > 0)
    .join('\n');

  let result = teamsText.length > 0 ? `\n${teamsText}` : '';

  if (withNations && (teams.team1.length > 0 || teams.team2.length > 0)) {
    const nationsAssignments = generateNationsAssignments(teams);
    if (nationsAssignments.length > 0) {
      result += '\n' + nationsAssignments.join('\n');
    }
  }

  return result;
};

// Utility function to copy teams to clipboard - exported for use in other components
export const copyTeamsToClipboard = (teams, withNations = false) => {
  const clipboardText = generateClipboardText(teams, withNations);
  navigator.clipboard.writeText(clipboardText);
  return clipboardText;
};

const TeamCopyText = ({ teams, autocopied = false }) => {

  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [withNations, setWithNations] = useState(false);
  const [nationsAssignments, setNationsAssignments] = useState([]);

  useEffect(() => {
    setWithNations(false);
    setNationsAssignments([]);
  }, [teams]);

  const handleCopy = () => {
    copyTeamsToClipboard(teams, withNations);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleAddNations = () => {
    const newNationsAssignments = generateNationsAssignments(teams);
    console.log(newNationsAssignments);
    const translatedAssignments = newNationsAssignments.map(pair => {
      // Split the pair into player and nation
      const [nation, player] = pair.split(' - ');
      return t('nations.' + nation.toLowerCase()) + ' - ' + player;
    });
    setNationsAssignments(translatedAssignments);
    setWithNations(true);

    // Automatically copy to clipboard with nations
    copyTeamsToClipboard(teams, true);
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
      <div className="copy-header">
        <h3>{t('teams.copyTeams')}</h3>
        <button
          onClick={handleAddNations}
          className="nations-button"
          disabled={teams.team1.length === 0 && teams.team2.length === 0}
        >
          {t('teams.addNations')}
        </button>
      </div>
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

            {/* Display nations assignments if they exist */}
            {withNations && nationsAssignments.length > 0 && (
              <div className="nations-section">
                {nationsAssignments.map((assignment, index) => (
                  <div key={index} className="nation-assignment">
                    {assignment}
                  </div>
                ))}
              </div>
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
