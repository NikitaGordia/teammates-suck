/**
 * Utility functions for score-related operations
 */

/**
 * Get color based on score value
 *
 * @param {number|string} score - The score value
 * @returns {string} - The color hex code for the score
 */
export const getScoreColor = (score) => {
  switch (Number(score)) {
    case 5:
      return '#1B5E20'; // Dark Green (highest skill)
    case 4.9:
      return '#2E7D32'; // Very Dark Green
    case 4.8:
      return '#388E3C'; // Dark Green
    case 4.7:
      return '#43A047'; // Medium Dark Green
    case 4.6:
      return '#4CAF50'; // Green (original 4 color)
    case 4.5:
      return '#56C85A'; // Light Green
    case 4.4:
      return '#60D164'; // Lighter Green
    case 4.3:
      return '#6ADA6E'; // Even Lighter Green
    case 4.2:
      return '#74E378'; // Very Light Green
    case 4.1:
      return '#7EEC82'; // Lightest Green
    case 4:
      return '#4CAF50'; // Green (original)
    case 3.5:
      return '#66BB6A'; // Between Green and Light Green
    case 3:
      return '#8BC34A'; // Light Green
    case 2.5:
      return '#AED581'; // Between Light Green and Amber
    case 2:
      return '#FFC107'; // Amber
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
