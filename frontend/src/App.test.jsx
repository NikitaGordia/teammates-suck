import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getApiUrl } from './config';

// Mock the API calls
vi.mock('./config', () => ({
  API_CONFIG: {
    BASE_URL: 'http://test-api',
    ENDPOINTS: {
      GET_MAPPINGS: '/api/users',
      BALANCE: '/api/balance',
    },
  },
  getApiUrl: (endpoint) => `http://test-api${endpoint}`,
}));

// Mock fetch
global.fetch = vi.fn();

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch for user data
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: {
          'Player1': {
            score: 4,
            wins: 2,
            losses: 1
          },
          'Player2': {
            score: 3,
            wins: 1,
            losses: 2
          },
          'Player3': {
            score: 2,
            wins: 0,
            losses: 3
          }
        },
        refreshed: new Date().toISOString(),
        force_refresh_prevented: false,
        seconds_until_next_refresh: 0
      })
    });
  });

  it('renders main components', async () => {
    await act(async () => {
      render(<App />);
    });

    // Check main sections
    expect(screen.getByText('app.players')).toBeInTheDocument();
    expect(screen.getByText('app.balancedTeams')).toBeInTheDocument();

    // Check language switcher
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();

    // Check developer contacts
    expect(screen.getByText('developer.contacts')).toBeInTheDocument();
    expect(screen.getByText('developer.discord')).toBeInTheDocument();
    expect(screen.getByText('developer.cossacks3')).toBeInTheDocument();
  });

  it('allows adding and removing players', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    // Add a player
    const nicknameInput = screen.getByPlaceholderText('players.addFirstPlayer');
    const addButton = screen.getByText('players.addPlayer');

    await act(async () => {
      await user.type(nicknameInput, 'TestPlayer');
      await user.click(addButton);
    });

    // Player should be added to the table
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();

    // Remove the player
    const removeButton = screen.getByText('players.remove');

    await act(async () => {
      await user.click(removeButton);
    });

    // Player should be removed
    expect(screen.queryByText('TestPlayer')).not.toBeInTheDocument();
    expect(screen.getByText('players.noPlayersYet')).toBeInTheDocument();
  });

  it('balances teams when balance button is clicked', async () => {
    const user = userEvent.setup();

    // Mock successful balance API response
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            teamA: [
              { nickname: 'Player1', score: 4, wins: 2, losses: 1 },
              { nickname: 'Player3', score: 2, wins: 0, losses: 3 },
            ],
            teamB: [
              { nickname: 'Player2', score: 3, wins: 1, losses: 2 },
              { nickname: 'TestPlayer', score: 3, wins: 0, losses: 0 },
            ]
          })
        });
      }

      // Default response for other fetch calls
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          users: {},
          refreshed: new Date().toISOString(),
          force_refresh_prevented: false,
          seconds_until_next_refresh: 0
        })
      });
    });

    await act(async () => {
      render(<App />);
    });

    // Add players
    const nicknameInput = screen.getByPlaceholderText('players.addFirstPlayer');
    const addButton = screen.getByText('players.addPlayer');

    // Add first player
    await act(async () => {
      await user.type(nicknameInput, 'TestPlayer');
      await user.click(addButton);
    });

    // Clear input for next player
    await act(async () => {
      fireEvent.change(nicknameInput, { target: { value: '' } });
    });

    // Add second player
    await act(async () => {
      await user.type(nicknameInput, 'Player1');
      await user.click(addButton);
    });

    // Clear input for next player
    await act(async () => {
      fireEvent.change(nicknameInput, { target: { value: '' } });
    });

    // Add third player
    await act(async () => {
      await user.type(nicknameInput, 'Player2');
      await user.click(addButton);
    });

    // Clear input for next player
    await act(async () => {
      fireEvent.change(nicknameInput, { target: { value: '' } });
    });

    // Add fourth player
    await act(async () => {
      await user.type(nicknameInput, 'Player3');
      await user.click(addButton);
    });

    // Click balance button
    const balanceButton = screen.getByText('balance.balanceTeams');

    await act(async () => {
      await user.click(balanceButton);

      // Wait for API call to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/balance'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    // Teams should be displayed
    expect(screen.getAllByText('Player1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Player2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Player3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TestPlayer').length).toBeGreaterThan(0);
  });
});
