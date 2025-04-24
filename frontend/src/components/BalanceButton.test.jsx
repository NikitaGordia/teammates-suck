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
});
