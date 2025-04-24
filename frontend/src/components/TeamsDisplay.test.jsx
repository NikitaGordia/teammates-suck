import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamsDisplay from './TeamsDisplay';
import { mockTeams } from '../test/test-utils';

describe('TeamsDisplay Component', () => {
  it('renders teams correctly', () => {
    render(<TeamsDisplay teams={mockTeams} />);
    
    // Check team headers
    expect(screen.getByText('teams.team1')).toBeInTheDocument();
    expect(screen.getByText('teams.team2')).toBeInTheDocument();
    
    // Check player names in teams
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();
    expect(screen.getByText('Player4')).toBeInTheDocument();
    
    // Check team totals
    const team1Total = mockTeams.team1.reduce((sum, player) => sum + player.score, 0);
    const team2Total = mockTeams.team2.reduce((sum, player) => sum + player.score, 0);
    
    expect(screen.getAllByText(team1Total.toString())[0]).toBeInTheDocument();
    expect(screen.getAllByText(team2Total.toString())[0]).toBeInTheDocument();
  });
  
  it('displays balance meter when teams have players', () => {
    render(<TeamsDisplay teams={mockTeams} />);
    
    // The balance percentage should be displayed
    expect(screen.getByText(/teams.balancePercentage/)).toBeInTheDocument();
  });
  
  it('shows "higher" and "lower" badges when team scores differ', () => {
    const unevenTeams = {
      team1: [{ nickname: 'Player1', score: 4 }],
      team2: [{ nickname: 'Player2', score: 2 }]
    };
    
    render(<TeamsDisplay teams={unevenTeams} />);
    
    expect(screen.getByText('teams.higher')).toBeInTheDocument();
    expect(screen.getByText('teams.lower')).toBeInTheDocument();
  });
  
  it('shows "equal" badges when team scores are the same', () => {
    const evenTeams = {
      team1: [{ nickname: 'Player1', score: 3 }],
      team2: [{ nickname: 'Player2', score: 3 }]
    };
    
    render(<TeamsDisplay teams={evenTeams} />);
    
    const equalBadges = screen.getAllByText('teams.equal');
    expect(equalBadges.length).toBe(2);
  });
  
  it('displays empty team message when a team has no players', () => {
    const emptyTeam2 = {
      team1: [{ nickname: 'Player1', score: 3 }],
      team2: []
    };
    
    render(<TeamsDisplay teams={emptyTeam2} />);
    
    expect(screen.getByText('teams.noPlayers')).toBeInTheDocument();
  });
  
  it('does not display balance meter when both teams are empty', () => {
    const emptyTeams = {
      team1: [],
      team2: []
    };
    
    render(<TeamsDisplay teams={emptyTeams} />);
    
    // The balance percentage should not be displayed
    expect(screen.queryByText(/teams.balancePercentage/)).not.toBeInTheDocument();
  });
});
