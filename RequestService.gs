/**
 * RequestService.gs - Password Request Workflow
 * Handles all password request operations
 */

// =============================================================================
// REQUEST RETRIEVAL FUNCTIONS
// =============================================================================

/**
 * Gets a request by request ID
 * @param {string} requestId - Request ID
 * @returns {object|null} Request object or null if not found
 */
function getRequestById(requestId) {
  return findRowByColumn(SHEET_NAMES.PASSWORD_REQUESTS, PASSWORD_REQUEST_COLUMNS.REQUEST_ID, requestId);
}

/**
 * Gets all requests
 * @returns {Array} Array of request objects
 */
function getAllRequests() {
  return getAllRowsAsObjects(SHEET_NAMES.PASSWORD_REQUESTS);
}

/**
 * Gets all pending requests
 * @returns {Array} Array of pending request objects
 */
function getPendingRequests() {
  return findRowsByColumn(SHEET_NAMES.PASSWORD_REQUESTS, PASSWORD_REQUEST_COLUMNS.STATUS, REQUEST_STATUS.PENDING);
}

/**
 * Gets all approved requests
 * @returns {Array} Array of approved request objects
 */
function getApprovedRequests() {
  return findRowsByColumn(SHEET_NAMES.PASSWORD_REQUESTS, PASSWORD_REQUEST_COLUMNS.STATUS, REQUEST_STATUS.APPROVED);
}

/**
 * Gets all rejected requests
 * @returns {Array} Array of rejected request objects
 */
function getRejectedRequests() {
  return findRowsByColumn(SHEET_NAMES.PASSWORD_REQUESTS, PASSWORD_REQUEST_COLUMNS.STATUS, REQUEST_STATUS.REJECTED);
}

/**
 * Gets all requests by a user
 * @param {string} userId - User ID
 * @returns {Array} Array of user's request objects
 */
function getUserRequests(userId) {
  return findRowsByColumn(SHEET_NAMES.PASSWORD_REQUESTS, PASSWORD_REQUEST_COLUMNS.USER_ID, userId);
}

/**
 * Gets pending requests for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of user's pending requests
 */
function getUserPendingRequests(userId) {
  const userRequests = getUserRequests(userId);
  return userRequests.filter(req => req.Status === REQUEST_STATUS.PENDING);
}

/**
 * Gets a user's request for a specific question paper
 * @param {string} userId - User ID
 * @param {string} qpRefNumber - Question paper reference number
 * @returns {object|null} Request object or null
 */
function getUserRequestForQP(userId, qpRefNumber) {
  const userRequests = getUserRequests(userId);
  return userRequests.find(req => req.QPReferenceNumber === qpRefNumber) || null;
}

// =============================================================================
// REQUEST CREATION AND MANAGEMENT
// =============================================================================

/**
 * Creates a new password request
 * @param {string} userId - User ID making the request
 * @param {string} qpRefNumber - Question paper reference number
 * @returns {object} Result with request details or error
 */
function createRequest(userId, qpRefNumber) {
  // Validate user
  const user = getUserById(userId);
  if (!user) {
    return createErrorResponse('User not found.');
  }

  if (user.Status !== USER_STATUS.ACTIVE) {
    return createErrorResponse('User account is inactive.');
  }

  // Validate question paper
  const qpValidation = validateQuestionPaperForRequest(qpRefNumber);
  if (!qpValidation.success) {
    return qpValidation;
  }

  // Check for existing pending request
  const existingRequest = getUserRequestForQP(userId, qpRefNumber);
  if (existingRequest && existingRequest.Status === REQUEST_STATUS.PENDING) {
    return createErrorResponse(`You already have a pending request for ${qpRefNumber}. Please wait for approval.`);
  }

  // Generate request ID
  const requestId = generateUniqueId('REQ');

  // Prepare row data
  const rowData = [
    requestId,
    userId,
    qpRefNumber,
    formatTimestamp(new Date()),
    REQUEST_STATUS.PENDING,
    '', // Admin ID (empty until approved)
    ''  // Approval timestamp (empty until approved)
  ];

  // Add to sheet
  appendRow(SHEET_NAMES.PASSWORD_REQUESTS, rowData);

  return createSuccessResponse({
    requestId: requestId,
    userId: userId,
    qpRefNumber: qpRefNumber,
    userName: user.Name,
    userEmail: user.Email,
    qpName: qpValidation.data.SubjectName,
    message: 'Password request submitted successfully.'
  });
}

