/**
 * Code.gs - Main Bot Logic
 * Google Chat Bot for EQPMS Password Management
 */

// =============================================================================
// MAIN MESSAGE HANDLER
// =============================================================================

/**
 * Handles incoming messages from Google Chat
 * @param {object} event - The event object from Google Chat
 * @returns {object} Response object with text and/or cards
 */
function onMessage(event) {
  try {
    const message = event.message;
    const text = message.text ? message.text.trim() : '';
    const userEmail = getUserEmailFromEvent(event);

    // Get or create user
    const userResult = getOrCreateUserFromEvent(event);
    if (!userResult.success) {
      return buildMessageResponse(buildErrorCard(userResult.error));
    }

    const user = userResult.data;

    // Parse command
    const command = parseCommand(text);

    // Route to appropriate handler based on role
    switch (command.action) {
      // Faculty commands
      case 'my-assignments':
      case 'assignments':
        return handleMyAssignments(event, user);

      case 'get-password':
        return handleGetPasswordCommand(event, user, command.args);

      // COE/Admin commands
      case 'password':
        return handlePasswordCommand(event, user, command.args);

      case 'board-passwords':
        return handleBoardPasswordsCommand(event, user, command.args);

      case 'pending':
        return handlePendingCommand(event, user);

      case 'stats':
        return handleStatsCommand(event, user);

      case 'access-log':
        return handleAccessLogCommand(event, user);

      // Common commands
      case 'help':
        return handleHelpCommand(event, user);

      case 'register':
        return handleRegisterCommand(event, user, command.args);

      default:
        return handleUnknownCommand(event, user, text);
    }
  } catch (e) {
    logError('onMessage', e);
    return buildMessageResponse(buildErrorCard('An unexpected error occurred. Please try again.'));
  }
}

// =============================================================================
// COMMAND PARSER
// =============================================================================

/**
 * Parses a message text into command and arguments
 * @param {string} text - Message text
 * @returns {object} Parsed command object
 */
function parseCommand(text) {
  // Remove leading slash if present
  let cleanText = text.startsWith('/') ? text.substring(1) : text;
  cleanText = cleanText.trim();

  // Split into parts
  const parts = cleanText.split(/\s+/);
  const action = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  return {
    action: action,
    args: args,
    raw: text
  };
}

// =============================================================================
// FACULTY COMMAND HANDLERS
// =============================================================================

/**
 * Handles /my-assignments command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleMyAssignments(event, user) {
  // Get assignments for this faculty
  const assignments = getAssignmentsByFaculty(user.Regno);

  // Build card
  const card = buildFacultyAssignmentsCard(assignments, user);

  return buildMessageResponse(card);
}

/**
 * Handles /get-password command for faculty
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - QP Reference number
 * @returns {object} Response
 */
function handleGetPasswordCommand(event, user, args) {
  const qpRefNo = args.trim();

  if (!qpRefNo) {
    return buildMessageResponse(buildErrorCard('Please provide a QP Reference number.\n\nUsage: `/get-password QP-CS101-2024`'));
  }

  // Find assignment for this faculty and QP
  const assignment = findAssignmentByQPAndFaculty(qpRefNo, user.Regno);

  if (!assignment) {
    return buildMessageResponse(buildErrorCard(`No assignment found for ${qpRefNo} assigned to you.\n\nUse \`/my-assignments\` to see your papers.`));
  }

  // Get password
  const result = getPasswordForFaculty(assignment.Assignment_ID, user);

  if (!result.success) {
    return buildMessageResponse(buildErrorCard(result.error));
  }

  // Build password card
  const card = buildPasswordCard(result.data);

  return buildMessageResponse(card);
}

// =============================================================================
// COE/ADMIN COMMAND HANDLERS
// =============================================================================

/**
 * Handles /password command for COE
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - QP Reference number
 * @returns {object} Response
 */
function handlePasswordCommand(event, user, args) {
  const qpRefNo = args.trim();

  if (!qpRefNo) {
    return buildMessageResponse(buildErrorCard('Please provide a QP Reference number.\n\nUsage: `/password QP-CS101-2024`'));
  }

  // Validate COE access
  const accessResult = validatePasswordAccess(user.Email);
  if (!accessResult.success) {
    return buildMessageResponse(buildErrorCard(accessResult.error));
  }

  // Get password
  const result = getPasswordForCOE(qpRefNo, user);

  if (!result.success) {
    return buildMessageResponse(buildErrorCard(result.error));
  }

  // Build COE password card
  const card = buildCOEPasswordCard(result.data);

  return buildMessageResponse(card);
}

