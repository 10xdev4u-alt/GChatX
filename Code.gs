/**
 * Code.gs - Main Bot Logic
 * Google Chat Bot for Password Request & Approval System
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

    // Route to appropriate handler
    switch (command.action) {
      case 'request':
        return handleRequestCommand(event, user, command.args);
      case 'status':
        return handleStatusCommand(event, user, command.args);
      case 'list':
        return handleListCommand(event, user);
      case 'history':
        return handleHistoryCommand(event, user);
      case 'pending':
        return handlePendingCommand(event, user);
      case 'view':
        return handleViewCommand(event, user, command.args);
      case 'approve':
        return handleApproveCommand(event, user, command.args);
      case 'reject':
        return handleRejectCommand(event, user, command.args);
      case 'help':
        return handleHelpCommand(event, user);
      default:
        return handleUnknownCommand(event, user, text);
    }
  } catch (e) {
    logError('onMessage', e);
    return buildMessageResponse(buildErrorCard('An unexpected error occurred. Please try again later.'));
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
// USER COMMAND HANDLERS
// =============================================================================

/**
 * Handles /request command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Command arguments (QP reference number)
 * @returns {object} Response
 */
function handleRequestCommand(event, user, args) {
  const qpRef = args.trim();

  if (!qpRef) {
    return buildMessageResponse(buildRequestCard(null, 'Please provide a question paper reference number.'));
  }

  // Create request
  const result = createRequest(user.UserID, qpRef);

  if (!result.success) {
    return buildMessageResponse(buildErrorCard(result.error));
  }

  // Notify admins
  const requestDetails = {
    requestId: result.data.requestId,
    userName: result.data.userName,
    userEmail: result.data.userEmail,
    qpRefNumber: result.data.qpRefNumber,
    qpName: result.data.qpName,
    requestTimestamp: formatTimestamp(new Date())
  };

  notifyAllAdmins(requestDetails);

  return buildMessageResponse(buildRequestSubmittedCard(result.data));
}

/**
 * Handles /status command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Command arguments (optional request ID)
 * @returns {object} Response
 */
function handleStatusCommand(event, user, args) {
  const requestId = args.trim();

  if (requestId) {
    // Get specific request status
    const request = getRequestById(requestId);

    if (!request) {
      return buildMessageResponse(buildErrorCard('Request not found.'));
    }

    // Verify user owns this request (or is admin)
    if (request.UserID !== user.UserID && user.Role !== USER_ROLES.ADMIN) {
      return buildMessageResponse(buildErrorCard('You do not have permission to view this request.'));
    }

    const statusData = getRequestStatus(requestId);
    return buildMessageResponse(buildStatusCard(statusData.data));
  } else {
    // Get user's recent requests
    const historyResult = getUserRequestHistory(user.UserID);

    if (!historyResult.success || historyResult.data.length === 0) {
      return buildMessageResponse({
        text: 'You have no password requests yet. Use `/request <QP_REF>` to submit one.'
      });
    }

    // Show last 3 requests
    const recentRequests = historyResult.data.slice(0, 3);
    let statusText = '*Your Recent Requests:*\n\n';

    recentRequests.forEach((req, index) => {
      const statusIcon = req.status === 'approved' ? '✅' :
                         req.status === 'rejected' ? '❌' : '⏳';
      statusText += `${index + 1}. ${statusIcon} **${req.qpRefNumber}** - ${req.qpName}\n`;
      statusText += `   Status: ${req.status.toUpperCase()}\n`;
      statusText += `   Requested: ${req.requestTimestamp}\n\n`;
    });

    return { text: statusText };
  }
}

/**
 * Handles /list command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleListCommand(event, user) {
  const questionPapers = getActiveQuestionPapers();
  return buildMessageResponse(buildQuestionPapersListCard(questionPapers));
}

/**
 * Handles /history command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleHistoryCommand(event, user) {
  const historyResult = getUserRequestHistory(user.UserID);

  if (!historyResult.success || historyResult.data.length === 0) {
    return { text: 'You have no password request history.' };
  }

  let historyText = '*Your Request History:*\n\n';

  historyResult.forEach((req, index) => {
    const statusIcon = req.status === 'approved' ? '✅' :
                       req.status === 'rejected' ? '❌' : '⏳';
    historyText += `${index + 1}. ${statusIcon} **${req.qpRefNumber}** - ${req.qpName}\n`;
    historyText += `   Status: ${req.status.toUpperCase()}\n`;
    historyText += `   Requested: ${req.requestTimestamp}\n`;

    if (req.approvalTimestamp) {
      historyText += `   ${req.status === 'approved' ? 'Approved' : 'Rejected'}: ${req.approvalTimestamp}\n`;
    }
    historyText += '\n';
  });

  return { text: historyText };
}

/**
 * Handles /help command
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handleHelpCommand(event, user) {
  return buildMessageResponse(buildHelpCard());
}

// =============================================================================
// ADMIN COMMAND HANDLERS
// =============================================================================

/**
 * Handles /pending command (admin only)
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @returns {object} Response
 */
function handlePendingCommand(event, user) {
  // Validate admin
  const adminValidation = validateAdmin(user.Email);
  if (!adminValidation.success) {
    return buildMessageResponse(buildErrorCard(adminValidation.error));
  }

  const pendingResult = getFormattedPendingRequests();
  return buildMessageResponse(buildPendingRequestsCard(pendingResult.data.requests));
}

/**
 * Handles /view command (admin only)
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Request ID
 * @returns {object} Response
 */
