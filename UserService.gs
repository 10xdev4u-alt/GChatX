/**
 * UserService.gs - User Management Functions
 * Handles all user-related operations for Faculty, COE, HOB, and Admin
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
  return findRowByColumn(SHEET_NAMES.USERS, USER_COLUMNS.EMAIL, email.toLowerCase());
}

/**
 * Gets a user by their registration number
 * @param {string} regno - User's registration number
 * @returns {object|null} User object or null if not found
 */
function getUserByRegno(regno) {
  return findRowByColumn(SHEET_NAMES.USERS, USER_COLUMNS.REGNO, regno);
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
 * Gets all users by role
 * @param {string} role - Role to filter by
 * @returns {Array} Array of user objects
 */
function getUsersByRole(role) {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.ROLE, role);
}

/**
 * Gets all COE users
 * @returns {Array} Array of COE user objects
 */
function getAllCOE() {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.ROLE, USER_ROLES.COE);
}

/**
 * Gets all Faculty users
 * @returns {Array} Array of Faculty user objects
 */
function getAllFaculty() {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.ROLE, USER_ROLES.FACULTY);
}

/**
 * Gets all HOB users
 * @returns {Array} Array of HOB user objects
 */
function getAllHOB() {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.ROLE, USER_ROLES.HOB);
}

/**
 * Gets users by board
 * @param {string} board - Board name
 * @returns {Array} Array of user objects
 */