/**
 * Handles /board-passwords command for COE
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Board name
 * @returns {object} Response
 */
function handleBoardPasswordsCommand(event, user, args) {
  const boardName = args.trim();

  if (!boardName) {
    return buildMessageResponse(buildErrorCard('Please provide a board name.\n\nUsage: `/board-passwords CSE`'));
  }

  // Validate COE access
  const accessResult = validatePasswordAccess(user.Email);
  if (!accessResult.success) {
    return buildMessageResponse(buildErrorCard(accessResult.error));
  }

  // Get board passwords
  const result = getBoardPasswords(boardName, user);

  if (!result.success) {
    return buildMessageResponse(buildErrorCard(result.error));
  }

  // Build board passwords card
  const card = buildBoardPasswordsCard(result.data);

  return buildMessageResponse(card);
}

/**
 * Handles /pending command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handlePendingCommand(event, user) {
  // Validate COE access
  const accessResult = validatePasswordAccess(user.Email);
  if (!accessResult.success) {
    return buildMessageResponse(buildErrorCard(accessResult.error));
  }

  // Get pending assignments
  const pending = getAssignmentsByStatus(ASSIGNMENT_STATUS.PENDING);

  if (pending.length === 0) {
    return { text: 'No pending assignments.' };
  }

  let text = `*Pending Assignments:* ${pending.length}\n\n`;

  pending.slice(0, 20).forEach((a, i) => {
    text += `${i + 1}. **${a.QP_Ref_No}** - ${a.Faculty_Name} (${a.Subject_Name || 'N/A'})\n`;
  });

  return { text: text };
}

/**
 * Handles /stats command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleStatsCommand(event, user) {
  const stats = getAssignmentStats();
  const card = buildStatsCard(stats);

  return buildMessageResponse(card);
}

/**
 * Handles /access-log command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleAccessLogCommand(event, user) {
  // Validate COE access
  const accessResult = validatePasswordAccess(user.Email);
  if (!accessResult.success) {
    return buildMessageResponse(buildErrorCard(accessResult.error));
  }

  // Get recent logs
  const logs = getRecentAccessLogs(20);
  const card = buildAccessLogCard(logs);

  return buildMessageResponse(card);
}

// =============================================================================
// COMMON COMMAND HANDLERS
// =============================================================================

/**
 * Handles /help command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleHelpCommand(event, user) {
  let card;

  if (user.Role === USER_ROLES.FACULTY) {
    card = buildFacultyHelpCard();
  } else {
    card = buildCOEHelpCard();
  }

  return buildMessageResponse(card);
}

/**
 * Handles /register command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Registration details
 * @returns {object} Response
 */
function handleRegisterCommand(event, user, args) {
  // This is for updating user details
  // Format: /register regno:XXX role:faculty board:CSE

  if (!args) {
    return buildMessageResponse(buildErrorCard(
      'Please provide registration details.\n\n' +
      'Usage: `/register regno:YOUR_REGNO role:faculty board:CSE`'
    ));
  }

  // Parse args
  const parts = args.split(/\s+/);
  const updates = {};

  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) {
      updates[key.toLowerCase()] = value;
    }
  });

  if (updates.regno) {
    // Update regno
    const existingUser = getUserByRegno(updates.regno);
    if (existingUser && existingUser.User_ID !== user.User_ID) {
      return buildMessageResponse(buildErrorCard('This registration number is already taken.'));
    }

    updateCell(SHEET_NAMES.USERS, user._rowIndex, USER_COLUMNS.REGNO, updates.regno.toUpperCase());
  }

  if (updates.board) {
    updateCell(SHEET_NAMES.USERS, user._rowIndex, USER_COLUMNS.BOARD, updates.board);
  }

  return buildMessageResponse(buildSuccessCard('Updated', 'Your details have been updated.'));
}

/**
 * Handles unknown commands
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} text - Original message text
 * @returns {object} Response
 */
