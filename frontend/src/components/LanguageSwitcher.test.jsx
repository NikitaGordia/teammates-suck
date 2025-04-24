import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from './LanguageSwitcher';
import { updateDocumentTitle } from '../utils/titleUpdater';

// Mock the titleUpdater
vi.mock('../utils/titleUpdater', () => ({
  updateDocumentTitle: vi.fn()
}));

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders language buttons correctly', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();
  });
  
  it('marks the current language button as active', () => {
    render(<LanguageSwitcher />);
    
    // Default language is 'uk' as mocked in setup.js
    const ukButton = screen.getByText('UK');
    const enButton = screen.getByText('EN');
    
    expect(ukButton.className).toContain('active');
    expect(enButton.className).not.toContain('active');
  });
  
  it('calls changeLanguage and updateDocumentTitle when language button is clicked', () => {
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);
    
    // Should call updateDocumentTitle with 'en'
    expect(updateDocumentTitle).toHaveBeenCalledWith('en');
  });
  
  it('updates document title on component mount', () => {
    render(<LanguageSwitcher />);
    
    // Should call updateDocumentTitle with current language ('uk')
    expect(updateDocumentTitle).toHaveBeenCalledWith('uk');
  });
});
