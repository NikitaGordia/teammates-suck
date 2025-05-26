import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BalanceButton from './BalanceButton';
import { mockHandlers } from '../test/test-utils';

describe('BalanceButton Component', () => {
  it('renders correctly with default props', () => {
    render(
      <BalanceButton
        onBalanceTeams={mockHandlers.onBalanceTeams}
        isLoading={false}
        randomness={0}
        onRandomnessChange={mockHandlers.onRandomnessChange}
        playerCount={4}
      />
    );

    expect(screen.getByText('balance.balanceTeams')).toBeInTheDocument();
    expect(screen.getByText(/balance.randomness/)).toBeInTheDocument();

    // Check slider exists
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('0');
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <BalanceButton
        onBalanceTeams={mockHandlers.onBalanceTeams}
        isLoading={true}
        randomness={0}
        onRandomnessChange={mockHandlers.onRandomnessChange}
        playerCount={4}
      />
    );

    expect(screen.getByText('balance.balancing')).toBeInTheDocument();

    // Button should be disabled
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onBalanceTeams when button is clicked', () => {
    render(
      <BalanceButton
        onBalanceTeams={mockHandlers.onBalanceTeams}
        isLoading={false}
        randomness={0}
        onRandomnessChange={mockHandlers.onRandomnessChange}
        playerCount={4}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockHandlers.onBalanceTeams).toHaveBeenCalled();
  });

  it('calls onRandomnessChange when slider is changed', () => {
    render(
      <BalanceButton
        onBalanceTeams={mockHandlers.onBalanceTeams}
        isLoading={false}
        randomness={0}
        onRandomnessChange={mockHandlers.onRandomnessChange}
        playerCount={4}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });

    expect(mockHandlers.onRandomnessChange).toHaveBeenCalledWith(50);
  });

  it('snaps randomness to fixed values', () => {
    const onRandomnessChange = vi.fn();

    render(
      <BalanceButton
        onBalanceTeams={mockHandlers.onBalanceTeams}
        isLoading={false}
        randomness={0}
        onRandomnessChange={onRandomnessChange}
        playerCount={4}
      />
    );

    const slider = screen.getByRole('slider');

    // Test values that should snap to 25
    fireEvent.change(slider, { target: { value: '23' } });
    expect(onRandomnessChange).toHaveBeenCalledWith(25);

    // Test values that should snap to 50
    fireEvent.change(slider, { target: { value: '48' } });
    expect(onRandomnessChange).toHaveBeenCalledWith(50);

    // Test values that should snap to 75
    fireEvent.change(slider, { target: { value: '70' } });
    expect(onRandomnessChange).toHaveBeenCalledWith(75);
  });

  describe('Player count validation', () => {
    it('disables button when player count is less than 2', () => {
      render(
        <BalanceButton
          onBalanceTeams={mockHandlers.onBalanceTeams}
          isLoading={false}
          randomness={0}
          onRandomnessChange={mockHandlers.onRandomnessChange}
          playerCount={1}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'balance.needAtLeastTwoPlayers');
    });

    it('disables button when player count is more than 30', () => {
      render(
        <BalanceButton
          onBalanceTeams={mockHandlers.onBalanceTeams}
          isLoading={false}
          randomness={0}
          onRandomnessChange={mockHandlers.onRandomnessChange}
          playerCount={31}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'balance.tooManyPlayers');
    });

    it('disables button when player count is odd', () => {
      render(
        <BalanceButton
          onBalanceTeams={mockHandlers.onBalanceTeams}
          isLoading={false}
          randomness={0}
          onRandomnessChange={mockHandlers.onRandomnessChange}
          playerCount={3}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'balance.needEvenNumberOfPlayers');
    });

    it('enables button when player count is valid (even, between 2-30)', () => {
      render(
        <BalanceButton
          onBalanceTeams={mockHandlers.onBalanceTeams}
          isLoading={false}
          randomness={0}
          onRandomnessChange={mockHandlers.onRandomnessChange}
          playerCount={4}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('title');
    });

    it('disables slider when player count is invalid', () => {
      render(
        <BalanceButton
          onBalanceTeams={mockHandlers.onBalanceTeams}
          isLoading={false}
          randomness={0}
          onRandomnessChange={mockHandlers.onRandomnessChange}
          playerCount={1}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });
  });
});