function handleUnknownCommand(event, user, text) {
  if (text.trim() === '' || text.trim() === '/') {
    return handleHelpCommand(event, user);
  }

  return buildMessageResponse(buildErrorCard(
    `Unknown command: "${text}"\n\nType \`/help\` to see available commands.`
  ));
}

// =============================================================================
// BUTTON CLICK HANDLER
// =============================================================================

/**
 * Handles button click events from cards
 * @param {object} event - The event object from Google Chat
 * @returns {object} Response object
 */
function onCardClick(event) {
  try {
    const action = event.action;
    const actionName = action.actionMethodName;
    const parameters = action.parameters || [];

    // Get parameter value helper
    const getParam = (key) => {
      const param = parameters.find(p => p.key === key);
      return param ? param.value : null;
    };

    const userEmail = getUserEmailFromEvent(event);
    const user = getUserByEmail(userEmail);

    switch (actionName) {
      case 'viewPassword': {
        const assignmentId = getParam('assignmentId');
        const result = getPasswordForFaculty(assignmentId, user);
        if (result.success) {
          return buildMessageResponse(buildPasswordCard(result.data));
        }
        return buildMessageResponse(buildErrorCard(result.error));
      }

      case 'showHelp':
        return handleHelpCommand(event, user);

      default:
        return buildMessageResponse(buildErrorCard('Unknown action.'));
    }
  } catch (e) {
    logError('onCardClick', e);
    return buildMessageResponse(buildErrorCard('An error occurred.'));
  }
}

// =============================================================================
// ADD TO SPACE HANDLER
// =============================================================================

/**
 * Handles when the bot is added to a space
 * @param {object} event - The event object from Google Chat
 * @returns {object} Welcome message
 */
