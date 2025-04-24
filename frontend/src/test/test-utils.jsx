import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

// Mock data for testing
export const mockPlayers = [
  { nickname: 'Player1', score: 4 },
  { nickname: 'Player2', score: 3 },
  { nickname: 'Player3', score: 2 },
];

export const mockTeams = {
  team1: [
    { nickname: 'Player1', score: 4 },
    { nickname: 'Player3', score: 2 },
  ],
  team2: [
    { nickname: 'Player2', score: 3 },
    { nickname: 'Player4', score: 3 },
  ],
};

export const mockScoreMappings = {
  'Player1': 4,
  'Player2': 3,
  'Player3': 2,
  'Player4': 3,
  'Player5': 1,
};

// Custom render function
export function renderWithProviders(ui, options = {}) {
  return render(ui, { ...options });
}

// Mock functions
export const mockHandlers = {
  onAddPlayer: vi.fn(),
  onRemovePlayer: vi.fn(),
  onScoreChange: vi.fn(),
  onBalanceTeams: vi.fn(),
  onRandomnessChange: vi.fn(),
};
