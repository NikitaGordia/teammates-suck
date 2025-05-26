/**
 * Application configuration
 * Contains environment-specific settings and constants
 */

// API configuration
const API_CONFIG = {
  // Base URL for API requests
  // In Docker, we can use relative URLs since Nginx will proxy the requests
  // Default to '/api' if environment variable is not set
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',

  // API endpoints
  ENDPOINTS: {
    GET_MAPPINGS: '/users',
    BALANCE: '/balance',
    SUBMIT_GAME: '/submit_game',
    DIGEST: '/digest',
    DIGEST_GAMES: '/digest/games',
  },

  // Request timeout in milliseconds
  TIMEOUT: 30000, // 30 seconds

  // Throttle time for refresh button in seconds
  THROTTLE_TIME: 30,
};

// Export configuration objects
export { API_CONFIG };

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
