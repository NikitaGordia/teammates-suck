import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamsDisplay from './TeamsDisplay';
import { mockTeams, mockSubmitGameResponse } from '../test/test-utils';
import { API_CONFIG, getApiUrl } from '../config';

// Mock AdminSecretModal component
vi.mock('./AdminSecretModal', () => ({
  default: ({ isOpen, onClose, onSubmit }) => {
    if (!isOpen) return null;

    // Immediately submit with a test admin secret when modal is opened
    setTimeout(() => {
      onSubmit('admin:testpassword');
    }, 0);

    return (
      <div data-testid="admin-secret-modal">
        <button onClick={() => onSubmit('admin:testpassword')}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('TeamsDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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

    // Check for leader tags
    expect(screen.getAllByText('teams.leader').length).toBe(2); // One for each team

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

    // Only one leader tag should be present (for team1)
    expect(screen.getAllByText('teams.leader').length).toBe(1);
  });

  it('does not display balance meter when both teams are empty', () => {
    const emptyTeams = {
      team1: [],
      team2: []
    };

    render(<TeamsDisplay teams={emptyTeams} />);

    // The balance percentage should not be displayed
    expect(screen.queryByText(/teams.balancePercentage/)).not.toBeInTheDocument();

    // No leader tags should be present
    expect(screen.queryByText('teams.leader')).not.toBeInTheDocument();
  });

  it('highlights team as winner when clicked', async () => {
    render(<TeamsDisplay teams={mockTeams} />);

    // Click on Team 1
    const team1Card = screen.getByText('teams.team1').closest('.team-card');
    fireEvent.click(team1Card);

    // Team 1 should have the winning-team class
    expect(team1Card).toHaveClass('winning-team');

    // Winner badge should be displayed
    expect(screen.getByText('teams.winner')).toBeInTheDocument();
  });

  it('submits game result when a team is selected and calls onGameSubmitted', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubmitGameResponse)
    });

    // Mock callback function
    const mockOnGameSubmitted = vi.fn().mockImplementation(({ teamA, teamB, winningTeam }) => {
      // Simulate what App.jsx does - clear the teams
      render(<TeamsDisplay teams={{ team1: [], team2: [] }} onGameSubmitted={mockOnGameSubmitted} />);
    });

    render(<TeamsDisplay teams={mockTeams} onGameSubmitted={mockOnGameSubmitted} />);

    // Click on Team 1
    const team1Card = screen.getByText('teams.team1').closest('.team-card');
    fireEvent.click(team1Card);

    // Wait for the API call to be made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        getApiUrl(API_CONFIG.ENDPOINTS.SUBMIT_GAME),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
    });

    // Check that the request body contains the correct data
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.teamA).toEqual(mockTeams.team1.map(player => ({ nickname: player.nickname })));
    expect(requestBody.teamB).toEqual(mockTeams.team2.map(player => ({ nickname: player.nickname })));
    expect(requestBody.winningTeam).toBe('A');
    expect(requestBody.gameName).toContain('vs');
    expect(requestBody.adminPasscode).toBe('admin:testpassword');

    // Success message should be displayed
    await waitFor(() => {
      expect(screen.getByText('teams.submissionSuccess')).toBeInTheDocument();
    });

    // Check that the onGameSubmitted callback was called with the correct data
    expect(mockOnGameSubmitted).toHaveBeenCalledTimes(1);
    expect(mockOnGameSubmitted).toHaveBeenCalledWith({
      teamA: mockTeams.team1.map(player => player.nickname),
      teamB: mockTeams.team2.map(player => player.nickname),
      winningTeam: 'A'
    });

    // Winning team should be reset immediately
    expect(team1Card).not.toHaveClass('winning-team');

    // After the callback is called, teams should be empty
    await waitFor(() => {
      // Check that the empty team message is displayed for both teams
      expect(screen.getAllByText('teams.noPlayers').length).toBe(2);
    });
  });

  it('shows error message when API call fails', async () => {
    // Mock failed API response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<TeamsDisplay teams={mockTeams} />);

    // Click on Team 2
    const team2Card = screen.getByText('teams.team2').closest('.team-card');
    fireEvent.click(team2Card);

    // Wait for the admin modal to appear and auto-submit
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/teams.submissionError/)).toBeInTheDocument();
    });
  });

  it('prevents submission when teams are empty', async () => {
    const emptyTeam2 = {
      team1: [{ nickname: 'Player1', score: 3 }],
      team2: []
    };

    render(<TeamsDisplay teams={emptyTeam2} />);

    // Click on Team 1
    const team1Card = screen.getByText('teams.team1').closest('.team-card');
    fireEvent.click(team1Card);

    // Error message should be displayed
    expect(screen.getByText(/teams.notEnoughPlayers/)).toBeInTheDocument();

    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows admin secret modal when a team is selected', async () => {
    // Override the auto-submit behavior for this test
    vi.doMock('./AdminSecretModal', () => ({
      default: ({ isOpen, onClose, onSubmit }) => {
        if (!isOpen) return null;
        return (
          <div data-testid="admin-secret-modal">
            <button data-testid="submit-button" onClick={() => onSubmit('admin:testpassword')}>Submit</button>
            <button data-testid="cancel-button" onClick={onClose}>Cancel</button>
          </div>
        );
      }
    }), { virtual: true });

    // Re-import TeamsDisplay to use the new mock
    const { default: TeamsDisplayWithMock } = await import('./TeamsDisplay');

    render(<TeamsDisplayWithMock teams={mockTeams} />);

    // Click on Team 1
    const team1Card = screen.getByText('teams.team1').closest('.team-card');
    fireEvent.click(team1Card);

    // Admin secret modal should be displayed
    expect(screen.getByTestId('admin-secret-modal')).toBeInTheDocument();

    // Reset the mock for other tests
    vi.resetModules();
  });
});
