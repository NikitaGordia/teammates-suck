import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerTable from './PlayerTable';
import { mockPlayers, mockHandlers } from '../test/test-utils';

describe('PlayerTable Component', () => {
  it('renders correctly with players', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        onScoreChange={mockHandlers.onScoreChange}
        onRemovePlayer={mockHandlers.onRemovePlayer}
        onReorderPlayers={mockHandlers.onReorderPlayers}
        onRemoveAllPlayers={mockHandlers.onRemoveAllPlayers}
      />
    );

    // Check column headers
    expect(screen.getByText('players.nickname')).toBeInTheDocument();
    expect(screen.getByText('players.score')).toBeInTheDocument();

    // With players, we should see the "Remove All Players" button instead of "Actions"
    expect(screen.getByText('players.removeAll')).toBeInTheDocument();

    // Check player data
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();

    // Check remove buttons
    const removeButtons = screen.getAllByText('players.remove');
    expect(removeButtons.length).toBe(3);
  });

  it('renders empty state message when no players', () => {
    render(
      <PlayerTable
        players={[]}
        onScoreChange={mockHandlers.onScoreChange}
        onRemovePlayer={mockHandlers.onRemovePlayer}
        onReorderPlayers={mockHandlers.onReorderPlayers}
        onRemoveAllPlayers={mockHandlers.onRemoveAllPlayers}
      />
    );

    // With no players, we should see "Actions" instead of "Remove All Players" button
    expect(screen.getByText('players.actions')).toBeInTheDocument();
    expect(screen.getByText('players.noPlayersYet')).toBeInTheDocument();
  });

  it('calls onRemovePlayer when remove button is clicked', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        onScoreChange={mockHandlers.onScoreChange}
        onRemovePlayer={mockHandlers.onRemovePlayer}
        onReorderPlayers={mockHandlers.onReorderPlayers}
        onRemoveAllPlayers={mockHandlers.onRemoveAllPlayers}
      />
    );

    const removeButtons = screen.getAllByText('players.remove');
    fireEvent.click(removeButtons[1]); // Click the second remove button

    expect(mockHandlers.onRemovePlayer).toHaveBeenCalledWith(1);
  });

  it('calls onScoreChange when score select is changed', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        onScoreChange={mockHandlers.onScoreChange}
        onRemovePlayer={mockHandlers.onRemovePlayer}
        onReorderPlayers={mockHandlers.onReorderPlayers}
        onRemoveAllPlayers={mockHandlers.onRemoveAllPlayers}
      />
    );

    // Get all select elements
    const selects = screen.getAllByRole('combobox');

    // Change the score of the first player
    fireEvent.change(selects[0], { target: { value: '2' } });

    expect(mockHandlers.onScoreChange).toHaveBeenCalledWith(0, 2);
  });

  it('calls onReorderPlayers when drag and drop is performed', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        onScoreChange={mockHandlers.onScoreChange}
        onRemovePlayer={mockHandlers.onRemovePlayer}
        onReorderPlayers={mockHandlers.onReorderPlayers}
        onRemoveAllPlayers={mockHandlers.onRemoveAllPlayers}
      />
    );

    // Get all table rows (excluding header row)
    const rows = screen.getAllByRole('row').slice(1);

    // Simulate drag start on the first row
    fireEvent.dragStart(rows[0]);

    // Simulate drag over on the third row
    fireEvent.dragOver(rows[2]);

    // Simulate drop on the third row
    fireEvent.drop(rows[2]);

    // Check if onReorderPlayers was called with the reordered players array
    expect(mockHandlers.onReorderPlayers).toHaveBeenCalled();
  });

  it('calls onRemoveAllPlayers when remove all button is clicked', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        onScoreChange={mockHandlers.onScoreChange}
        onRemovePlayer={mockHandlers.onRemovePlayer}
        onReorderPlayers={mockHandlers.onReorderPlayers}
        onRemoveAllPlayers={mockHandlers.onRemoveAllPlayers}
      />
    );

    // Find the "Remove All Players" button in the header
    const removeAllButton = screen.getByText('players.removeAll');

    // Click the button
    fireEvent.click(removeAllButton);

    // Check if onRemoveAllPlayers was called
    expect(mockHandlers.onRemoveAllPlayers).toHaveBeenCalled();
  });
});
