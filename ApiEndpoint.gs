/**
 * ApiEndpoint.gs - Web App API for EQPMS Integration
 * Provides HTTP endpoints for EQPMS to call when assigning papers
 */

// =============================================================================
// WEB APP ENTRY POINTS
// =============================================================================

/**
 * Handles GET requests - Health check
 */
function doGet(e) {
  // Handle case when called directly from editor for testing
  if (!e) {
    e = { parameter: {} };
  }

  const action = e.parameter.action || 'health';

  switch (action) {
    case 'health':
      return jsonResponse({ status: 'ok', service: 'Password Request Bot', timestamp: getCurrentTimestamp() });

    case 'assignments':
      return handleGetAssignments(e);

    case 'password':
      return handleGetPassword(e);

    case 'stats':
      return handleGetStats();

    default:
      return jsonResponse(createErrorResponse('Unknown action'), 400);
  }
}

/**
 * Handles POST requests - Assignment creation
 */
function doPost(e) {
  // Handle case when called directly from editor for testing
  if (!e) {
    e = { parameter: {}, postData: { contents: '{}' } };
  }

  try {
    const action = e.parameter.action || 'create';
    const postData = e.postData ? JSON.parse(e.postData.contents) : null;

    switch (action) {
      case 'create':
        return handleCreateAssignment(postData);

      case 'bulk':
        return handleBulkAssignments(postData);

      case 'sync-users':
        return handleSyncUsers(postData);

      case 'mark-submitted':
        return handleMarkSubmitted(postData);

      case 'mark-used':
        return handleMarkUsed(postData);

      default:
        return jsonResponse(createErrorResponse('Unknown action'), 400);
    }
  } catch (error) {
    logError('doPost', error);
    return jsonResponse(createErrorResponse('Invalid request: ' + error.message), 400);
  }
}

// =============================================================================
// API HANDLERS
// =============================================================================

/**
 * Handles assignment creation from EQPMS
 * POST /exec?action=create
 * Body: { qpRefNo, facultyRegno, facultyName, facultyEmail, boardName, subjectName }
 */
function handleCreateAssignment(data) {
  if (!data) {
    return jsonResponse(createErrorResponse('No data provided'), 400);
  }

  const result = createAssignment(data);
  const statusCode = result.success ? 200 : 400;

  return jsonResponse(result, statusCode);
}

/**
 * Handles bulk assignment creation
 * POST /exec?action=bulk
 * Body: { assignments: [{ qpRefNo, facultyRegno, facultyName, facultyEmail, boardName, subjectName }, ...] }
 */
function handleBulkAssignments(data) {
  if (!data || !data.assignments) {
    return jsonResponse(createErrorResponse('No assignments provided'), 400);
  }

  const result = createBulkAssignments(data.assignments);
  const statusCode = result.success ? 200 : 400;

  return jsonResponse(result, statusCode);
}

/**
 * Handles user sync from EQPMS
 * POST /exec?action=sync-users
 * Body: { users: [{ name, email, regno, role, board }, ...] }
 */
function handleSyncUsers(data) {
  if (!data || !data.users) {
    return jsonResponse(createErrorResponse('No users provided'), 400);
  }

  const result = syncUsersFromEQPMS(data.users);
  const statusCode = result.success ? 200 : 400;

  return jsonResponse(result, statusCode);
}

/**
 * Marks assignment as submitted
 * POST /exec?action=mark-submitted
 * Body: { assignmentId }
 */
function handleMarkSubmitted(data) {
  if (!data || !data.assignmentId) {
    return jsonResponse(createErrorResponse('Assignment ID required'), 400);
  }

  const result = markAssignmentSubmitted(data.assignmentId);
  const statusCode = result.success ? 200 : 400;

  return jsonResponse(result, statusCode);
}

/**
 * Marks assignment as used
 * POST /exec?action=mark-used
 * Body: { assignmentId }
 */
function handleMarkUsed(data) {
  if (!data || !data.assignmentId) {
    return jsonResponse(createErrorResponse('Assignment ID required'), 400);
  }

  const result = markAssignmentUsed(data.assignmentId);
  const statusCode = result.success ? 200 : 400;

  return jsonResponse(result, statusCode);
}

/**
 * Gets assignments
 * GET /exec?action=assignments&facultyRegno=xxx
 * or GET /exec?action=assignments&qpRefNo=xxx
 */
function handleGetAssignments(e) {
  const facultyRegno = e.parameter.facultyRegno;
  const qpRefNo = e.parameter.qpRefNo;
  const status = e.parameter.status;

  let assignments;

  if (facultyRegno) {
    assignments = getAssignmentsByFaculty(facultyRegno);
  } else if (qpRefNo) {
    assignments = getAssignmentsByQP(qpRefNo);
  } else if (status) {
    assignments = getAssignmentsByStatus(status);
  } else {
    assignments = getAllAssignments();
  }

  // Remove passwords from response for security (unless explicitly requested)
  const includePassword = e.parameter.includePassword === 'true';

  const sanitizedAssignments = assignments.map(a => {
    const obj = {
      assignmentId: a.Assignment_ID,
      qpRefNo: a.QP_Ref_No,
      facultyRegno: a.Faculty_Regno,
      facultyName: a.Faculty_Name,
      facultyEmail: a.Faculty_Email,
      status: a.Status,
      generatedAt: a.Generated_At,
      boardName: a.Board_Name,
      subjectName: a.Subject_Name
    };

    if (includePassword) {
      obj.password = a.Password;
    }

    return obj;
  });

  return jsonResponse(createSuccessResponse({
    total: sanitizedAssignments.length,
    assignments: sanitizedAssignments
  }));
}

