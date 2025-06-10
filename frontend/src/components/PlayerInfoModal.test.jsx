import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerInfoModal from './PlayerInfoModal';

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }) => <div data-testid="bar-chart">Bar Chart</div>,
  Line: ({ data, options }) => <div data-testid="line-chart">Line Chart</div>
}));

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  LineElement: {},
  PointElement: {},
  Title: {},
  Tooltip: {},
  Legend: {}
}));

const mockPlayerData = {
  games_history: [
    {
      admin_name: "admin",
      game_datetime: "2025-01-26 14:35:11",
      game_name: "DDM,Aowe,Alex_53,Apollon|VS|Artemida,Beethoven,Chekosan,CastieL",
      win: 1
    },
    {
      admin_name: "admin",
      game_datetime: "2025-01-25 16:20:30",
      game_name: "Team1|VS|Team2",
      win: 0
    }
  ],
  rank_history: [
    {
      change_date: "2025-01-31",
      change_type: "promotion",
      new_rank: "3.5",
      old_rank: "3.3"
    }
  ]
};

describe('PlayerInfoModal', () => {
  const defaultProps = {
    isOpen: false,
    onClose: vi.fn(),
    playerData: null,
    isLoading: false,
    error: null,
    nickname: 'TestPlayer'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(<PlayerInfoModal {...defaultProps} />);
    expect(screen.queryByText('Player Information')).not.toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<PlayerInfoModal {...defaultProps} isOpen={true} isLoading={true} />);
    expect(screen.getByText('playerInfo.loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<PlayerInfoModal {...defaultProps} isOpen={true} error="Test error" />);
    expect(screen.getByText('playerInfo.error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders no info state', () => {
    render(<PlayerInfoModal {...defaultProps} isOpen={true} />);
    expect(screen.getByText('playerInfo.noInfo')).toBeInTheDocument();
  });

  it('renders player data correctly', () => {
    render(<PlayerInfoModal {...defaultProps} isOpen={true} playerData={mockPlayerData} />);
    
    expect(screen.getByText('playerInfo.title')).toBeInTheDocument();
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PlayerInfoModal {...defaultProps} isOpen={true} onClose={onClose} playerData={mockPlayerData} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when escape key is pressed', () => {
    const onClose = vi.fn();
    render(<PlayerInfoModal {...defaultProps} isOpen={true} onClose={onClose} playerData={mockPlayerData} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });
});
