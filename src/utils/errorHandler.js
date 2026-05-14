/**
 * Extracts a human-readable error message from an Axios error.
 * Handles all backend error shapes including quota-exceeded (402).
 */
export function getErrorMessage(error) {
  if (!error.response) {
    return 'Cannot reach the server. Make sure the backend is running on port 8080.';
  }

  const { status, data } = error.response;

  // Backend validation errors: { errors: { field: "message" } }
  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).join(' · ');
  }

  // Standard backend message
  if (data?.message) return data.message;

  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Session expired. Please log in again.';
    case 402: return 'Request limit exceeded. Upgrade to Premium.';
    case 403: return 'You do not have permission to do this.';
    case 404: return 'Resource not found.';
    case 409: return 'A conflict occurred (e.g., email already registered).';
    case 429: return 'Too many requests. Please slow down.';
    case 500: return 'Server error. Please try again later.';
    default:  return `Unexpected error (${status}).`;
  }
}

/**
 * Returns field-level validation errors as an object.
 * Useful for showing per-field errors in forms.
 */
export function getFieldErrors(error) {
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return {};
}

/**
 * Returns true if the error is an AI quota exceeded error (402).
 */
export function isQuotaExceeded(error) {
  return error?.response?.status === 402;
}