/**
 * Approves a password request
 * @param {string} requestId - Request ID
 * @param {string} adminId - Admin user ID
 * @returns {object} Result with approval details
 */
function approveRequest(requestId, adminId) {
  const request = getRequestById(requestId);

  if (!request) {
    return createErrorResponse('Request not found.');
  }

  if (request.Status !== REQUEST_STATUS.PENDING) {
    return createErrorResponse(`Request is already ${request.Status}.`);
  }

  // Get admin info
  const admin = getUserById(adminId);
  if (!admin) {
    return createErrorResponse('Admin not found.');
  }

  // Get user info
  const user = getUserById(request.UserID);
  if (!user) {
    return createErrorResponse('Requesting user not found.');
  }

  // Get password
  const password = getPassword(request.QPReferenceNumber);
  if (!password) {
    return createErrorResponse('Password not found for this question paper.');
  }

  // Update request status
  updateCell(SHEET_NAMES.PASSWORD_REQUESTS, request._rowIndex, PASSWORD_REQUEST_COLUMNS.STATUS, REQUEST_STATUS.APPROVED);
  updateCell(SHEET_NAMES.PASSWORD_REQUESTS, request._rowIndex, PASSWORD_REQUEST_COLUMNS.ADMIN_ID, adminId);
  updateCell(SHEET_NAMES.PASSWORD_REQUESTS, request._rowIndex, PASSWORD_REQUEST_COLUMNS.APPROVAL_TIMESTAMP, formatTimestamp(new Date()));

  // Get question paper info
  const qp = getQuestionPaperByRef(request.QPReferenceNumber);

  return createSuccessResponse({
    requestId: requestId,
    userId: request.UserID,
    userName: user.Name,
    userEmail: user.Email,
    qpRefNumber: request.QPReferenceNumber,
    qpName: qp ? qp.SubjectName : request.QPReferenceNumber,
    password: password,
    adminName: admin.Name,
    message: 'Request approved successfully.'
  });
}

/**
 * Rejects a password request
 * @param {string} requestId - Request ID
 * @param {string} adminId - Admin user ID
 * @param {string} reason - Rejection reason (optional)
 * @returns {object} Result with rejection details
 */
function rejectRequest(requestId, adminId, reason) {
  const request = getRequestById(requestId);

  if (!request) {
    return createErrorResponse('Request not found.');
  }

  if (request.Status !== REQUEST_STATUS.PENDING) {
    return createErrorResponse(`Request is already ${request.Status}.`);
  }

  // Get admin info
  const admin = getUserById(adminId);
  if (!admin) {
    return createErrorResponse('Admin not found.');
  }

  // Get user info
  const user = getUserById(request.UserID);
  if (!user) {
    return createErrorResponse('Requesting user not found.');
  }

  // Update request status
  updateCell(SHEET_NAMES.PASSWORD_REQUESTS, request._rowIndex, PASSWORD_REQUEST_COLUMNS.STATUS, REQUEST_STATUS.REJECTED);
  updateCell(SHEET_NAMES.PASSWORD_REQUESTS, request._rowIndex, PASSWORD_REQUEST_COLUMNS.ADMIN_ID, adminId);
  updateCell(SHEET_NAMES.PASSWORD_REQUESTS, request._rowIndex, PASSWORD_REQUEST_COLUMNS.APPROVAL_TIMESTAMP, formatTimestamp(new Date()));

  // Get question paper info
  const qp = getQuestionPaperByRef(request.QPReferenceNumber);

  return createSuccessResponse({
    requestId: requestId,
    userId: request.UserID,
    userName: user.Name,
    userEmail: user.Email,
    qpRefNumber: request.QPReferenceNumber,
    qpName: qp ? qp.SubjectName : request.QPReferenceNumber,
    adminName: admin.Name,
    reason: reason || 'No reason provided',
    message: 'Request rejected.'
  });
}

