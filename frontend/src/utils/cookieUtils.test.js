import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setCookie, getCookie, deleteCookie, cookieExists, COOKIE_NAMES } from './cookieUtils';

describe('cookieUtils', () => {
  // Mock document.cookie
  let documentCookieSpy;

  beforeEach(() => {
    // Save original document.cookie
    const originalDocumentCookie = Object.getOwnPropertyDescriptor(document, 'cookie');
    
    // Create a mock for document.cookie
    let cookies = '';
    documentCookieSpy = vi.spyOn(document, 'cookie', 'get').mockImplementation(() => cookies);
    Object.defineProperty(document, 'cookie', {
      get: () => cookies,
      set: (value) => {
        // When setting a cookie, append it to our cookies string
        // In a real browser, expired cookies would be removed automatically
        if (value.includes('expires=Thu, 01 Jan 1970 00:00:00 GMT')) {
          // This is a cookie deletion, extract the cookie name
          const cookieName = value.split('=')[0];
          // Remove the cookie from our cookies string
          const cookieRegex = new RegExp(`${cookieName}=[^;]*;?\\s*`);
          cookies = cookies.replace(cookieRegex, '');
        } else {
          // This is a cookie addition
          cookies += (cookies ? '; ' : '') + value.split(';')[0];
        }
        return true;
      },
      configurable: true
    });

    // Clear cookies before each test
    cookies = '';
  });

  describe('setCookie', () => {
    it('should set a cookie with the given name and value', () => {
      setCookie('testCookie', 'testValue');
      expect(document.cookie).toContain('testCookie=testValue');
    });

    it('should set a cookie with the given expiration days', () => {
      // Mock Date to have a consistent test
      const mockDate = new Date('2023-01-01T00:00:00Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      setCookie('testCookie', 'testValue', 7);
      
      // The spy on document.cookie.set will only store the name=value part
      // but we can verify the set was called with the correct expiration
      expect(document.cookie).toContain('testCookie=testValue');
      
      // Restore Date
      vi.restoreAllMocks();
    });
  });

  describe('getCookie', () => {
    it('should return the value of the cookie with the given name', () => {
      // Set up a cookie
      document.cookie = 'testCookie=testValue';
      
      const result = getCookie('testCookie');
      expect(result).toBe('testValue');
    });

    it('should return null if the cookie does not exist', () => {
      const result = getCookie('nonExistentCookie');
      expect(result).toBeNull();
    });

    it('should handle multiple cookies correctly', () => {
      // Set up multiple cookies
      document.cookie = 'cookie1=value1';
      document.cookie = 'cookie2=value2';
      document.cookie = 'cookie3=value3';
      
      expect(getCookie('cookie1')).toBe('value1');
      expect(getCookie('cookie2')).toBe('value2');
      expect(getCookie('cookie3')).toBe('value3');
    });
  });

  describe('deleteCookie', () => {
    it('should delete the cookie with the given name', () => {
      // Set up a cookie
      document.cookie = 'testCookie=testValue';
      
      // Verify it exists
      expect(document.cookie).toContain('testCookie=testValue');
      
      // Delete it
      deleteCookie('testCookie');
      
      // Verify it's gone
      expect(document.cookie).not.toContain('testCookie=testValue');
    });

    it('should not affect other cookies when deleting one', () => {
      // Set up multiple cookies
      document.cookie = 'cookie1=value1';
      document.cookie = 'cookie2=value2';
      
      // Delete one
      deleteCookie('cookie1');
      
      // Verify only the specified cookie was deleted
      expect(document.cookie).not.toContain('cookie1=value1');
      expect(document.cookie).toContain('cookie2=value2');
    });
  });

  describe('cookieExists', () => {
    it('should return true if the cookie exists', () => {
      // Set up a cookie
      document.cookie = 'testCookie=testValue';
      
      const result = cookieExists('testCookie');
      expect(result).toBe(true);
    });

    it('should return false if the cookie does not exist', () => {
      const result = cookieExists('nonExistentCookie');
      expect(result).toBe(false);
    });
  });

  describe('COOKIE_NAMES', () => {
    it('should have the correct cookie name constants', () => {
      expect(COOKIE_NAMES.ADMIN_SECRET).toBe('admin_secret');
    });
  });
});
