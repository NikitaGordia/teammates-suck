import React from 'react';

const TeamsDisplay = ({ teams }) => {
  // Calculate total score for each team
  const team1Score = teams.team1.reduce((sum, player) => sum + player.score, 0);
  const team2Score = teams.team2.reduce((sum, player) => sum + player.score, 0);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Team 1 */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
          <h3 style={{ marginBottom: '10px', color: '#2196F3' }}>Team 1</h3>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Total Score: {team1Score}</p>

          {teams.team1.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {teams.team1.map((player, index) => (
                <li key={index} style={{ padding: '8px 0', borderBottom: index < teams.team1.length - 1 ? '1px solid #eee' : 'none' }}>
                  {player.nickname} ({player.score})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No players yet</p>
          )}
        </div>

        {/* Team 2 */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
          <h3 style={{ marginBottom: '10px', color: '#F44336' }}>Team 2</h3>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Total Score: {team2Score}</p>

          {teams.team2.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {teams.team2.map((player, index) => (
                <li key={index} style={{ padding: '8px 0', borderBottom: index < teams.team2.length - 1 ? '1px solid #eee' : 'none' }}>
                  {player.nickname} ({player.score})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No players yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsDisplay;