function handleViewCommand(event, user, args) {
  // Validate admin
  const adminValidation = validateAdmin(user.Email);
  if (!adminValidation.success) {
    return buildMessageResponse(buildErrorCard(adminValidation.error));
  }

  const requestId = args.trim();
  if (!requestId) {
    return buildMessageResponse(buildErrorCard('Please provide a request ID. Usage: `/view <REQUEST_ID>`'));
  }

  const request = getRequestById(requestId);
  if (!request) {
    return buildMessageResponse(buildErrorCard('Request not found.'));
  }

  // Get full request details
  const statusData = getRequestStatus(requestId);
  const requestUser = getUserById(request.UserID);

  const requestDetails = {
    requestId: request.RequestID,
    userName: requestUser ? requestUser.Name : 'Unknown',
    userEmail: requestUser ? requestUser.Email : 'Unknown',
    qpRefNumber: request.QPReferenceNumber,
    qpName: statusData.data.qpName,
    requestTimestamp: request.RequestTimestamp,
    status: request.Status
  };

  return buildMessageResponse(buildRequestDetailCard(requestDetails));
}

/**
 * Handles /approve command (admin only)
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Request ID
 * @returns {object} Response
 */
function handleApproveCommand(event, user, args) {
  // Validate admin
  const adminValidation = validateAdmin(user.Email);
  if (!adminValidation.success) {
    return buildMessageResponse(buildErrorCard(adminValidation.error));
  }

  const requestId = args.trim();
  if (!requestId) {
    return buildMessageResponse(buildErrorCard('Please provide a request ID. Usage: `/approve <REQUEST_ID>`'));
  }

  // Approve request
  const result = approveRequest(requestId, user.UserID);

  if (!result.success) {
    return buildMessageResponse(buildErrorCard(result.error));
  }

  // Notify user
  notifyUserApproval(result.data.userEmail, result.data);

  return buildMessageResponse(buildApprovalResultCard(result.data));
}

/**
 * Handles /reject command (admin only)
 * @param {object} event - Chat event
 * @param {object} user - User object
 * @param {string} args - Request ID and optional reason
 * @returns {object} Response
 */
function handleRejectCommand(event, user, args) {
  // Validate admin
  const adminValidation = validateAdmin(user.Email);
  if (!adminValidation.success) {
    return buildMessageResponse(buildErrorCard(adminValidation.error));
  }

  const parts = args.trim().split(/\s+/);
  const requestId = parts[0];
  const reason = parts.slice(1).join(' ');

  if (!requestId) {
    return buildMessageResponse(buildErrorCard('Please provide a request ID. Usage: `/reject <REQUEST_ID> [REASON]`'));
  }

  // Reject request
  const result = rejectRequest(requestId, user.UserID, reason);

  if (!result.success) {
    return buildMessageResponse(buildErrorCard(result.error));
  }

  // Notify user
  notifyUserRejection(result.data.userEmail, result.data);

  return buildMessageResponse(buildRejectionResultCard(result.data));
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
      case 'submitRequest': {
        const qpRef = getParam('qpReference');
        if (!qpRef) {
          return buildMessageResponse(buildErrorCard('Please enter a question paper reference number.'));
        }
        return handleRequestCommand(event, user, qpRef);
      }

      case 'approveRequest': {
        const requestId = getParam('requestId');
        return handleApproveCommand(event, user, requestId);
      }

      case 'rejectRequest': {
        const requestId = getParam('requestId');
        return handleRejectCommand(event, user, requestId);
      }

      case 'viewRequest': {
        const requestId = getParam('requestId');
        return handleViewCommand(event, user, requestId);
      }

      case 'viewPending': {
        return handlePendingCommand(event, user);
      }

      case 'showHelp': {
        return handleHelpCommand(event, user);
      }

      default:
        return buildMessageResponse(buildErrorCard('Unknown action.'));
    }
  } catch (e) {
    logError('onCardClick', e);
    return buildMessageResponse(buildErrorCard('An error occurred processing your request.'));
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
  const userEmail = getUserEmailFromEvent(event);

  // Get or create user
  const userResult = getOrCreateUserFromEvent(event);

  let welcomeMessage = '👋 Welcome to the Password Request Bot!\n\n';
  welcomeMessage += 'I help you request and manage passwords for question papers.\n\n';
  welcomeMessage += '**Quick Start:**\n';
  welcomeMessage += '• Type `/help` to see all available commands\n';
  welcomeMessage += '• Type `/list` to see available question papers\n';
  welcomeMessage += '• Type `/request <QP_REF>` to request a password\n';

  if (spaceType === 'DM') {
    welcomeMessage += '\nYou can interact with me directly here.';
  } else {
    welcomeMessage += '\nFeel free to use commands in this space or DM me directly.';
  }

  return { text: welcomeMessage };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
// STANDALONE FUNCTIONS FOR TESTING
// =============================================================================

/**
 * Tests the bot functionality
 * Can be run from the Apps Script editor
 */
function testBot() {
  console.log('Testing Password Request Bot...');

  // Test user retrieval
  const admins = getAllAdmins();
  console.log(`Found ${admins.length} admin(s)`);

  // Test question papers
  const qps = getActiveQuestionPapers();
  console.log(`Found ${qps.length} active question paper(s)`);

  // Test pending requests
  const pending = getPendingRequests();
  console.log(`Found ${pending.length} pending request(s)`);

  console.log('Test complete.');
}

/**
 * Sets up initial admin user
 * Run this once after deployment
 */
function setupInitialAdmin() {
  // TODO: Replace with your email
  const adminEmail = 'YOUR_EMAIL@example.com';
  const adminName = 'Admin User';

  const result = addUser({
    name: adminName,
    email: adminEmail,
    role: USER_ROLES.ADMIN
  });

  if (result.success) {
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log(`Error: ${result.error}`);
  }
}
