import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TeamCopyText, { generateClipboardText, copyTeamsToClipboard, generateNationsAssignments } from './TeamCopyText';
import { mockTeams } from '../test/test-utils';

describe('TeamCopyText Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<TeamCopyText teams={mockTeams} />);
    expect(screen.getByText('teams.copyTeams')).toBeInTheDocument();
    expect(screen.getByText('teams.addNations')).toBeInTheDocument();
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

  it('enables nations button when teams have players', () => {
    render(<TeamCopyText teams={mockTeams} />);
    const nationsButton = screen.getByText('teams.addNations');
    expect(nationsButton).not.toBeDisabled();
  });

  it('disables nations button when no players', () => {
    const emptyTeams = { team1: [], team2: [] };
    render(<TeamCopyText teams={emptyTeams} />);
    const nationsButton = screen.getByText('teams.addNations');
    expect(nationsButton).toBeDisabled();
  });

  it('generates nations and copies to clipboard when nations button is clicked', async () => {
    render(<TeamCopyText teams={mockTeams} />);
    const nationsButton = screen.getByText('teams.addNations');

    await act(async () => {
      fireEvent.click(nationsButton);
    });

    expect(screen.getByText('teams.copied')).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // Check that the clipboard text includes nations format
    const clipboardCall = navigator.clipboard.writeText.mock.calls[0][0];
    expect(clipboardCall).toContain('%color(2196F3)%Player1-1,Player3-1');
    expect(clipboardCall).toContain('%color(FFC107)%Player2-2,Player4-2');
    expect(clipboardCall).toContain(' - '); // Nations format includes " - "
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

  it('generateClipboardText should format teams with nations correctly', () => {
    const result = generateClipboardText(mockTeams, true);
    expect(result).toContain('%color(2196F3)%Player1-1,Player3-1');
    expect(result).toContain('%color(FFC107)%Player2-2,Player4-2');
    expect(result).toContain(' - '); // Nations format
    expect(result).toContain('/'); // Player pairing format
  });

  it('generateClipboardText should handle empty teams', () => {
    const result = generateClipboardText({ team1: [], team2: [] });
    expect(result).toBe('');
  });

  it('generateClipboardText should handle empty teams with nations', () => {
    const result = generateClipboardText({ team1: [], team2: [] }, true);
    expect(result).toBe('');
  });

  it('copyTeamsToClipboard should call clipboard API with correct text', async () => {
    await act(async () => {
      copyTeamsToClipboard(mockTeams);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('\n%color(2196F3)%Player1-1,Player3-1\n%color(FFC107)%Player2-2,Player4-2');
  });

  it('copyTeamsToClipboard should call clipboard API with nations when requested', async () => {
    await act(async () => {
      copyTeamsToClipboard(mockTeams, true);
    });
    const clipboardCall = navigator.clipboard.writeText.mock.calls[0][0];
    expect(clipboardCall).toContain('%color(2196F3)%Player1-1,Player3-1');
    expect(clipboardCall).toContain('%color(FFC107)%Player2-2,Player4-2');
    expect(clipboardCall).toContain(' - ');
  });

  it('generateNationsAssignments should create correct assignments', () => {
    const assignments = generateNationsAssignments(mockTeams);
    expect(assignments).toHaveLength(2); // Max team size is 2
    assignments.forEach(assignment => {
      expect(assignment).toMatch(/^[A-Za-z]+ - [A-Za-z0-9_]+\/[A-Za-z0-9_]+$/);
    });
  });

  it('generateNationsAssignments should handle empty teams', () => {
    const assignments = generateNationsAssignments({ team1: [], team2: [] });
    expect(assignments).toHaveLength(0);
  });

  it('generateNationsAssignments should handle uneven teams', () => {
    const unevenTeams = {
      team1: [{ nickname: 'Player1' }, { nickname: 'Player2' }, { nickname: 'Player3' }],
      team2: [{ nickname: 'Player4' }]
    };
    const assignments = generateNationsAssignments(unevenTeams);
    expect(assignments).toHaveLength(3); // Max team size is 3
    expect(assignments[0]).toContain('Player1/Player4');
    expect(assignments[1]).toContain('Player2');
    expect(assignments[2]).toContain('Player3');
  });
});
