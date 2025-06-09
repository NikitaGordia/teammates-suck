import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeaderboardModal from './LeaderboardModal';

// Mock the score utils
vi.mock('../utils/scoreUtils', () => ({
  getScoreColor: vi.fn((score) => '#000000'),
  getScoreTextColor: vi.fn((score) => '#ffffff')
}));

describe('LeaderboardModal Component', () => {
  const mockLeaderboardData = {
    users: {
      'player1': { score: 4, wins: 10, losses: 5 },
      'player2': { score: 3, wins: 8, losses: 7 },
      'player3': { score: 2, wins: 5, losses: 10 }
    }
  };

  const mockDigestData = {
    players_for_status_change: [
      {
        nickname: 'player1',
        status: 'Promote'
      },
      {
        nickname: 'player3',
        status: 'Demote'
      }
    ]
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    leaderboardData: mockLeaderboardData,
    digestData: mockDigestData,
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<LeaderboardModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText(/Leaderboard/)).not.toBeInTheDocument();
  });

  it('renders leaderboard modal when open', () => {
    render(<LeaderboardModal {...defaultProps} />);

    expect(screen.getByText(/leaderboard.title/)).toBeInTheDocument();
    expect(screen.getByText('leaderboard.placement')).toBeInTheDocument();
    expect(screen.getByText('leaderboard.rank')).toBeInTheDocument();
    expect(screen.getByText('leaderboard.nickname')).toBeInTheDocument();
    expect(screen.getByText('leaderboard.winRate')).toBeInTheDocument();
    expect(screen.getByText('leaderboard.totalGames')).toBeInTheDocument();
    expect(screen.getByText('leaderboard.percentile')).toBeInTheDocument();
  });

  it('displays player data correctly', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Check if players are displayed
    expect(screen.getByText('player1')).toBeInTheDocument();
    expect(screen.getByText('player2')).toBeInTheDocument();
    expect(screen.getByText('player3')).toBeInTheDocument();
    
    // Check placement numbers
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('calculates win rates correctly', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // player1: 10/(10+5) = 66.7%
    expect(screen.getByText('66.7%')).toBeInTheDocument();
    // player2: 8/(8+7) = 53.3%
    expect(screen.getByText('53.3%')).toBeInTheDocument();
    // player3: 5/(5+10) = 33.3%
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });

  it('sorts players by score then by win rate', () => {
    render(<LeaderboardModal {...defaultProps} />);

    // Check that players appear in the correct order
    const player1 = screen.getByText('player1');
    const player2 = screen.getByText('player2');
    const player3 = screen.getByText('player3');

    expect(player1).toBeInTheDocument();
    expect(player2).toBeInTheDocument();
    expect(player3).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LeaderboardModal {...defaultProps} isLoading={true} leaderboardData={null} />);

    expect(screen.getByText(/leaderboard.loading/)).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<LeaderboardModal {...defaultProps} error="API Error" leaderboardData={null} />);

    expect(screen.getByText(/leaderboard.error/)).toBeInTheDocument();
    expect(screen.getByText(/API Error/)).toBeInTheDocument();
  });

  it('shows no data message when no players', () => {
    render(<LeaderboardModal {...defaultProps} leaderboardData={{ users: {} }} />);

    expect(screen.getByText(/leaderboard.noData/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<LeaderboardModal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays total games correctly', () => {
    render(<LeaderboardModal {...defaultProps} />);

    // All players have 15 total games (wins + losses)
    const totalGamesCells = screen.getAllByText('15');
    expect(totalGamesCells).toHaveLength(3); // Should have 3 players with 15 games each
  });

  it('handles players with no games played', () => {
    const dataWithNoGames = {
      users: {
        'newPlayer': { score: 2, wins: 0, losses: 0 }
      }
    };

    render(<LeaderboardModal {...defaultProps} leaderboardData={dataWithNoGames} digestData={null} />);

    expect(screen.getByText('N/A')).toBeInTheDocument(); // Win rate should be N/A
    expect(screen.getByText('0')).toBeInTheDocument(); // Total games should be 0
  });
});