function onAddToSpace(event) {
  const spaceType = event.space.type;

  // Get or create user
  const userResult = getOrCreateUserFromEvent(event);
  const user = userResult.success ? userResult.data : null;

  if (user) {
    const card = buildWelcomeCard(user);
    return buildMessageResponse(card);
  }

  return {
    text: '👋 Welcome to the EQPMS Password Bot!\n\n' +
          'I help you manage passwords for question paper submissions.\n\n' +
          'Type `/help` to see available commands.'
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Builds a message response object
 * @param {object|string} cardOrText - Card object or text string
 * @returns {object} Response object
 */
function buildMessageResponse(cardOrText) {
  if (typeof cardOrText === 'string') {
    return { text: cardOrText };
  }

  return {
    cards: [cardOrText]
  };
}

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

/**
 * COMPLETE SETUP - Run this once after deployment
 * This function:
 * 1. Creates all required sheets with proper headers
 * 2. Creates initial admin user
 * 3. Creates test data (optional)
 *
 * IMPORTANT: Update ADMIN_EMAIL before running!
 */
function completeSetup() {
  console.log('========================================');
  console.log('STARTING COMPLETE SETUP');
  console.log('========================================');

  // Step 1: Initialize sheets
  console.log('\n[Step 1/3] Initializing sheets...');
  initializeSheets();
  console.log('✅ Sheets created with headers');

  // Step 2: Create admin user
  console.log('\n[Step 2/3] Creating admin user...');
  const adminEmail = 'princetheprogrammerbtw@gmail.com';

  const adminResult = addUser({
    name: 'Prince Admin',
    email: adminEmail,
    regno: 'ADMIN001',
    role: USER_ROLES.ADMIN,
    board: 'ALL'
  });

  if (adminResult.success) {
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    console.log(`⚠️ Admin setup: ${adminResult.error}`);
  }

  // Step 3: Create sample COE user
  console.log('\n[Step 3/3] Creating sample COE user...');
  const coeResult = addUser({
    name: 'COE User',
    email: 'coe@example.com',
    regno: 'COE001',
    role: USER_ROLES.COE,
    board: 'ALL'
  });

  if (coeResult.success) {
    console.log('✅ Sample COE user created');
  }

  console.log('\n========================================');
  console.log('SETUP COMPLETE!');
  console.log('========================================');
  console.log('\nNext steps:');
  console.log('1. Update SPREADSHEET_ID in Utils.gs');
  console.log('2. Deploy as Web App for EQPMS API');
  console.log('3. Deploy as Google Chat bot');
  console.log('4. Update admin email: run setAdminEmail("your@email.com")');
  console.log('\nSheet columns created:');

  // Show sheet info
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  [SHEET_NAMES.ASSIGNMENTS, SHEET_NAMES.USERS, SHEET_NAMES.PASSWORD_ACCESS_LOG].forEach(name => {
    const sheet = spreadsheet.getSheetByName(name);
    if (sheet) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      console.log(`\n${name}: ${headers.join(' | ')}`);
    }
  });
}

/**
 * Sets the admin email for setup
 * @param {string} email - Admin email address
 */
function setAdminEmail(email) {
  PropertiesService.getScriptProperties().setProperty('ADMIN_EMAIL', email);
  console.log(`Admin email set to: ${email}`);
}

/**
 * Quick setup - just creates sheets
 * Use this if you only need to initialize sheets
 */
function quickSetup() {
  initializeSheets();
  console.log('Sheets initialized. Run completeSetup() for full setup.');
}

/**
 * Creates test assignments for development
 */
function createTestAssignments() {
  console.log('Creating test assignments...');

  // Create test faculty users first
  addUser({
    name: 'Dr. Test Faculty 1',
    email: 'faculty1@test.com',
    regno: 'FAC001',
    role: USER_ROLES.FACULTY,
    board: 'CSE'
  });

  addUser({
    name: 'Dr. Test Faculty 2',
    email: 'faculty2@test.com',
    regno: 'FAC002',
    role: USER_ROLES.FACULTY,
    board: 'CSE'
  });

  addUser({
    name: 'Dr. Test Faculty 3',
    email: 'faculty3@test.com',
    regno: 'FAC003',
    role: USER_ROLES.FACULTY,
    board: 'ECE'
  });

  // Create test assignments
  createAssignment({
    qpRefNo: 'QP-CS101-2024',
    facultyRegno: 'FAC001',
    facultyName: 'Dr. Test Faculty 1',
    facultyEmail: 'faculty1@test.com',
    boardName: 'CSE',
    subjectName: 'Data Structures'
  });

  createAssignment({
    qpRefNo: 'QP-CS102-2024',
    facultyRegno: 'FAC001',
    facultyName: 'Dr. Test Faculty 1',
    facultyEmail: 'faculty1@test.com',
    boardName: 'CSE',
    subjectName: 'Algorithms'
  });

  createAssignment({
    qpRefNo: 'QP-CS201-2024',
    facultyRegno: 'FAC002',
    facultyName: 'Dr. Test Faculty 2',
    facultyEmail: 'faculty2@test.com',
    boardName: 'CSE',
    subjectName: 'Operating Systems'
  });

  createAssignment({
    qpRefNo: 'QP-EC101-2024',
    facultyRegno: 'FAC003',
    facultyName: 'Dr. Test Faculty 3',
    facultyEmail: 'faculty3@test.com',
    boardName: 'ECE',
    subjectName: 'Digital Electronics'
  });

  console.log('Test data created successfully!');
  console.log('Test Users: FAC001, FAC002, FAC003 (faculty), COE001 (coe)');
  console.log('Test Assignments: QP-CS101-2024, QP-CS102-2024, QP-CS201-2024, QP-EC101-2024');
}

/**
 * Shows current system status
 */
function showSystemStatus() {
  console.log('========================================');
  console.log('SYSTEM STATUS');
  console.log('========================================');

  // Check spreadsheet
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log(`\n✅ Spreadsheet connected: ${spreadsheet.getName()}`);
  } catch (e) {
    console.log(`\n❌ Spreadsheet error: ${e.message}`);
    console.log('Update SPREADSHEET_ID in Utils.gs');
    return;
  }

  // Show stats
  const stats = getAssignmentStats();
  console.log('\n📊 Assignment Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Pending: ${stats.pending}`);
  console.log(`   Retrieved: ${stats.retrieved}`);
  console.log(`   Submitted: ${stats.submitted}`);
  console.log(`   Used: ${stats.used}`);

  // Show users
  const users = getAllUsers();
  console.log(`\n👥 Users: ${users.length} registered`);
  users.forEach(u => {
    console.log(`   - ${u.Name} (${u.Role}) - ${u.Email}`);
  });

  console.log('\n========================================');
}

  if (result.success) {
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log(`Error: ${result.error}`);
  }
}
