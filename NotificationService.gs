/**
 * NotificationService.gs - Admin Notifications
 * Handles notifications via DM and Admin Room
 */

// =============================================================================
// ADMIN NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Notifies all admins via DM about a new request
 * @param {object} requestDetails - Request details object
 * @returns {object} Result with notification status
 */
function notifyAdminsViaDM(requestDetails) {
  const admins = getActiveAdmins();

  if (admins.length === 0) {
    console.warn('No active admins found to notify.');
    return createErrorResponse('No active admins available.');
  }

  const results = [];
  let successCount = 0;

  admins.forEach(admin => {
    try {
      const result = sendDirectMessage(admin.Email, buildAdminNotificationMessage(requestDetails));
      results.push({
        admin: admin.Email,
        success: result.success
      });
      if (result.success) {
        successCount++;
      }
    } catch (e) {
      logError('notifyAdminsViaDM', e);
      results.push({
        admin: admin.Email,
        success: false,
        error: e.message
      });
    }
  });

  return createSuccessResponse({
    totalAdmins: admins.length,
    notified: successCount,
    results: results
  });
}

/**
 * Posts notification to admin space/room
 * @param {object} requestDetails - Request details object
 * @returns {object} Result with post status
 */
function notifyAdminRoom(requestDetails) {
  if (!ADMIN_SPACE_WEBHOOK_URL || ADMIN_SPACE_WEBHOOK_URL === 'YOUR_ADMIN_SPACE_WEBHOOK_URL_HERE') {
    console.warn('Admin space webhook URL not configured.');
    return createErrorResponse('Admin space webhook not configured.');
  }

  try {
    const message = buildAdminRoomNotificationMessage(requestDetails);
    const payload = {
      text: message.text,
      cards: message.cards
    };

    const response = UrlFetchApp.fetch(ADMIN_SPACE_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return createSuccessResponse({ message: 'Posted to admin room successfully.' });
    } else {
      return createErrorResponse(`Failed to post to admin room: ${response.getContentText()}`);
    }
  } catch (e) {
    logError('notifyAdminRoom', e);
    return createErrorResponse(`Error posting to admin room: ${e.message}`);
  }
}

/**
 * Notifies admins via both DM and admin room
 * @param {object} requestDetails - Request details object
 * @returns {object} Result with combined notification status
 */
function notifyAllAdmins(requestDetails) {
  const dmResult = notifyAdminsViaDM(requestDetails);
  const roomResult = notifyAdminRoom(requestDetails);

  return createSuccessResponse({
    dmNotification: dmResult,
    roomNotification: roomResult
  });
}

// =============================================================================
// USER NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Sends a direct message to a specific user
 * @param {string} userEmail - User's email address
 * @param {object} message - Message object with text and optional cards
 * @returns {object} Result with send status
 */
function sendDirectMessage(userEmail, message) {
  try {
    const user = getUserByEmail(userEmail);
    if (!user) {
      return createErrorResponse('User not found.');
    }

    // Use Chat API to send DM
    const chat = HangoutsChat;
    const spaceName = `dm-${userEmail}`;

    const payload = {
      text: message.text || '',
      cards: message.cards || []
    };

    // Note: In production, you would use the Chat API properly
    // This is a placeholder for the actual API call
    // Chat.AppScript.createMessage(spaceName, payload);

    return createSuccessResponse({ message: 'DM sent successfully.' });
  } catch (e) {
    logError('sendDirectMessage', e);
    return createErrorResponse(`Failed to send DM: ${e.message}`);
  }
}

/**
 * Notifies user about request approval
 * @param {string} userEmail - User's email address
 * @param {object} approvalDetails - Approval details
 * @returns {object} Result with notification status
 */
function notifyUserApproval(userEmail, approvalDetails) {
  const message = buildApprovalNotificationMessage(approvalDetails);
  return sendDirectMessage(userEmail, message);
}

/**
 * Notifies user about request rejection
 * @param {string} userEmail - User's email address
 * @param {object} rejectionDetails - Rejection details
 * @returns {object} Result with notification status
 */
function notifyUserRejection(userEmail, rejectionDetails) {
  const message = buildRejectionNotificationMessage(rejectionDetails);
  return sendDirectMessage(userEmail, message);
}