function getUsersByBoard(board) {
  return findRowsByColumn(SHEET_NAMES.USERS, USER_COLUMNS.BOARD, board);
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
 * Checks if a user is active
 * @param {string} email - User's email address
 * @returns {boolean} True if user is active
 */
function isUserActive(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Status === USER_STATUS.ACTIVE;
}

/**
 * Checks if a user is COE
 * @param {string} email - User's email address
 * @returns {boolean} True if user is COE
 */
function isCOE(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Role === USER_ROLES.COE;
}

/**
 * Checks if a user is HOB
 * @param {string} email - User's email address
 * @returns {boolean} True if user is HOB
 */
function isHOB(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Role === USER_ROLES.HOB;
}

/**
 * Checks if a user is Admin
 * @param {string} email - User's email address
 * @returns {boolean} True if user is Admin
 */
function isAdmin(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Role === USER_ROLES.ADMIN;
}

/**
 * Checks if a user is Faculty
 * @param {string} email - User's email address
 * @returns {boolean} True if user is Faculty
 */
function isFaculty(email) {
  const user = getUserByEmail(email);
  return user !== null && user.Role === USER_ROLES.FACULTY;
}

/**
 * Validates if a user can access passwords (COE, HOB, or Admin)
 * @param {string} email - User's email address
 * @returns {object} Validation result
 */
function validatePasswordAccess(email) {
  const user = getUserByEmail(email);

  if (!user) {
    return createErrorResponse('User not registered.');
  }

  if (user.Status !== USER_STATUS.ACTIVE) {
    return createErrorResponse('User account is inactive.');
  }

  if (user.Role !== USER_ROLES.COE && user.Role !== USER_ROLES.HOB && user.Role !== USER_ROLES.ADMIN) {
    return createErrorResponse('Access denied. COE, HOB, or Admin role required.');
  }

  return createSuccessResponse(user);
}

/**
 * Validates a faculty user
 * @param {string} email - User's email address
 * @returns {object} Validation result
 */
function validateFaculty(email) {
  const user = getUserByEmail(email);

  if (!user) {
    return createErrorResponse('User not registered.');
  }

  if (user.Status !== USER_STATUS.ACTIVE) {
    return createErrorResponse('User account is inactive.');
  }

  if (user.Role !== USER_ROLES.FACULTY) {
    return createErrorResponse('Access denied. Faculty role required.');
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
 * @param {string} userData.regno - User's registration number
 * @param {string} userData.role - User's role
 * @param {string} userData.board - User's board (optional)
 * @returns {object} Result with success status and user ID
 */
function addUser(userData) {
  // Validate required fields
  if (!userData.name || !userData.email || !userData.regno) {
    return createErrorResponse('Name, email, and registration number are required.');
  }

  // Validate email format
  if (!isValidEmail(userData.email)) {
    return createErrorResponse('Invalid email format.');
  }

  // Check if user already exists by email
  if (userExists(userData.email)) {
    return createErrorResponse('User with this email already exists.');
  }

  // Check if regno already exists
  if (getUserByRegno(userData.regno)) {
    return createErrorResponse('User with this registration number already exists.');
  }

  // Validate role
  const role = userData.role || USER_ROLES.FACULTY;
  const validRoles = [USER_ROLES.FACULTY, USER_ROLES.COE, USER_ROLES.HOB, USER_ROLES.ADMIN];
  if (!validRoles.includes(role)) {
    return createErrorResponse('Invalid role. Must be faculty, coe, hob, or admin.');
  }

  // Generate user ID
  const userId = generateUserId();

  // Prepare row data
  const rowData = [
    userId,
    userData.name,
    userData.email.toLowerCase(),
    userData.regno.toUpperCase(),
    role,
    userData.board || '',
    USER_STATUS.ACTIVE
  ];

  // Add to sheet
  const rowNumber = appendRow(SHEET_NAMES.USERS, rowData);

  logInfo('addUser', `Added user: ${userData.name} (${role})`);

  return createSuccessResponse({
    userId: userId,
    name: userData.name,
    email: userData.email,
    regno: userData.regno,
    role: role,
    rowNumber: rowNumber
  });
}

/**
 * Updates a user's status
 * @param {string} email - User's email address
 * @param {string} status - New status
 * @returns {object} Result with success status
 */
function updateUserStatus(email, status) {
  if (status !== USER_STATUS.ACTIVE && status !== USER_STATUS.INACTIVE) {
    return createErrorResponse('Invalid status.');
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
 * @param {string} role - New role
 * @returns {object} Result with success status
 */
function updateUserRole(email, role) {
  const validRoles = [USER_ROLES.FACULTY, USER_ROLES.COE, USER_ROLES.HOB, USER_ROLES.ADMIN];
  if (!validRoles.includes(role)) {
    return createErrorResponse('Invalid role.');
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
 * @param {object} event - Chat event object
 * @returns {object} User object or error
 */
function getOrCreateUserFromEvent(event) {
  const email = getUserEmailFromEvent(event);
  let user = getUserByEmail(email);

  if (!user) {
    // Auto-register as faculty (can be upgraded later)
    const result = addUser({
      name: getUserNameFromEvent(event),
      email: email,
      regno: 'CHAT-' + Date.now().toString(36).toUpperCase(),
      role: USER_ROLES.FACULTY
    });

    if (!result.success) {
      return result;
    }

    user = getUserByEmail(email);
  }

  return createSuccessResponse(user);
}

// =============================================================================
// BULK USER OPERATIONS
// =============================================================================

/**
 * Syncs users from EQPMS database
 * This would be called by the API when syncing
 * @param {Array} users - Array of user objects from EQPMS
 * @returns {object} Result with sync statistics
 */
function syncUsersFromEQPMS(users) {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return createErrorResponse('No users provided.');
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const userData of users) {
    const existingUser = getUserByRegno(userData.regno);

    if (existingUser) {
      // Update existing user
      if (existingUser.Name !== userData.name || existingUser.Email !== userData.email) {
        updateCell(SHEET_NAMES.USERS, existingUser._rowIndex, USER_COLUMNS.NAME, userData.name);
        updateCell(SHEET_NAMES.USERS, existingUser._rowIndex, USER_COLUMNS.EMAIL, userData.email.toLowerCase());
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Add new user
      const result = addUser({
        name: userData.name,
        email: userData.email,
        regno: userData.regno,
        role: userData.role || USER_ROLES.FACULTY,
        board: userData.board || ''
      });

      if (result.success) {
        added++;
      } else {
        skipped++;
      }
    }
  }

  logInfo('syncUsersFromEQPMS', `Synced: ${added} added, ${updated} updated, ${skipped} skipped`);

  return createSuccessResponse({
    total: users.length,
    added: added,
    updated: updated,
    skipped: skipped
  });
}
