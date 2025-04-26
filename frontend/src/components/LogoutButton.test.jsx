import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogoutButton from './LogoutButton';
import { cookieExists, deleteCookie, COOKIE_NAMES } from '../utils/cookieUtils';

// Mock the cookieUtils module
vi.mock('../utils/cookieUtils', () => ({
  cookieExists: vi.fn(),
  deleteCookie: vi.fn(),
  COOKIE_NAMES: {
    ADMIN_SECRET: 'admin_secret'
  }
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when user is not logged in', () => {
    // Mock cookieExists to return false (not logged in)
    cookieExists.mockReturnValue(false);
    
    render(<LogoutButton />);
    
    // Button should not be in the document
    const logoutButton = screen.queryByRole('button');
    expect(logoutButton).not.toBeInTheDocument();
  });

  it('should render when user is logged in', () => {
    // Mock cookieExists to return true (logged in)
    cookieExists.mockReturnValue(true);
    
    render(<LogoutButton />);
    
    // Button should be in the document
    const logoutButton = screen.getByRole('button');
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent('admin.logout');
  });

  it('should call deleteCookie when clicked', () => {
    // Mock cookieExists to return true (logged in)
    cookieExists.mockReturnValue(true);
    
    render(<LogoutButton />);
    
    // Get the button and click it
    const logoutButton = screen.getByRole('button');
    fireEvent.click(logoutButton);
    
    // Check if deleteCookie was called with the correct parameter
    expect(deleteCookie).toHaveBeenCalledWith(COOKIE_NAMES.ADMIN_SECRET);
  });

  it('should update visibility when login status changes', async () => {
    // Start with user logged in
    cookieExists.mockReturnValue(true);
    
    const { rerender } = render(<LogoutButton />);
    
    // Button should be visible
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Simulate logout
    cookieExists.mockReturnValue(false);
    
    // Force a re-render to simulate the effect of the interval check
    rerender(<LogoutButton />);
    
    // Button should no longer be visible
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