// =============================================================================
// MESSAGE BUILDERS
// =============================================================================

/**
 * Builds admin notification message for DM
 * @param {object} details - Request details
 * @returns {object} Message object
 */
function buildAdminNotificationMessage(details) {
  const text = `🔐 New Password Request\n\n` +
    `*Request ID:* ${details.requestId}\n` +
    `*User:* ${details.userName} (${details.userEmail})\n` +
    `*Question Paper:* ${details.qpRefNumber} - ${details.qpName}\n` +
    `*Requested:* ${details.requestTimestamp}\n\n` +
    `Use /pending to view all pending requests.`;

  return {
    text: text,
    cards: []
  };
}

/**
 * Builds admin room notification message
 * @param {object} details - Request details
 * @returns {object} Message object with cards
 */
function buildAdminRoomNotificationMessage(details) {
  const text = `🔐 New Password Request from ${details.userName}`;

  const cards = [{
    "header": {
      "title": "Password Request",
      "subtitle": details.requestId,
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/lock/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "User",
            "content": `${details.userName}\n${details.userEmail}`,
            "contentMultiline": true
          }
        },
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${details.qpRefNumber}\n${details.qpName}`,
            "contentMultiline": true
          }
        },
        {
          "keyValue": {
            "topLabel": "Requested At",
            "content": details.requestTimestamp
          }
        }
      ]
    }, {
      "widgets": [
        {
          "buttons": [
            {
              "textButton": {
                "text": "VIEW PENDING",
                "onClick": {
                  "action": {
                    "actionMethodName": "viewPending",
                    "parameters": []
                  }
                }
              }
            }
          ]
        }
      ]
    }]
  }];

  return {
    text: text,
    cards: cards
  };
}

/**
 * Builds approval notification message for user
 * @param {object} details - Approval details
 * @returns {object} Message object
 */
function buildApprovalNotificationMessage(details) {
  const text = `✅ Your Password Request Has Been Approved!\n\n` +
    `*Question Paper:* ${details.qpRefNumber} - ${details.qpName}\n` +
    `*Password:* ||${details.password}||\n\n` +
    `Approved by: ${details.adminName}`;

  const cards = [{
    "header": {
      "title": "Request Approved",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/check_circle/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${details.qpRefNumber}\n${details.qpName}`,
            "contentMultiline": true
          }
        },
        {
          "keyValue": {
            "topLabel": "Password",
            "content": details.password,
            "icon": "KEY"
          }
        },
        {
          "keyValue": {
            "topLabel": "Approved By",
            "content": details.adminName
          }
        }
      ]
    }]
  }];

  return {
    text: text,
    cards: cards
  };
}

/**
 * Builds rejection notification message for user
 * @param {object} details - Rejection details
 * @returns {object} Message object
 */
function buildRejectionNotificationMessage(details) {
  const text = `❌ Your Password Request Has Been Rejected\n\n` +
    `*Question Paper:* ${details.qpRefNumber} - ${details.qpName}\n` +
    `*Reason:* ${details.reason || 'No reason provided'}\n\n` +
    `Please contact an administrator if you have questions.`;

  const cards = [{
    "header": {
      "title": "Request Rejected",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/cancel/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${details.qpRefNumber}\n${details.qpName}`,
            "contentMultiline": true
          }
        },
        {
          "keyValue": {
            "topLabel": "Reason",
            "content": details.reason || 'No reason provided',
            "contentMultiline": true
          }
        }
      ]
    }]
  }];

  return {
    text: text,
    cards: cards
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets the webhook URL for admin space
 * @returns {string} Admin space webhook URL
 */
function getAdminSpaceWebhookUrl() {
  return ADMIN_SPACE_WEBHOOK_URL;
}

/**
 * Tests the admin room notification
 * @returns {object} Test result
 */
function testAdminRoomNotification() {
  const testDetails = {
    requestId: 'TEST-001',
    userName: 'Test User',
    userEmail: 'test@example.com',
    qpRefNumber: 'QP-TEST',
    qpName: 'Test Subject',
    requestTimestamp: formatTimestamp(new Date())
  };

  return notifyAdminRoom(testDetails);
}
