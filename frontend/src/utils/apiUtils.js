/**
 * Utility functions for API calls and response handling
 */

/**
 * Process an API response, checking for error keys and handling them appropriately
 *
 * @param {Response} response - The fetch API response object
 * @returns {Promise<Object>} - The parsed JSON response data
 * @throws {Error} - Throws an error with the error message from the API if present
 */
export const handleApiResponse = async (response) => {
  try {
    // Parse the response as JSON regardless of status code
    const data = await response.json();

    // Check if the response contains an error key, regardless of status code
    if (data && data.error) {
      console.error('API error:', data.error);
      throw new Error(data.error);
    }

    // If no error key but the response is not OK, throw a generic error
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // If everything is good, return the data
    return data;
  } catch (error) {
    // If we can't parse the JSON or some other error occurs
    if (error.message && error.message.includes('error')) {
      // If it's our own error with the API error message, rethrow it
      throw error;
    }

    // For JSON parsing errors or other unexpected errors
    console.error('Error processing API response:', error);
    throw new Error(`Failed to process response: ${error.message}`);
  }
};
