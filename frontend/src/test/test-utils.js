// Mock data for tests
export const mockTeams = {
  team1: [
    { nickname: 'Player1', score: 4, wins: 2, losses: 1, id: 1 },
    { nickname: 'Player3', score: 2, wins: 0, losses: 3, id: 3 }
  ],
  team2: [
    { nickname: 'Player2', score: 3, wins: 1, losses: 2, id: 2 },
    { nickname: 'Player4', score: 3, wins: 0, losses: 0, id: 4 }
  ]
};

// Mock players for PlayerTable tests
export const mockPlayers = [
  { nickname: 'Player1', score: 4, wins: 2, losses: 1, id: 1 },
  { nickname: 'Player2', score: 3, wins: 1, losses: 2, id: 2 },
  { nickname: 'Player3', score: 2, wins: 0, losses: 3, id: 3 }
];

// Mock handlers for component tests
export const mockHandlers = {
  onScoreChange: vi.fn(),
  onRemovePlayer: vi.fn(),
  onReorderPlayers: vi.fn(),
  onRemoveAllPlayers: vi.fn()
};

// Mock API response for team balancing
export const mockBalanceResponse = {
  teamA: [
    { nickname: 'Player1', score: 4, wins: 2, losses: 1, id: 1 },
    { nickname: 'Player3', score: 2, wins: 0, losses: 3, id: 3 }
  ],
  teamB: [
    { nickname: 'Player2', score: 3, wins: 1, losses: 2, id: 2 },
    { nickname: 'Player4', score: 3, wins: 0, losses: 0, id: 4 }
  ]
};

// Mock API response for game submission
export const mockSubmitGameResponse = {
  count: 4,
  message: "Game results recorded successfully"
};