/**
 * Gets password for a QP (COE access)
 * GET /exec?action=password&qpRefNo=xxx&regno=xxx
 */
function handleGetPassword(e) {
  const qpRefNo = e.parameter.qpRefNo;
  const regno = e.parameter.regno;

  if (!qpRefNo) {
    return jsonResponse(createErrorResponse('QP Reference number required'), 400);
  }

  if (!regno) {
    return jsonResponse(createErrorResponse('Registration number required'), 400);
  }

  // Validate user
  const user = getUserByRegno(regno);
  if (!user) {
    return jsonResponse(createErrorResponse('User not found'), 404);
  }

  // Validate access (COE, HOB, Admin)
  const accessResult = validatePasswordAccess(user.Email);
  if (!accessResult.success) {
    return jsonResponse(accessResult, 403);
  }

  // Get password
  const result = getPasswordForCOE(qpRefNo, user);
  const statusCode = result.success ? 200 : 404;

  return jsonResponse(result, statusCode);
}

/**
 * Gets statistics
 * GET /exec?action=stats
 */
function handleGetStats() {
  const stats = getAssignmentStats();
  return jsonResponse(createSuccessResponse(stats));
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Creates a JSON response
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {TextOutput} JSON response
 */
function jsonResponse(data, statusCode) {
  statusCode = statusCode || 200;

  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // Note: Apps Script doesn't support setting status codes directly
  // The status code is included in the response body for reference
  if (statusCode !== 200 && !data.statusCode) {
    data.statusCode = statusCode;
  }

  return output;
}

// =============================================================================
// AUTHENTICATION HELPER FOR EQPMS
// =============================================================================

/**
 * Validates API key for EQPMS requests
 * Add this to your handlers if you want API key protection
 * @param {object} e - Event object
 * @returns {boolean} True if valid
 */
function validateApiKey(e) {
  const apiKey = e.parameter.apiKey || (e.postData ? JSON.parse(e.postData.contents).apiKey : null);

  // TODO: Set your API key here or in script properties
  const validApiKey = PropertiesService.getScriptProperties().getProperty('EQPMS_API_KEY') || 'YOUR_API_KEY';

  return apiKey === validApiKey;
}

/**
 * Sets the API key (run once to configure)
 * @param {string} key - API key to set
 */
function setApiKey(key) {
  PropertiesService.getScriptProperties().setProperty('EQPMS_API_KEY', key);
  logInfo('setApiKey', 'API key configured');
}

// =============================================================================
// TESTING FUNCTIONS
// =============================================================================

/**
 * Tests the API endpoints
 */
function testApi() {
  console.log('Testing API...');

  // Test assignment creation
  const testAssignment = {
    qpRefNo: 'QP-TEST-001',
    facultyRegno: 'FAC001',
    facultyName: 'Test Faculty',
    facultyEmail: 'test@example.com',
    boardName: 'CSE',
    subjectName: 'Data Structures'
  };

  const result = createAssignment(testAssignment);
  console.log('Create Assignment Result:', JSON.stringify(result, null, 2));

  // Test get assignments
  const assignments = getAssignmentsByFaculty('FAC001');
  console.log('Faculty Assignments:', assignments.length);

  // Test stats
  const stats = getAssignmentStats();
  console.log('Stats:', JSON.stringify(stats, null, 2));

  console.log('API test complete.');
}

/**
 * Creates test data for development
 */
function createTestData() {
  console.log('Creating test data...');

  // Initialize sheets
  initializeSheets();

  // Add test users
  addUser({
    name: 'Dr. Test COE',
    email: 'coe@test.com',
    regno: 'COE001',
    role: USER_ROLES.COE,
    board: 'ALL'
  });

  addUser({
    name: 'Prof. Test Faculty',
    email: 'faculty@test.com',
    regno: 'FAC001',
    role: USER_ROLES.FACULTY,
    board: 'CSE'
  });

  addUser({
    name: 'Prof. Test Faculty 2',
    email: 'faculty2@test.com',
    regno: 'FAC002',
    role: USER_ROLES.FACULTY,
    board: 'CSE'
  });

  // Add test assignments
  createAssignment({
    qpRefNo: 'QP-CS101-2024',
    facultyRegno: 'FAC001',
    facultyName: 'Prof. Test Faculty',
    facultyEmail: 'faculty@test.com',
    boardName: 'CSE',
    subjectName: 'Data Structures'
  });

  createAssignment({
    qpRefNo: 'QP-CS102-2024',
    facultyRegno: 'FAC002',
    facultyName: 'Prof. Test Faculty 2',
    facultyEmail: 'faculty2@test.com',
    boardName: 'CSE',
    subjectName: 'Algorithms'
  });

  console.log('Test data created.');
}