// =============================================================================
// REQUEST STATUS AND HISTORY
// =============================================================================

/**
 * Gets the status of a request
 * @param {string} requestId - Request ID
 * @returns {object} Request status details
 */
function getRequestStatus(requestId) {
  const request = getRequestById(requestId);

  if (!request) {
    return createErrorResponse('Request not found.');
  }

  const user = getUserById(request.UserID);
  const qp = getQuestionPaperByRef(request.QPReferenceNumber);
  const admin = request.AdminID ? getUserById(request.AdminID) : null;

  return createSuccessResponse({
    requestId: request.RequestID,
    userId: request.UserID,
    userName: user ? user.Name : 'Unknown',
    qpRefNumber: request.QPReferenceNumber,
    qpName: qp ? qp.SubjectName : request.QPReferenceNumber,
    status: request.Status,
    requestTimestamp: request.RequestTimestamp,
    adminName: admin ? admin.Name : null,
    approvalTimestamp: request.ApprovalTimestamp || null
  });
}

/**
 * Gets user's request history
 * @param {string} userId - User ID
 * @returns {object} Array of user's requests with details
 */
function getUserRequestHistory(userId) {
  const requests = getUserRequests(userId);

  if (requests.length === 0) {
    return createSuccessResponse([]);
  }

  const enrichedRequests = requests.map(req => {
    const qp = getQuestionPaperByRef(req.QPReferenceNumber);
    const admin = req.AdminID ? getUserById(req.AdminID) : null;

    return {
      requestId: req.RequestID,
      qpRefNumber: req.QPReferenceNumber,
      qpName: qp ? qp.SubjectName : req.QPReferenceNumber,
      status: req.Status,
      requestTimestamp: req.RequestTimestamp,
      adminName: admin ? admin.Name : null,
      approvalTimestamp: req.ApprovalTimestamp || null
    };
  });

  // Sort by request timestamp (newest first)
  enrichedRequests.sort((a, b) => {
    return new Date(b.requestTimestamp) - new Date(a.requestTimestamp);
  });

  return createSuccessResponse(enrichedRequests);
}

/**
 * Gets formatted pending requests for admin view
 * @returns {object} Formatted pending requests
 */
function getFormattedPendingRequests() {
  const pendingRequests = getPendingRequests();

  if (pendingRequests.length === 0) {
    return createSuccessResponse({
      message: 'No pending requests.',
      requests: []
    });
  }

  const formattedRequests = pendingRequests.map(req => {
    const user = getUserById(req.UserID);
    const qp = getQuestionPaperByRef(req.QPReferenceNumber);

    return {
      requestId: req.RequestID,
      userId: req.UserID,
      userName: user ? user.Name : 'Unknown',
      userEmail: user ? user.Email : 'Unknown',
      qpRefNumber: req.QPReferenceNumber,
      qpName: qp ? qp.SubjectName : req.QPReferenceNumber,
      requestTimestamp: req.RequestTimestamp
    };
  });

  // Sort by request timestamp (oldest first for admin priority)
  formattedRequests.sort((a, b) => {
    return new Date(a.requestTimestamp) - new Date(b.requestTimestamp);
  });

  return createSuccessResponse({
    message: `Found ${formattedRequests.length} pending request(s).`,
    requests: formattedRequests
  });
}
