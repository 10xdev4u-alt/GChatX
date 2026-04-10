/**
 * AssignmentService.gs - Assignment & Password Management
 * Handles all assignment-related operations including password generation
 */

// =============================================================================
// ASSIGNMENT CREATION (Called by EQPMS API)
// =============================================================================

/**
 * Creates a new assignment with auto-generated password
 * Called when COE assigns a paper to faculty
 * @param {object} assignmentData - Assignment details
 * @param {string} assignmentData.qpRefNo - Question paper reference number
 * @param {string} assignmentData.facultyRegno - Faculty registration number
 * @param {string} assignmentData.facultyName - Faculty name
 * @param {string} assignmentData.facultyEmail - Faculty email
 * @param {string} assignmentData.boardName - Board name (optional)
 * @param {string} assignmentData.subjectName - Subject name (optional)
 * @returns {object} Result with assignment_id and password
 */
function createAssignment(assignmentData) {
  // Validate required fields
  if (!assignmentData.qpRefNo) {
    return createErrorResponse('QP Reference Number is required.');
  }
  if (!assignmentData.facultyRegno) {
    return createErrorResponse('Faculty Registration Number is required.');
  }
  if (!assignmentData.facultyName) {
    return createErrorResponse('Faculty Name is required.');
  }
  if (!assignmentData.facultyEmail) {
    return createErrorResponse('Faculty Email is required.');
  }

  // Check if assignment already exists for this QP + Faculty combination
  const existingAssignment = findAssignmentByQPAndFaculty(
    assignmentData.qpRefNo,
    assignmentData.facultyRegno
  );

  if (existingAssignment) {
    // Return existing assignment
    return createSuccessResponse({
      assignmentId: existingAssignment.Assignment_ID,
      password: existingAssignment.Password,
      status: existingAssignment.Status,
      message: 'Assignment already exists for this faculty and paper.'
    });
  }

  // Generate new assignment
  const assignmentId = generateAssignmentId();
  const password = generateSecurePassword();
  const generatedAt = getCurrentTimestamp();

  // Prepare row data
  const rowData = [
    assignmentId,
    assignmentData.qpRefNo,
    assignmentData.facultyRegno,
    assignmentData.facultyName,
    assignmentData.facultyEmail,
    password,
    generatedAt,
    ASSIGNMENT_STATUS.PENDING,
    '', // Retrieved_At
    '', // Submitted_At
    assignmentData.boardName || '',
    assignmentData.subjectName || ''
  ];

  // Add to sheet
  appendRow(SHEET_NAMES.ASSIGNMENTS, rowData);

  logInfo('createAssignment', `Created assignment ${assignmentId} for ${assignmentData.qpRefNo} - ${assignmentData.facultyRegno}`);

  return createSuccessResponse({
    assignmentId: assignmentId,
    qpRefNo: assignmentData.qpRefNo,
    facultyRegno: assignmentData.facultyRegno,
    facultyName: assignmentData.facultyName,
    password: password,
    generatedAt: generatedAt,
    status: ASSIGNMENT_STATUS.PENDING
  });
}

/**
 * Creates multiple assignments in bulk (for batch assignment)
 * @param {Array} assignments - Array of assignment data objects
 * @returns {object} Result with array of created assignments
 */
