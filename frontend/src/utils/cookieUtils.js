/**
 * Utility functions for cookie management
 */

/**
 * Set a cookie with the given name, value, and expiration days
 * 
 * @param {string} name - The name of the cookie
 * @param {string} value - The value to store in the cookie
 * @param {number} days - Number of days until the cookie expires
 */
export const setCookie = (name, value, days = 30) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

/**
 * Get a cookie value by name
 * 
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string|null} - The cookie value or null if not found
 */
export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return null;
};

/**
 * Delete a cookie by name
 * 
 * @param {string} name - The name of the cookie to delete
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

/**
 * Check if a cookie exists
 * 
 * @param {string} name - The name of the cookie to check
 * @returns {boolean} - True if the cookie exists, false otherwise
 */
export const cookieExists = (name) => {
  return getCookie(name) !== null;
};

// Cookie name constants
export const COOKIE_NAMES = {
  ADMIN_SECRET: 'admin_secret'
};
