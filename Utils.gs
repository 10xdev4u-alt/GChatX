/**
 * Utils.gs - Constants and Helper Functions
 * Contains all configuration constants and utility functions used across the application
 */

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

// Google Sheets Configuration
// TODO: Replace with your actual Google Spreadsheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// Admin Space Webhook URL for notifications
// TODO: Replace with your actual admin space webhook URL
const ADMIN_SPACE_WEBHOOK_URL = 'YOUR_ADMIN_SPACE_WEBHOOK_URL_HERE';

// Sheet Names
const SHEET_NAMES = {
  USERS: 'Users',
  QUESTION_PAPERS: 'QuestionPapers',
  PASSWORDS: 'Passwords',
  PASSWORD_REQUESTS: 'PasswordRequests'
};

// Column Indices (1-based for Google Sheets API)
const USER_COLUMNS = {
  USER_ID: 1,
  NAME: 2,
  EMAIL: 3,
  ROLE: 4,
  STATUS: 5
};

const QUESTION_PAPER_COLUMNS = {
  QP_REFERENCE_NUMBER: 1,
  SUBJECT_CODE: 2,
  SUBJECT_NAME: 3,
  STATUS: 4
};

const PASSWORD_COLUMNS = {
  QP_REFERENCE_NUMBER: 1,
  PASSWORD: 2
};

const PASSWORD_REQUEST_COLUMNS = {
  REQUEST_ID: 1,
  USER_ID: 2,
  QP_REFERENCE_NUMBER: 3,
  REQUEST_TIMESTAMP: 4,
  STATUS: 5,
  ADMIN_ID: 6,
  APPROVAL_TIMESTAMP: 7
};

// Status Values
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

const QUESTION_PAPER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a unique ID with a prefix
 * @param {string} prefix - The prefix for the ID (e.g., 'USR', 'QP', 'REQ')
 * @returns {string} A unique ID string
 */
function generateUniqueId(prefix) {
  const timestamp = new Date().getTime().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Formats a date object to a readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatTimestamp(date) {
  if (!date) date = new Date();
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Parses a date string to a Date object
 * @param {string} dateString - The date string to parse
 * @returns {Date} Date object
 */
function parseTimestamp(dateString) {
  return new Date(dateString);
}

/**
 * Logs an error with context
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 */
function logError(context, error) {
  console.error(`[${context}] ${error.message}`);
  console.error(error.stack);
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @returns {object} Error response object
 */
function createErrorResponse(message) {
  return {
    success: false,
    error: message
  };
}

/**
 * Creates a standardized success response
 * @param {*} data - Response data
 * @returns {object} Success response object
 */
function createSuccessResponse(data) {
  return {
    success: true,
    data: data
  };
}

/**
 * Validates an email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gets the current user's email from the Chat event
 * @param {object} event - The Chat event object
 * @returns {string} User's email
 */
function getUserEmailFromEvent(event) {
  return event.user.email || event.user.displayName;
}

/**
 * Gets the current user's display name from the Chat event
 * @param {object} event - The Chat event object
 * @returns {string} User's display name
 */
function getUserNameFromEvent(event) {
  return event.user.displayName || event.user.email;
}

/**
 * Gets the current user's ID from the Chat event
 * @param {object} event - The Chat event object
 * @returns {string} User's ID
 */
function getUserIdFromEvent(event) {
  return event.user.name;
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Escapes special characters for JSON
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeJson(str) {
  return str.replace(/[\n\r\t"]/g, function(match) {
    switch (match) {
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\t': return '\\t';
      case '"': return '\\"';
      default: return match;
    }
  });
}
