import React, { useState } from 'react';
import PlayerTable from './components/PlayerTable';
import AddPlayerForm from './components/AddPlayerForm';
import BalanceButton from './components/BalanceButton';
import TeamsDisplay from './components/TeamsDisplay';
import TeamCopyText from './components/TeamCopyText';
import BalancingInfo from './components/BalancingInfo';
import './App.css';

function App() {
  // Sample initial players
  const [players, setPlayers] = useState([
    { nickname: 'Alice', score: 3 },
    { nickname: 'Bob', score: 2 }
  ]);

  // Teams state
  const [teams, setTeams] = useState({ team1: [], team2: [] });

  // Handler functions
  const handleAddPlayer = (player) => {
    console.log('handleAddPlayer called with:', player);
    setPlayers([...players, player]);
  };

  const handleScoreChange = (index, newScore) => {
    console.log('handleScoreChange called with:', index, newScore);
    const updatedPlayers = [...players];
    updatedPlayers[index].score = newScore;
    setPlayers(updatedPlayers);
  };

  const handleRemovePlayer = (index) => {
    console.log('handleRemovePlayer called with:', index);
    const updatedPlayers = [...players];
    updatedPlayers.splice(index, 1);
    setPlayers(updatedPlayers);
  };

  const handleBalanceTeams = () => {
    console.log('handleBalanceTeams called');

    // Simple team balancing algorithm
    if (players.length === 0) {
      alert('Please add players first!');
      return;
    }

    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // Initialize teams
    const team1 = [];
    const team2 = [];
    let team1Score = 0;
    let team2Score = 0;

    // Distribute players to balance teams
    sortedPlayers.forEach(player => {
      if (team1Score <= team2Score) {
        team1.push(player);
        team1Score += player.score;
      } else {
        team2.push(player);
        team2Score += player.score;
      }
    });

    setTeams({ team1, team2 });
  };

  return (
    <div className="App">
      <h1 className="title">Team <span className="fancy-title">Balancer</span></h1>

      <div className="main-container">
        <div className="players-section">
          <h2>Players</h2>
          <PlayerTable
            players={players}
            onScoreChange={handleScoreChange}
            onRemovePlayer={handleRemovePlayer}
          />
          <AddPlayerForm onAddPlayer={handleAddPlayer} />
          <BalanceButton onBalanceTeams={handleBalanceTeams} />
          <BalancingInfo />
        </div>

        <div className="teams-section">
          <h2>Balanced Teams</h2>
          <TeamsDisplay teams={teams} />
          <TeamCopyText teams={teams} />
        </div>
      </div>
    </div>
  );
}

export default App;