function createBulkAssignments(assignments) {
  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    return createErrorResponse('No assignments provided.');
  }

  const results = [];
  const rowsData = [];

  for (const assignmentData of assignments) {
    // Check if already exists
    const existingAssignment = findAssignmentByQPAndFaculty(
      assignmentData.qpRefNo,
      assignmentData.facultyRegno
    );

    if (existingAssignment) {
      results.push({
        assignmentId: existingAssignment.Assignment_ID,
        qpRefNo: assignmentData.qpRefNo,
        facultyRegno: assignmentData.facultyRegno,
        password: existingAssignment.Password,
        status: 'existing',
        message: 'Assignment already exists.'
      });
      continue;
    }

    // Generate new assignment
    const assignmentId = generateAssignmentId();
    const password = generateSecurePassword();
    const generatedAt = getCurrentTimestamp();

    const rowData = [
      assignmentId,
      assignmentData.qpRefNo,
      assignmentData.facultyRegno,
      assignmentData.facultyName,
      assignmentData.facultyEmail,
      password,
      generatedAt,
      ASSIGNMENT_STATUS.PENDING,
      '',
      '',
      assignmentData.boardName || '',
      assignmentData.subjectName || ''
    ];

    rowsData.push(rowData);

    results.push({
      assignmentId: assignmentId,
      qpRefNo: assignmentData.qpRefNo,
      facultyRegno: assignmentData.facultyRegno,
      facultyName: assignmentData.facultyName,
      password: password,
      status: 'created'
    });
  }

  // Bulk insert
  if (rowsData.length > 0) {
    appendRows(SHEET_NAMES.ASSIGNMENTS, rowsData);
  }

  logInfo('createBulkAssignments', `Created ${rowsData.length} new assignments`);

  return createSuccessResponse({
    total: assignments.length,
    created: rowsData.length,
    existing: results.filter(r => r.status === 'existing').length,
    assignments: results
  });
}

// =============================================================================
// ASSIGNMENT RETRIEVAL
// =============================================================================

/**
 * Finds an assignment by QP Reference Number and Faculty Regno
 * @param {string} qpRefNo - Question paper reference number
 * @param {string} facultyRegno - Faculty registration number
 * @returns {object|null} Assignment object or null
 */
function findAssignmentByQPAndFaculty(qpRefNo, facultyRegno) {
  const conditions = [
    { columnIndex: ASSIGNMENT_COLUMNS.QP_REF_NO, value: qpRefNo },
    { columnIndex: ASSIGNMENT_COLUMNS.FACULTY_REGNO, value: facultyRegno }
  ];
  const results = findRowsByMultipleColumns(SHEET_NAMES.ASSIGNMENTS, conditions);
  return results.length > 0 ? results[0] : null;
}

/**
 * Gets an assignment by Assignment ID
 * @param {string} assignmentId - Assignment ID
 * @returns {object|null} Assignment object or null
 */
function getAssignmentById(assignmentId) {
  return findRowByColumn(SHEET_NAMES.ASSIGNMENTS, ASSIGNMENT_COLUMNS.ASSIGNMENT_ID, assignmentId);
}

/**
 * Gets all assignments for a faculty
 * @param {string} facultyRegno - Faculty registration number
 * @returns {Array} Array of assignment objects
 */
function getAssignmentsByFaculty(facultyRegno) {
  return findRowsByColumn(SHEET_NAMES.ASSIGNMENTS, ASSIGNMENT_COLUMNS.FACULTY_REGNO, facultyRegno);
}

/**
 * Gets all assignments for a QP Reference Number
 * @param {string} qpRefNo - Question paper reference number
 * @returns {Array} Array of assignment objects
 */
function getAssignmentsByQP(qpRefNo) {
  return findRowsByColumn(SHEET_NAMES.ASSIGNMENTS, ASSIGNMENT_COLUMNS.QP_REF_NO, qpRefNo);
}

/**
 * Gets all assignments by status
 * @param {string} status - Status to filter by
 * @returns {Array} Array of assignment objects
 */
function getAssignmentsByStatus(status) {
  return findRowsByColumn(SHEET_NAMES.ASSIGNMENTS, ASSIGNMENT_COLUMNS.STATUS, status);
}

/**
 * Gets all assignments by board
 * @param {string} boardName - Board name
 * @returns {Array} Array of assignment objects
 */
function getAssignmentsByBoard(boardName) {
  return findRowsByColumn(SHEET_NAMES.ASSIGNMENTS, ASSIGNMENT_COLUMNS.BOARD_NAME, boardName);
}

/**
 * Gets all assignments
 * @returns {Array} Array of all assignment objects
 */
function getAllAssignments() {
  return getAllRowsAsObjects(SHEET_NAMES.ASSIGNMENTS);
}

// =============================================================================
// ASSIGNMENT STATUS UPDATES
// =============================================================================

