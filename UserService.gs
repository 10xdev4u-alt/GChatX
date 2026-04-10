/**
 * UserService.gs - User Management Functions
 * Handles all user-related operations
 */

// =============================================================================
// USER RETRIEVAL FUNCTIONS
// =============================================================================

/**
 * Gets a user by their email address
 * @param {string} email - User's email address
 * @returns {object|null} User object or null if not found
 */
function getUserByEmail(email) {
  return findRowByColumn(SHEET_NAMES.USERS, USER_COLUMNS.EMAIL, email);
}

/**
 * Gets a user by their user ID
 * @param {string} userId - User's unique identifier
 * @returns {object|null} User object or null if not found
 */
function getUserById(userId) {
  return findRowByColumn(SHEET_NAMES.USERS, USER_COLUMNS.USER_ID, userId);
}

/**
 * Gets all users
 * @returns {Array} Array of user objects
 */
function getAllUsers() {
  return getAllRowsAsObjects(SHEET_NAMES.USERS);
}

/**
 * Gets all active users
 * @returns {Array} Array of active user objects
 */
function getActiveUsers() {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.STATUS, USER_STATUS.ACTIVE);
}

/**
 * Gets all admins
 * @returns {Array} Array of admin user objects
 */
function getAllAdmins() {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.ROLE, USER_ROLES.ADMIN);
}

/**
 * Gets all active admins
 * @returns {Array} Array of active admin user objects
 */
function getActiveAdmins() {
  const admins = findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.ROLE, USER_ROLES.ADMIN);
  return admins.filter(admin => admin.Status === USER_STATUS.ACTIVE);
}

// =============================================================================
// USER VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if a user exists by email
 * @param {string} email - User's email address
 * @returns {boolean} True if user exists
 */
function userExists(email) {
  return getUserByEmail(email) !== null;
}

/**
 * Checks if a user is an admin
 * @param {string} email - User's email address
 * @returns {boolean} True if user is an admin
 */
function isAdmin(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Role === USER_ROLES.ADMIN;
}

/**
 * Checks if a user is active
 * @param {string} email - User's email address
 * @returns {boolean} True if user is active
 */
function isUserActive(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Status === USER_STATUS.ACTIVE;
}

/**
 * Validates if a user can make requests
 * @param {string} email - User's email address
 * @returns {object} Validation result with success status and message
 */
function validateUserForRequest(email) {
  const user = getUserByEmail(email);

  if (!user) {
    return createErrorResponse('User not registered. Please contact an administrator.');
  }

  if (user.Status !== USER_STATUS.ACTIVE) {
    return createErrorResponse('User account is inactive. Please contact an administrator.');
  }

  return createSuccessResponse(user);
}

/**
 * Validates if a user can approve/reject requests
 * @param {string} email - User's email address
 * @returns {object} Validation result with success status and message
 */
function validateAdmin(email) {
  const user = getUserByEmail(email);

  if (!user) {
    return createErrorResponse('User not registered.');
  }

  if (user.Role !== USER_ROLES.ADMIN) {
    return createErrorResponse('Access denied. Admin privileges required.');
  }

  if (user.Status !== USER_STATUS.ACTIVE) {
    return createErrorResponse('Admin account is inactive.');
  }

  return createSuccessResponse(user);
}

// =============================================================================
// USER MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Adds a new user
 * @param {object} userData - User data object
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.role - User's role ('user' or 'admin')
 * @returns {object} Result with success status and user ID
 */
function addUser(userData) {
  // Validate required fields
  if (!userData.name || !userData.email) {
    return createErrorResponse('Name and email are required.');
  }

  // Validate email format
  if (!isValidEmail(userData.email)) {
    return createErrorResponse('Invalid email format.');
  }

  // Check if user already exists
  if (userExists(userData.email)) {
    return createErrorResponse('User with this email already exists.');
  }

  // Set default role if not provided
  const role = userData.role || USER_ROLES.USER;
  if (role !== USER_ROLES.USER && role !== USER_ROLES.ADMIN) {
    return createErrorResponse('Invalid role. Must be "user" or "admin".');
  }

  // Generate user ID
  const userId = generateUniqueId('USR');

  // Prepare row data
  const rowData = [
    userId,
    userData.name,
    userData.email.toLowerCase(),
    role,
    USER_STATUS.ACTIVE
  ];

  // Add to sheet
  const rowNumber = appendRow(SHEET_NAMES.USERS, rowData);

  return createSuccessResponse({
    userId: userId,
    rowNumber: rowNumber,
    message: 'User added successfully.'
  });
}

/**
 * Updates a user's status
 * @param {string} email - User's email address
 * @param {string} status - New status ('active' or 'inactive')
 * @returns {object} Result with success status
 */
function updateUserStatus(email, status) {
  if (status !== USER_STATUS.ACTIVE && status !== USER_STATUS.INACTIVE) {
    return createErrorResponse('Invalid status. Must be "active" or "inactive".');
  }

  const user = getUserByEmail(email);
  if (!user) {
    return createErrorResponse('User not found.');
  }

  updateCell(SHEET_NAMES.USERS, user._rowIndex, USER_COLUMNS.STATUS, status);

  return createSuccessResponse({
    message: `User status updated to ${status}.`
  });
}

/**
 * Updates a user's role
 * @param {string} email - User's email address
 * @param {string} role - New role ('user' or 'admin')
 * @returns {object} Result with success status
 */
function updateUserRole(email, role) {
  if (role !== USER_ROLES.USER && role !== USER_ROLES.ADMIN) {
    return createErrorResponse('Invalid role. Must be "user" or "admin".');
  }

  const user = getUserByEmail(email);
  if (!user) {
    return createErrorResponse('User not found.');
  }

  updateCell(SHEET_NAMES.USERS, user._rowIndex, USER_COLUMNS.ROLE, role);

  return createSuccessResponse({
    message: `User role updated to ${role}.`
  });
}

/**
 * Gets or creates a user from Chat event
 * Auto-registers users if they don't exist
 * @param {object} event - Chat event object
 * @returns {object} User object or error
 */
function getOrCreateUserFromEvent(event) {
  const email = getUserEmailFromEvent(event);
  let user = getUserByEmail(email);

  if (!user) {
    // Auto-register the user
    const result = addUser({
      name: getUserNameFromEvent(event),
      email: email,
      role: USER_ROLES.USER
    });

    if (!result.success) {
      return result;
    }

    user = getUserByEmail(email);
  }

  return createSuccessResponse(user);
}
