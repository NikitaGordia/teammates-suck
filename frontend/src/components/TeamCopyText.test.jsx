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

  it('displays the correct team format in the UI', () => {
    render(<TeamCopyText teams={mockTeams} />);

    // Check for newline indicator
    expect(screen.getByText('↵')).toBeInTheDocument();

    // Check for color prefixes
    expect(screen.getByText('%color(2196F3)%')).toBeInTheDocument(); // Team 1 blue
    expect(screen.getByText('%color(FFC107)%')).toBeInTheDocument(); // Team 2 yellow

    // Check for team content
    expect(screen.getByText('Player1-1,Player3-1')).toBeInTheDocument();
    expect(screen.getByText('Player2-2,Player4-2')).toBeInTheDocument();
  });

  it('shows copied state when button is clicked', async () => {
    render(<TeamCopyText teams={mockTeams} />);
    const copyButton = screen.getByText('teams.copyToClipboard');

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(screen.getByText('teams.copied')).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('\n%color(2196F3)%Player1-1,Player3-1\n%color(FFC107)%Player2-2,Player4-2');
  });

  it('shows auto-copied message when autocopied prop is true', () => {
    render(<TeamCopyText teams={mockTeams} autocopied={true} />);
    expect(screen.getByText('teams.teamsAutoCopied')).toBeInTheDocument();
  });

  it('displays no players message when teams are empty', () => {
    render(<TeamCopyText teams={{ team1: [], team2: [] }} />);
    expect(screen.getByText('teams.noPlayers')).toBeInTheDocument();
  });
});

describe('TeamCopyText Utility Functions', () => {
  it('generateClipboardText should format teams correctly', () => {
    const result = generateClipboardText(mockTeams);
    expect(result).toBe('\n%color(2196F3)%Player1-1,Player3-1\n%color(FFC107)%Player2-2,Player4-2');
  });

  it('generateClipboardText should handle empty teams', () => {
    const result = generateClipboardText({ team1: [], team2: [] });
    expect(result).toBe('');
  });

  it('copyTeamsToClipboard should call clipboard API with correct text', async () => {
    await act(async () => {
      copyTeamsToClipboard(mockTeams);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('\n%color(2196F3)%Player1-1,Player3-1\n%color(FFC107)%Player2-2,Player4-2');
  });
});