/**
 * Marks an assignment as retrieved (faculty viewed password)
 * @param {string} assignmentId - Assignment ID
 * @returns {object} Result
 */
function markAssignmentRetrieved(assignmentId) {
  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    return createErrorResponse('Assignment not found.');
  }

  updateCell(SHEET_NAMES.ASSIGNMENTS, assignment._rowIndex, ASSIGNMENT_COLUMNS.STATUS, ASSIGNMENT_STATUS.RETRIEVED);
  updateCell(SHEET_NAMES.ASSIGNMENTS, assignment._rowIndex, ASSIGNMENT_COLUMNS.RETRIEVED_AT, getCurrentTimestamp());

  logInfo('markAssignmentRetrieved', `Assignment ${assignmentId} marked as retrieved`);

  return createSuccessResponse({
    assignmentId: assignmentId,
    status: ASSIGNMENT_STATUS.RETRIEVED,
    message: 'Assignment marked as retrieved.'
  });
}

/**
 * Marks an assignment as submitted (faculty submitted paper)
 * @param {string} assignmentId - Assignment ID
 * @returns {object} Result
 */
function markAssignmentSubmitted(assignmentId) {
  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    return createErrorResponse('Assignment not found.');
  }

  updateCell(SHEET_NAMES.ASSIGNMENTS, assignment._rowIndex, ASSIGNMENT_COLUMNS.STATUS, ASSIGNMENT_STATUS.SUBMITTED);
  updateCell(SHEET_NAMES.ASSIGNMENTS, assignment._rowIndex, ASSIGNMENT_COLUMNS.SUBMITTED_AT, getCurrentTimestamp());

  logInfo('markAssignmentSubmitted', `Assignment ${assignmentId} marked as submitted`);

  return createSuccessResponse({
    assignmentId: assignmentId,
    status: ASSIGNMENT_STATUS.SUBMITTED,
    message: 'Assignment marked as submitted.'
  });
}

/**
 * Marks an assignment as used (paper used in exam)
 * @param {string} assignmentId - Assignment ID
 * @returns {object} Result
 */
function markAssignmentUsed(assignmentId) {
  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    return createErrorResponse('Assignment not found.');
  }

  updateCell(SHEET_NAMES.ASSIGNMENTS, assignment._rowIndex, ASSIGNMENT_COLUMNS.STATUS, ASSIGNMENT_STATUS.USED);

  logInfo('markAssignmentUsed', `Assignment ${assignmentId} marked as used`);

  return createSuccessResponse({
    assignmentId: assignmentId,
    status: ASSIGNMENT_STATUS.USED,
    message: 'Assignment marked as used.'
  });
}

// =============================================================================
// PASSWORD ACCESS
// =============================================================================

/**
 * Gets password for an assignment (for faculty)
 * Logs the access and marks as retrieved
 * @param {string} assignmentId - Assignment ID
 * @param {object} facultyUser - Faculty user object
 * @returns {object} Result with password
 */
function getPasswordForFaculty(assignmentId, facultyUser) {
  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    return createErrorResponse('Assignment not found.');
  }

  // Verify this assignment belongs to the faculty
  if (assignment.Faculty_Regno !== facultyUser.Regno) {
    return createErrorResponse('This assignment does not belong to you.');
  }

  // Log access
  logPasswordAccess(assignment, facultyUser, 'Faculty retrieved password');

  // Mark as retrieved if pending
  if (assignment.Status === ASSIGNMENT_STATUS.PENDING) {
    markAssignmentRetrieved(assignmentId);
  }

  return createSuccessResponse({
    assignmentId: assignment.Assignment_ID,
    qpRefNo: assignment.QP_Ref_No,
    password: assignment.Password,
    subjectName: assignment.Subject_Name || '',
    boardName: assignment.Board_Name || '',
    status: assignment.Status
  });
}

/**
 * Gets password for COE (admin access)
 * Logs the access
 * @param {string} qpRefNo - Question paper reference number
 * @param {object} coeUser - COE user object
 * @returns {object} Result with assignment and password
 */
