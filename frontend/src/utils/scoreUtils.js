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
    case 4:
      return '#4CAF50'; // Green
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
