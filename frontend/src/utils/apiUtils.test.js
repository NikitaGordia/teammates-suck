import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiResponse } from './apiUtils';

describe('apiUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('handleApiResponse', () => {
    it('should return data for a successful response', async () => {
      // Mock a successful response
      const mockData = { success: true, data: 'test data' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData)
      };

      const result = await handleApiResponse(mockResponse);
      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should throw an error with the error message from the API when error key is present', async () => {
      // Mock a response with an error message
      const mockErrorData = { error: 'API error message' };
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(mockErrorData)
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('API error message');
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('API error:', 'API error message');
    });

    it('should throw an error with the error message even if response is OK but contains an error key', async () => {
      // Mock a response that is OK but contains an error key
      const mockErrorData = { error: 'Error in the data' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockErrorData)
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Error in the data');
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('API error:', 'Error in the data');
    });

    it('should throw a generic error for a failed response without an error key', async () => {
      // Mock a failed response without an error message
      const mockErrorData = { message: 'Some other message' };
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue(mockErrorData)
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('HTTP error! Status: 500');
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should throw a generic error if the response cannot be parsed as JSON', async () => {
      // Mock a failed response that cannot be parsed as JSON
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow();
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });
  });
});
