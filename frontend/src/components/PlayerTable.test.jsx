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
      />
    );
    
    // Check column headers
    expect(screen.getByText('players.nickname')).toBeInTheDocument();
    expect(screen.getByText('players.score')).toBeInTheDocument();
    expect(screen.getByText('players.actions')).toBeInTheDocument();
    
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
      />
    );
    
    expect(screen.getByText('players.noPlayersYet')).toBeInTheDocument();
  });
  
  it('calls onRemovePlayer when remove button is clicked', () => {
    render(
      <PlayerTable 
        players={mockPlayers} 
        onScoreChange={mockHandlers.onScoreChange} 
        onRemovePlayer={mockHandlers.onRemovePlayer} 
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
      />
    );
    
    // Get all select elements
    const selects = screen.getAllByRole('combobox');
    
    // Change the score of the first player
    fireEvent.change(selects[0], { target: { value: '2' } });
    
    expect(mockHandlers.onScoreChange).toHaveBeenCalledWith(0, 2);
  });
});