function getPasswordForCOE(qpRefNo, coeUser) {
  const assignments = getAssignmentsByQP(qpRefNo);

  if (!assignments || assignments.length === 0) {
    return createErrorResponse(`No assignment found for QP Reference: ${qpRefNo}`);
  }

  // Return all assignments for this QP (there might be multiple experts)
  const results = assignments.map(assignment => {
    // Log access
    logPasswordAccess(assignment, coeUser, 'COE accessed password');

    return {
      assignmentId: assignment.Assignment_ID,
      qpRefNo: assignment.QP_Ref_No,
      facultyName: assignment.Faculty_Name,
      facultyRegno: assignment.Faculty_Regno,
      password: assignment.Password,
      status: assignment.Status,
      subjectName: assignment.Subject_Name || '',
      boardName: assignment.Board_Name || ''
    };
  });

  return createSuccessResponse({
    qpRefNo: qpRefNo,
    assignments: results
  });
}

/**
 * Gets all passwords for a board (COE access)
 * @param {string} boardName - Board name
 * @param {object} coeUser - COE user object
 * @returns {object} Result with assignments
 */
function getBoardPasswords(boardName, coeUser) {
  const assignments = getAssignmentsByBoard(boardName);

  if (!assignments || assignments.length === 0) {
    return createErrorResponse(`No assignments found for board: ${boardName}`);
  }

  // Log access for each
  assignments.forEach(assignment => {
    logPasswordAccess(assignment, coeUser, `COE accessed board passwords - ${boardName}`);
  });

  const results = assignments.map(assignment => ({
    assignmentId: assignment.Assignment_ID,
    qpRefNo: assignment.QP_Ref_No,
    facultyName: assignment.Faculty_Name,
    facultyRegno: assignment.Faculty_Regno,
    password: assignment.Password,
    status: assignment.Status,
    subjectName: assignment.Subject_Name || ''
  }));

  return createSuccessResponse({
    boardName: boardName,
    total: results.length,
    assignments: results
  });
}

// =============================================================================
// ACCESS LOGGING
// =============================================================================

/**
 * Logs password access
 * @param {object} assignment - Assignment object
 * @param {object} user - User who accessed
 * @param {string} purpose - Purpose of access
 */
function logPasswordAccess(assignment, user, purpose) {
  const logId = generateLogId();
  const rowData = [
    logId,
    assignment.Assignment_ID,
    assignment.QP_Ref_No,
    user.Name,
    user.Regno,
    getCurrentTimestamp(),
    purpose,
    user.Role
  ];

  appendRow(SHEET_NAMES.PASSWORD_ACCESS_LOG, rowData);

  logInfo('logPasswordAccess', `Logged: ${user.Name} accessed ${assignment.QP_Ref_No}`);
}

/**
 * Gets recent access logs
 * @param {number} limit - Maximum number of logs to return
 * @returns {Array} Array of log objects
 */
function getRecentAccessLogs(limit) {
  limit = limit || 50;
  const logs = getAllRowsAsObjects(SHEET_NAMES.PASSWORD_ACCESS_LOG);

  // Sort by timestamp (newest first)
  logs.sort((a, b) => new Date(b.Requested_At) - new Date(a.Requested_At));

  return logs.slice(0, limit);
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Gets assignment statistics
 * @returns {object} Statistics object
 */
function getAssignmentStats() {
  const allAssignments = getAllAssignments();

  const stats = {
    total: allAssignments.length,
    pending: 0,
    retrieved: 0,
    submitted: 0,
    used: 0,
    byBoard: {}
  };

  allAssignments.forEach(a => {
    switch (a.Status) {
      case ASSIGNMENT_STATUS.PENDING: stats.pending++; break;
      case ASSIGNMENT_STATUS.RETRIEVED: stats.retrieved++; break;
      case ASSIGNMENT_STATUS.SUBMITTED: stats.submitted++; break;
      case ASSIGNMENT_STATUS.USED: stats.used++; break;
    }

    if (a.Board_Name) {
      if (!stats.byBoard[a.Board_Name]) {
        stats.byBoard[a.Board_Name] = 0;
      }
      stats.byBoard[a.Board_Name]++;
    }
  });

  return stats;
}
