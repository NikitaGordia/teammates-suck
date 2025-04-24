import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TeamCopyText, { generateClipboardText, copyTeamsToClipboard } from './TeamCopyText';
import { mockTeams } from '../test/test-utils';

describe('TeamCopyText Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<TeamCopyText teams={mockTeams} />);
    expect(screen.getByText('teams.copyTeams')).toBeInTheDocument();
    expect(screen.getByText('teams.format')).toBeInTheDocument();
    expect(screen.getByText('teams.copyToClipboard')).toBeInTheDocument();
  });

  it('displays the correct clipboard text format', () => {
    render(<TeamCopyText teams={mockTeams} />);
    const expectedText = 'Player1-1,Player3-1,Player2-2,Player4-2';
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('shows copied state when button is clicked', async () => {
    render(<TeamCopyText teams={mockTeams} />);
    const copyButton = screen.getByText('teams.copyToClipboard');

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(screen.getByText('teams.copied')).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Player1-1,Player3-1,Player2-2,Player4-2');
  });

  it('shows auto-copied message when autocopied prop is true', () => {
    render(<TeamCopyText teams={mockTeams} autocopied={true} />);
    expect(screen.getByText('teams.teamsAutoCopied')).toBeInTheDocument();
  });
});

describe('TeamCopyText Utility Functions', () => {
  it('generateClipboardText should format teams correctly', () => {
    const result = generateClipboardText(mockTeams);
    expect(result).toBe('Player1-1,Player3-1,Player2-2,Player4-2');
  });

  it('generateClipboardText should handle empty teams', () => {
    const result = generateClipboardText({ team1: [], team2: [] });
    expect(result).toBe('');
  });

  it('copyTeamsToClipboard should call clipboard API with correct text', async () => {
    await act(async () => {
      copyTeamsToClipboard(mockTeams);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Player1-1,Player3-1,Player2-2,Player4-2');
  });
});
