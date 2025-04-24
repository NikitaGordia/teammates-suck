import { describe, it, expect } from 'vitest';
import { updateDocumentTitle } from './titleUpdater';

describe('titleUpdater', () => {
  const originalTitle = document.title;
  
  afterEach(() => {
    // Reset the document title after each test
    document.title = originalTitle;
  });
  
  it('should update document title to English when language is "en"', () => {
    updateDocumentTitle('en');
    expect(document.title).toBe('Team Balancer App');
  });
  
  it('should update document title to Ukrainian when language is "uk"', () => {
    updateDocumentTitle('uk');
    expect(document.title).toBe('Балансувальник Команд');
  });
  
  it('should default to English title when language is not recognized', () => {
    updateDocumentTitle('fr'); // Unsupported language
    expect(document.title).toBe('Team Balancer App');
  });
});
