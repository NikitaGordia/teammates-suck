import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DigestButton from './DigestButton';

// Mock the DigestModal component
vi.mock('./DigestModal', () => ({
  default: ({ isOpen, onClose }) => 
    isOpen ? <div data-testid="digest-modal" onClick={onClose}>Digest Modal</div> : null
}));

// Mock the config and API utils
vi.mock('../config', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      DIGEST: '/digest'
    }
  },
  getApiUrl: (endpoint) => `http://localhost:5000/api${endpoint}`
}));

vi.mock('../utils/apiUtils', () => ({
  handleApiResponse: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('DigestButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders digest button correctly', () => {
    render(<DigestButton />);
    
    expect(screen.getByText(/Latest Digest/)).toBeInTheDocument();
  });

  it('opens digest modal when button is clicked', async () => {
    const mockResponse = { metadata: { generated_on: '2025-05-26' } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { handleApiResponse } = await import('../utils/apiUtils');
    handleApiResponse.mockResolvedValueOnce(mockResponse);

    render(<DigestButton />);
    
    const digestButton = screen.getByText(/Latest Digest/);
    fireEvent.click(digestButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('digest-modal')).toBeInTheDocument();
    });
  });

  it('shows loading state when digest is being fetched', async () => {
    // Mock a delayed response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 100))
    );

    render(<DigestButton />);
    
    const digestButton = screen.getByText(/Latest Digest/);
    fireEvent.click(digestButton);
    
    // Should show loading text
    expect(screen.getByText(/Generating digest.../)).toBeInTheDocument();
  });

  it('disables button during loading', async () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 100))
    );

    render(<DigestButton />);
    
    const digestButton = screen.getByText(/Latest Digest/);
    fireEvent.click(digestButton);
    
    // Button should be disabled during loading
    expect(digestButton).toBeDisabled();
  });

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<DigestButton />);
    
    const digestButton = screen.getByText(/Latest Digest/);
    fireEvent.click(digestButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('digest-modal')).toBeInTheDocument();
    });
  });
});
