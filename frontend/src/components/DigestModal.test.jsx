import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DigestModal from './DigestModal';

// Mock the chart components
vi.mock('./digest/RankChangesChart', () => ({
  default: ({ data }) => <div data-testid="rank-changes-chart">Rank Changes Chart: {data?.length || 0} items</div>
}));

vi.mock('./digest/TopPlayersChart', () => ({
  default: ({ data }) => <div data-testid="top-players-chart">Top Players Chart: {data?.length || 0} items</div>
}));

vi.mock('./digest/TopAdminsChart', () => ({
  default: ({ data }) => <div data-testid="top-admins-chart">Top Admins Chart: {data?.length || 0} items</div>
}));

vi.mock('./digest/ActivityCharts', () => ({
  default: ({ hourlyData, weeklyData, dailyData }) => (
    <div data-testid="activity-charts">
      Activity Charts: {hourlyData?.length || 0} hourly, {weeklyData?.length || 0} weekly, {dailyData?.length || 0} daily
    </div>
  )
}));

// Mock the config and utils
vi.mock('../config', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      DIGEST_GAMES: '/digest/games'
    }
  },
  getApiUrl: (endpoint) => `http://localhost:5000/api${endpoint}`
}));

const mockDigestData = {
  metadata: {
    generated_on: '2025-05-26T16:23:42.798365',
    period_start_date: '2025-05-01',
    period_end_date: '2025-05-31'
  },
  top_players: [
    { nickname: 'Player1', game_count: 10 },
    { nickname: 'Player2', game_count: 8 }
  ],
  top_admins: [
    { admin_name: 'Admin1', distinct_games_count: 15 }
  ],
  players_for_status_change: [
    {
      nickname: 'Player3',
      status: 'Promote',
      win_rate_percentage: 75.5,
      current_score: 3,
      new_score: 4,
      total_games_played: 10,
      wins: 8,
      losses: 2
    }
  ],
  hourly_activity: [
    { hour_of_day: '14', game_count: 5 }
  ],
  weekly_activity_by_day: [
    { day_numeric: 1, day_name: 'Monday', game_count: 3 }
  ],
  total_activity_by_day_of_month: [
    { day_of_month: 15, game_count: 7 }
  ]
};

describe('DigestModal Component', () => {
  const defaultProps = {
    isOpen: false,
    onClose: vi.fn(),
    digestData: null,
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<DigestModal {...defaultProps} />);
    expect(screen.queryByText('Latest Digest')).not.toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(<DigestModal {...defaultProps} isOpen={true} isLoading={true} />);

    expect(screen.getByText('Latest Digest')).toBeInTheDocument();
    expect(screen.getByText('Generating digest...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to fetch data';
    render(<DigestModal {...defaultProps} isOpen={true} error={errorMessage} />);

    expect(screen.getByText('Latest Digest')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load digest data/)).toBeInTheDocument();
  });

  it('renders digest data correctly', () => {
    render(<DigestModal {...defaultProps} isOpen={true} digestData={mockDigestData} />);

    expect(screen.getByText('Latest Digest')).toBeInTheDocument();
    expect(screen.getByText(/Generated on/)).toBeInTheDocument();
    expect(screen.getByText(/Period:/)).toBeInTheDocument();

    // Check if chart components are rendered
    expect(screen.getByTestId('rank-changes-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-players-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-admins-chart')).toBeInTheDocument();
    expect(screen.getByTestId('activity-charts')).toBeInTheDocument();

    // Check download button
    expect(screen.getByText(/Download All Games Data/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<DigestModal {...defaultProps} isOpen={true} onClose={onCloseMock} digestData={mockDigestData} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', () => {
    const onCloseMock = vi.fn();
    render(<DigestModal {...defaultProps} isOpen={true} onClose={onCloseMock} digestData={mockDigestData} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
