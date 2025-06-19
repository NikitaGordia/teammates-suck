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

const SPLIT_LINE_THRESHOLD = 2;

// Utility function to generate random nations assignments as a Map
export const generateNationsAssignments = (teams) => {
  const team1Shuffled = [...teams.team1].sort(() => Math.random() - 0.5);
  const team2Shuffled = [...teams.team2].sort(() => Math.random() - 0.5);

  const playersPerTeam = Math.max(team1Shuffled.length, team2Shuffled.length);
  if (playersPerTeam === 0) return new Map();

  const availableNations = [...NATIONS_POOL];
  const selectedNations = [];
  for (let i = 0; i < playersPerTeam; i++) {
    if (availableNations.length === 0) break;
    const randomIndex = Math.floor(Math.random() * availableNations.length);
    selectedNations.push(availableNations.splice(randomIndex, 1)[0]);
  }
  
  const assignments = new Map();
  for (let i = 0; i < playersPerTeam; i++) {
    const nation = selectedNations[i];
    if (nation) {
        if (team1Shuffled[i]) {
            assignments.set(team1Shuffled[i].id, nation);
        }
        if (team2Shuffled[i]) {
            // This assumes players are paired up and get the same nation.
            // If a player from team 1 and team 2 exist at the same index, they share a nation.
            assignments.set(team2Shuffled[i].id, nation);
        }
    }
  }

  return assignments;
};

export const localizeNations = (nationsAssignments, t) => {
  const localizedAssignments = new Map();
  for (const [playerId, nation] of nationsAssignments) {
    const translatedNation = t(`nations.${nation.toLowerCase()}`, nation);
    localizedAssignments.set(playerId, translatedNation);
  }
  return localizedAssignments;
};

// Utility function to generate clipboard text with inline nations
export const generateClipboardText = (teams, nationsAssignments = null) => {
  const team1ColorPrefix = "%color(2196F3)%";
  const team2ColorPrefix = "%color(FFC107)%";

  const hasNations = nationsAssignments instanceof Map && nationsAssignments.size > 0;

  const team1Players = teams.team1.map(player => 
    `${player.nickname}-1` + (hasNations && nationsAssignments.get(player.id) ? `(${nationsAssignments.get(player.id)})` : '')
  );

  const team2Players = teams.team2.map(player => 
    `${player.nickname}-2` + (hasNations && nationsAssignments.get(player.id) ? `(${nationsAssignments.get(player.id)})` : '')
  );

  const splitLines = (players) => {
    if (players.length > SPLIT_LINE_THRESHOLD) {
      const splitPoint = Math.ceil(players.length / 2);
      return [players.slice(0, splitPoint), players.slice(splitPoint)];
    }
    return players.length > 0 ? [players] : [];
  };

  const team1Lines = splitLines(team1Players);
  const team2Lines = splitLines(team2Players);

  const team1String = team1Lines.map(line => `${team1ColorPrefix}${line.join(',')}`).join('\n');
  const team2String = team2Lines.map(line => `${team2ColorPrefix}${line.join(',')}`).join('\n');

  const teamsText = [team1String, team2String]
    .filter(teamStr => teamStr.length > 0)
    .join('\n');

  return teamsText.length > 0 ? `\n${teamsText}` : '';
};

// Utility function to copy teams to clipboard
export const copyTeamsToClipboard = (teams, nationsAssignments = null) => {
  const clipboardText = generateClipboardText(teams, nationsAssignments);
  navigator.clipboard.writeText(clipboardText);
  return clipboardText;
};

const TeamCopyText = ({ teams, autocopied = false }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  // MODIFIED: State holds a Map now, not an array.
  const [nationsAssignments, setNationsAssignments] = useState(new Map());

  // When teams change, clear the nations map.
  useEffect(() => {
    setNationsAssignments(new Map());
  }, [teams]);

  const handleCopy = () => {
    // MODIFIED: Check map size instead of array length.
    copyTeamsToClipboard(teams, nationsAssignments.size > 0 ? localizeNations(nationsAssignments, t) : null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddNations = () => {
    const newNationsAssignments = generateNationsAssignments(teams);
    setNationsAssignments(newNationsAssignments);
    copyTeamsToClipboard(teams, localizeNations(newNationsAssignments, t));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCopied = copied || autocopied;

  // --- START of JSX rendering logic ---
  const hasNations = nationsAssignments.size > 0;

  // Helper function to create the display strings for a team's players
  const createPlayerDisplayStrings = (teamPlayers, teamNumber) => {
    return teamPlayers.map(player => {
      const nation = hasNations ? nationsAssignments.get(player.id) : null;
      // Translate nation for display, fallback to original name if no translation
      const translatedNation = nation ? t(`nations.${nation.toLowerCase()}`, nation) : '';
      return `${player.nickname}-${teamNumber}${translatedNation ? `(${translatedNation})` : ''}`;
    });
  };

  // Helper function to split players into multiple lines for display
  const getDisplayLines = (players) => {
    if (players.length > SPLIT_LINE_THRESHOLD) {
      const splitPoint = Math.ceil(players.length / 2);
      return [players.slice(0, splitPoint), players.slice(splitPoint)];
    }
    return players.length > 0 ? [players] : [];
  };

  const team1DisplayLines = getDisplayLines(createPlayerDisplayStrings(teams.team1, 1));
  const team2DisplayLines = getDisplayLines(createPlayerDisplayStrings(teams.team2, 2));
  // --- END of JSX rendering logic ---

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
          {/* MODIFIED: This section now dynamically renders lines and inline nations */}
          <div className="team-format">
            <div className="newline-indicator">↵</div>
            {team1DisplayLines.map((line, index) => (
              <div key={`t1-line-${index}`} className="team-line team1-line">
                <span className="color-prefix team1-color">%color(2196F3)%</span>
                {line.join(',')}
              </div>
            ))}
            {team2DisplayLines.map((line, index) => (
              <div key={`t2-line-${index}`} className="team-line team2-line">
                <span className="color-prefix team2-color">%color(FFC107)%</span>
                {line.join(',')}
              </div>
            ))}
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
          <><span className="checkmark"></span> {autocopied ? t('teams.teamsAutoCopied') : t('teams.copied')}</>
        ) : (
          <><svg className="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="white"/></svg> {t('teams.copyToClipboard')}</>
        )}
      </button>
    </div>
  );
};

export default TeamCopyText;