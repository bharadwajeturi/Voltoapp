/**
 * Error Handler Utilities - Frontend
 * Used by Services/api.js for error handling
 * 
 * Exports:
 * - getErrorMessage: Format error messages for display
 * - retryApiCall: Retry failed API calls with exponential backoff
 */

import { logWarn } from './logger';

/**
 * Extract and format error message from API response
 * @param {Error} error - Error object from axios
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Check if error has response data with message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for specific HTTP status codes
  if (error.response?.status === 404) {
    return 'Location or resource not found';
  }

  if (error.response?.status === 400) {
    return 'Invalid request. Please check your input.';
  }

  if (error.response?.status === 401) {
    return 'Unauthorized. Please log in again.';
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to access this resource.';
  }

  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }

  if (error.response?.status === 503) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  // Check for network errors
  if (error.message === 'Network Error' || !error.response) {
    return 'Network error. Please check your connection.';
  }

  // Check for timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Fallback to error message or generic message
  return error.message || 'An error occurred. Please try again.';
};

/**
 * Retry an API call with exponential backoff
 * @param {Function} apiCall - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise} Result of successful API call
 */
export const retryApiCall = async (apiCall, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Attempt API call
      const result = await apiCall();
      return result; // Success - return result
    } catch (error) {
      lastError = error;

      // Calculate exponential backoff delay
      // Attempt 1: 1000ms, Attempt 2: 2000ms, Attempt 3: 4000ms
      const delay = Math.pow(2, i) * 1000;

      // Only log and wait if not last attempt
      if (i < maxRetries - 1) {
        logWarn(`API call failed. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  throw lastError;
};

/**
 * Check if error is retryable
 * Some errors shouldn't be retried (auth, validation, etc)
 */
export const isRetryableError = (error) => {
  // Don't retry if response exists
  if (!error.response) {
    return true; // Network errors are retryable
  }

  const status = error.response.status;

  // Don't retry client errors (4xx) except some specific ones
  if (status === 401 || status === 403) {
    return false; // Auth errors not retryable
  }

  if (status === 400 || status === 422) {
    return false; // Validation errors not retryable
  }

  if (status === 404) {
    return false; // Not found not retryable
  }

  // Retry server errors (5xx) and other 4xx
  return true;
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error) => {
  return {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    code: error.code,
  };
};