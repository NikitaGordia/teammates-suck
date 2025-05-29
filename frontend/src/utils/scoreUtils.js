/**
 * Utility functions for score-related operations
 */

/**
 * Get scores from environment variable APP_SCORES, with fallback to default values
 * @returns {number[]} Array of score values
 */
export const getScores = () => {
  const scoresEnv = import.meta.env.VITE_APP_SCORES;
  if (scoresEnv) {
    return JSON.parse(scoresEnv);
  } else {
    throw new Error("VITE_APP_SCORES environment variable is not set");
  }
};

/**
 * Get the available scores as a cached value
 */
export const SCORES = getScores();

/**
 * Get color based on score value
 *
 * @param {number|string} score - The score value
 * @returns {string} - The color hex code for the score
 */
export const getScoreColor = (score) => {
  switch (Number(score)) {
    case 5:
      return '#0b1a07'; // Dark Green (highest skill)
    case 4.9:
      return '#0b1a07'; // Very Dark Green
    case 4.8:
      return '#0b1a07'; // Dark Green
    case 4.7:
      return '#0b1a07'; // Medium Dark Green
    case 4.6:
      return '#0b1a07'; // Green (original 4 color)
    case 4.5:
      return '#0B1A07'; // Light Green
    case 4.4:
      return '#1E3411'; // Lighter Green
    case 4.3:
      return '#324E1C'; // Even Lighter Green
    case 4.2:
      return '#456826'; // Very Light Green
    case 4.1:
      return '#4D722A'; // Lightest Green
    case 4:
      return '#547C2E'; // Green (original)
    case 3.5:
      return '#5E8933'; // Between Green and Light Green
    case 3.3:
      return '#75A63F'; // Light Green
    case 3:
      return '#8BC34A'; // Light Green
    case 2.7:
      return '#B9C22F'; // Light Green
    case 2.5:
      return '#D1C222'; // Between Light Green and Amber
    case 2:
      return '#FFC107'; // Amber
    case 1.5:
      return '#FFA602'; // Amber
    case 1:
      return '#FF9800'; // Orange
    case 0:
      return '#FF5722'; // Deep Orange
    case -1:
      return '#F44336'; // Red
    default:
      return '#000000'; // Black
  }
};
