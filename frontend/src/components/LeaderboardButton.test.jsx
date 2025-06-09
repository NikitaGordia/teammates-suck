import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeaderboardButton from './LeaderboardButton';

// Mock the LeaderboardModal component
vi.mock('./LeaderboardModal', () => ({
  default: ({ isOpen, onClose }) => 
    isOpen ? <div data-testid="leaderboard-modal" onClick={onClose}>Leaderboard Modal</div> : null
}));

// Mock the config and API utils
vi.mock('../config', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      GET_MAPPINGS: '/users'
    }
  },
  getApiUrl: (endpoint) => `http://localhost:5000/api${endpoint}`
}));

vi.mock('../utils/apiUtils', () => ({
  handleApiResponse: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('LeaderboardButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leaderboard button correctly', () => {
    render(<LeaderboardButton />);

    expect(screen.getByText(/leaderboard.title/)).toBeInTheDocument();
  });

  it('opens leaderboard modal when button is clicked', async () => {
    const mockResponse = { 
      users: {
        'player1': { score: 4, wins: 10, losses: 5 },
        'player2': { score: 3, wins: 8, losses: 7 }
      }
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { handleApiResponse } = await import('../utils/apiUtils');
    handleApiResponse.mockResolvedValueOnce(mockResponse);

    render(<LeaderboardButton />);
    
    const leaderboardButton = screen.getByText(/leaderboard.title/);
    fireEvent.click(leaderboardButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-modal')).toBeInTheDocument();
    });
  });

  it('shows loading state when leaderboard is being fetched', async () => {
    // Mock a delayed response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 100))
    );

    render(<LeaderboardButton />);
    
    const leaderboardButton = screen.getByText(/leaderboard.title/);
    fireEvent.click(leaderboardButton);

    // Should show loading text
    expect(screen.getByText(/leaderboard.loading/)).toBeInTheDocument();
  });

  it('disables button during loading', async () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 100))
    );

    render(<LeaderboardButton />);
    
    const leaderboardButton = screen.getByText(/leaderboard.title/);
    fireEvent.click(leaderboardButton);

    // Button should be disabled during loading
    expect(leaderboardButton).toBeDisabled();
  });

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<LeaderboardButton />);
    
    const leaderboardButton = screen.getByText(/leaderboard.title/);
    fireEvent.click(leaderboardButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-modal')).toBeInTheDocument();
    });
  });
});
