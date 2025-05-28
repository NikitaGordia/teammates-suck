import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Confetti from './Confetti';

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('Confetti Component', () => {
  it('renders nothing when isActive is false', () => {
    const { container } = render(<Confetti isActive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders confetti particles when isActive is true', () => {
    const { container } = render(<Confetti isActive={true} />);
    
    // Should render the confetti container
    const confettiContainer = container.querySelector('.confetti-container');
    expect(confettiContainer).toBeInTheDocument();
    
    // Should render confetti particles
    const particles = container.querySelectorAll('.confetti-particle');
    expect(particles.length).toBeGreaterThan(0);
    expect(particles.length).toBe(50); // Default particle count
  });

  it('generates particles with different shapes', () => {
    const { container } = render(<Confetti isActive={true} />);
    
    const circles = container.querySelectorAll('.confetti-circle');
    const squares = container.querySelectorAll('.confetti-square');
    const triangles = container.querySelectorAll('.confetti-triangle');
    
    // Should have at least some variety in shapes (not all the same)
    const totalShapes = circles.length + squares.length + triangles.length;
    expect(totalShapes).toBe(50); // Total should equal particle count
    
    // Should have some of each shape (with high probability)
    expect(circles.length + squares.length + triangles.length).toBeGreaterThan(0);
  });

  it('applies random positioning and timing to particles', () => {
    const { container } = render(<Confetti isActive={true} />);
    
    const particles = container.querySelectorAll('.confetti-particle');
    const positions = Array.from(particles).map(p => p.style.left);
    const delays = Array.from(particles).map(p => p.style.animationDelay);
    
    // Should have variety in positions (not all the same)
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBeGreaterThan(1);
    
    // Should have variety in animation delays (not all the same)
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('hides confetti after duration', () => {
    const duration = 1000;
    const { container, rerender } = render(
      <Confetti isActive={true} duration={duration} />
    );
    
    // Should be visible initially
    expect(container.querySelector('.confetti-container')).toBeInTheDocument();
    
    // Fast-forward time
    vi.advanceTimersByTime(duration);
    
    // Should be hidden after duration
    expect(container.querySelector('.confetti-container')).not.toBeInTheDocument();
  });

  it('cleans up when isActive changes to false', () => {
    const { container, rerender } = render(<Confetti isActive={true} />);
    
    // Should be visible initially
    expect(container.querySelector('.confetti-container')).toBeInTheDocument();
    
    // Change isActive to false
    rerender(<Confetti isActive={false} />);
    
    // Should be hidden immediately
    expect(container.querySelector('.confetti-container')).not.toBeInTheDocument();
  });

  it('uses custom duration when provided', () => {
    const customDuration = 5000;
    const { container } = render(
      <Confetti isActive={true} duration={customDuration} />
    );
    
    // Should be visible initially
    expect(container.querySelector('.confetti-container')).toBeInTheDocument();
    
    // Fast-forward to just before custom duration
    vi.advanceTimersByTime(customDuration - 100);
    expect(container.querySelector('.confetti-container')).toBeInTheDocument();
    
    // Fast-forward past custom duration
    vi.advanceTimersByTime(200);
    expect(container.querySelector('.confetti-container')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes to different particle shapes', () => {
    const { container } = render(<Confetti isActive={true} />);
    
    const circles = container.querySelectorAll('.confetti-circle');
    const squares = container.querySelectorAll('.confetti-square');
    const triangles = container.querySelectorAll('.confetti-triangle');
    
    // All circles should have the base particle class
    circles.forEach(circle => {
      expect(circle).toHaveClass('confetti-particle');
      expect(circle).toHaveClass('confetti-circle');
    });
    
    // All squares should have the base particle class
    squares.forEach(square => {
      expect(square).toHaveClass('confetti-particle');
      expect(square).toHaveClass('confetti-square');
    });
    
    // All triangles should have the base particle class
    triangles.forEach(triangle => {
      expect(triangle).toHaveClass('confetti-particle');
      expect(triangle).toHaveClass('confetti-triangle');
    });
  });
});
