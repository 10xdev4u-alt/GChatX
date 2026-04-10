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
  ASSIGNMENTS: 'Assignments',
  USERS: 'Users',
  PASSWORD_ACCESS_LOG: 'Password_Access_Log'
};

// Column Indices for Assignments Sheet (1-based)
const ASSIGNMENT_COLUMNS = {
  ASSIGNMENT_ID: 1,
  QP_REF_NO: 2,
  FACULTY_REGNO: 3,
  FACULTY_NAME: 4,
  FACULTY_EMAIL: 5,
  PASSWORD: 6,
  GENERATED_AT: 7,
  STATUS: 8,          // pending, retrieved, submitted, used
  RETRIEVED_AT: 9,
  SUBMITTED_AT: 10,
  BOARD_NAME: 11,
  SUBJECT_NAME: 12
};

// Column Indices for Users Sheet (1-based)
const USER_COLUMNS = {
  USER_ID: 1,
  NAME: 2,
  EMAIL: 3,
  REGNO: 4,
  ROLE: 5,            // faculty, coe, hob, admin
  BOARD: 6,
  STATUS: 7
};

// Column Indices for Password Access Log (1-based)
const LOG_COLUMNS = {
  LOG_ID: 1,
  ASSIGNMENT_ID: 2,
  QP_REF_NO: 3,
  REQUESTED_BY: 4,
  REQUESTED_BY_REGNO: 5,
  REQUESTED_AT: 6,
  PURPOSE: 7,
  REQUESTER_ROLE: 8
};

// Status Values for Assignments
const ASSIGNMENT_STATUS = {
  PENDING: 'pending',         // Password generated, not retrieved
  RETRIEVED: 'retrieved',     // Faculty retrieved password
  SUBMITTED: 'submitted',     // Faculty submitted paper
  USED: 'used'                // Paper used in exam
};

// User Roles
const USER_ROLES = {
  FACULTY: 'faculty',
  COE: 'coe',
  HOB: 'hob',
  ADMIN: 'admin'
};

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Password Generation Settings
const PASSWORD_CONFIG = {
  LENGTH: 16,
  INCLUDE_UPPERCASE: true,
  INCLUDE_LOWERCASE: true,
  INCLUDE_NUMBERS: true,
  INCLUDE_SYMBOLS: true
};

// =============================================================================
// PASSWORD GENERATION
// =============================================================================

/**
 * Generates a secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} Generated password
 */
function generateSecurePassword(length) {
  length = length || PASSWORD_CONFIG.LENGTH;

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  let password = '';

  if (PASSWORD_CONFIG.INCLUDE_UPPERCASE) charset += uppercase;
  if (PASSWORD_CONFIG.INCLUDE_LOWERCASE) charset += lowercase;
  if (PASSWORD_CONFIG.INCLUDE_NUMBERS) charset += numbers;
  if (PASSWORD_CONFIG.INCLUDE_SYMBOLS) charset += symbols;

  // Ensure at least one character from each selected type
  if (PASSWORD_CONFIG.INCLUDE_UPPERCASE) {
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  }
  if (PASSWORD_CONFIG.INCLUDE_LOWERCASE) {
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  }
  if (PASSWORD_CONFIG.INCLUDE_NUMBERS) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  if (PASSWORD_CONFIG.INCLUDE_SYMBOLS) {
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  }

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password
  password = shuffleString(password);

  return password;
}

/**
 * Shuffles a string randomly
 * @param {string} str - String to shuffle
 * @returns {string} Shuffled string
 */
function shuffleString(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generates a unique Assignment ID
 * @returns {string} Assignment ID (e.g., ASN-2024ABC123)
 */
function generateAssignmentId() {
  const timestamp = new Date().getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ASN-${timestamp}-${random}`;
}

/**
 * Generates a unique Log ID
 * @returns {string} Log ID
 */
function generateLogId() {
  const timestamp = new Date().getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `LOG-${timestamp}-${random}`;
}

/**
 * Generates a unique User ID
 * @returns {string} User ID
 */
function generateUserId() {
  const timestamp = new Date().getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `USR-${timestamp}-${random}`;
}

// =============================================================================
// DATE/TIME HELPERS
// =============================================================================

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
 * Gets current timestamp
 * @returns {string} Current timestamp string
 */
function getCurrentTimestamp() {
  return formatTimestamp(new Date());
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

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

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

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
 * Validates a registration number format
 * @param {string} regno - Registration number to validate
 * @returns {boolean} True if valid
 */
function isValidRegno(regno) {
  return regno && regno.trim().length >= 3;
}

// =============================================================================
// CHAT EVENT HELPERS
// =============================================================================

/**
 * Gets the user's email from the Chat event
 * @param {object} event - The Chat event object
 * @returns {string} User's email
 */
function getUserEmailFromEvent(event) {
  return event.user ? (event.user.email || event.user.displayName) : '';
}

/**
 * Gets the user's display name from the Chat event
 * @param {object} event - The Chat event object
 * @returns {string} User's display name
 */
function getUserNameFromEvent(event) {
  return event.user ? (event.user.displayName || event.user.email) : 'Unknown';
}

// =============================================================================
// LOGGING
// =============================================================================

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
 * Logs an info message
 * @param {string} context - Context
 * @param {string} message - Message
 */
function logInfo(context, message) {
  console.log(`[${context}] ${message}`);
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Truncates a string to a maximum length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Escapes special characters for JSON
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeJson(str) {
  if (!str) return '';
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
