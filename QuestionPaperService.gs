/**
 * QuestionPaperService.gs - Question Paper Operations
 * Handles question paper and password management
 */

// =============================================================================
// QUESTION PAPER RETRIEVAL FUNCTIONS
// =============================================================================

/**
 * Gets a question paper by reference number
 * @param {string} refNumber - Question paper reference number
 * @returns {object|null} Question paper object or null if not found
 */
function getQuestionPaperByRef(refNumber) {
  return findRowByColumn(SHEET_NAMES.QUESTION_PAPERS, QUESTION_PAPER_COLUMNS.QP_REFERENCE_NUMBER, refNumber);
}

/**
 * Gets all question papers
 * @returns {Array} Array of question paper objects
 */
function getAllQuestionPapers() {
  return getAllRowsAsObjects(SHEET_NAMES.QUESTION_PAPERS);
}

/**
 * Gets all active question papers
 * @returns {Array} Array of active question paper objects
 */
function getActiveQuestionPapers() {
  return findRowsByColumn(SHEET_NAMES.QUESTION_PAPERS, QUESTION_PAPER_COLUMNS.STATUS, QUESTION_PAPER_STATUS.ACTIVE);
}

/**
 * Gets all inactive question papers
 * @returns {Array} Array of inactive question paper objects
 */
function getInactiveQuestionPapers() {
  return findRowsByColumn(SHEET_NAMES.QUESTION_PAPERS, QUESTION_PAPER_COLUMNS.STATUS, QUESTION_PAPER_STATUS.INACTIVE);
}

// =============================================================================
// QUESTION PAPER VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if a question paper exists
 * @param {string} refNumber - Question paper reference number
 * @returns {boolean} True if exists
 */
function questionPaperExists(refNumber) {
  return getQuestionPaperByRef(refNumber) !== null;
}

/**
 * Checks if a question paper is active
 * @param {string} refNumber - Question paper reference number
 * @returns {boolean} True if active
 */
function isQuestionPaperActive(refNumber) {
  const qp = getQuestionPaperByRef(refNumber);
  return qp !== null && qp.Status === QUESTION_PAPER_STATUS.ACTIVE;
}

/**
 * Validates a question paper for password request
 * @param {string} refNumber - Question paper reference number
 * @returns {object} Validation result
 */
function validateQuestionPaperForRequest(refNumber) {
  if (!refNumber) {
    return createErrorResponse('Question paper reference number is required.');
  }

  const qp = getQuestionPaperByRef(refNumber);

  if (!qp) {
    return createErrorResponse(`Question paper '${refNumber}' not found.`);
  }

  if (qp.Status !== QUESTION_PAPER_STATUS.ACTIVE) {
    return createErrorResponse(`Question paper '${refNumber}' is not available for requests.`);
  }

  // Check if password exists
  const password = getPassword(refNumber);
  if (!password) {
    return createErrorResponse(`Password not configured for question paper '${refNumber}'.`);
  }

  return createSuccessResponse(qp);
}

// =============================================================================
// QUESTION PAPER MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Adds a new question paper
 * @param {object} qpData - Question paper data
 * @param {string} qpData.referenceNumber - Unique reference number
 * @param {string} qpData.subjectCode - Subject code
 * @param {string} qpData.subjectName - Subject name
 * @param {string} qpData.password - Password for the question paper
 * @returns {object} Result with success status
 */
function addQuestionPaper(qpData) {
  // Validate required fields
  if (!qpData.referenceNumber) {
    return createErrorResponse('Reference number is required.');
  }

  if (!qpData.subjectCode || !qpData.subjectName) {
    return createErrorResponse('Subject code and name are required.');
  }

  // Check if reference number already exists
  if (questionPaperExists(qpData.referenceNumber)) {
    return createErrorResponse(`Question paper '${qpData.referenceNumber}' already exists.`);
  }

  // Add question paper
  const qpRowData = [
    qpData.referenceNumber,
    qpData.subjectCode,
    qpData.subjectName,
    QUESTION_PAPER_STATUS.ACTIVE
  ];

  appendRow(SHEET_NAMES.QUESTION_PAPERS, qpRowData);

  // Add password if provided
  if (qpData.password) {
    setPassword(qpData.referenceNumber, qpData.password);
  }

  return createSuccessResponse({
    referenceNumber: qpData.referenceNumber,
    message: 'Question paper added successfully.'
  });
}

/**
 * Updates question paper status
 * @param {string} refNumber - Question paper reference number
 * @param {string} status - New status ('active' or 'inactive')
 * @returns {object} Result with success status
 */
function updateQuestionPaperStatus(refNumber, status) {
  if (status !== QUESTION_PAPER_STATUS.ACTIVE && status !== QUESTION_PAPER_STATUS.INACTIVE) {
    return createErrorResponse('Invalid status. Must be "active" or "inactive".');
  }

  const qp = getQuestionPaperByRef(refNumber);
  if (!qp) {
    return createErrorResponse('Question paper not found.');
  }

  updateCell(SHEET_NAMES.QUESTION_PAPERS, qp._rowIndex, QUESTION_PAPER_COLUMNS.STATUS, status);

  return createSuccessResponse({
    message: `Question paper status updated to ${status}.`
  });
}

// =============================================================================
// PASSWORD MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Gets the password for a question paper
 * @param {string} refNumber - Question paper reference number
 * @returns {string|null} Password or null if not found
 */
function getPassword(refNumber) {
  const passwordRow = findRowByColumn(SHEET_NAMES.PASSWORDS, PASSWORD_COLUMNS.QP_REFERENCE_NUMBER, refNumber);

  if (!passwordRow) {
    return null;
  }

  return passwordRow.Password;
}

/**
 * Sets or updates the password for a question paper
 * @param {string} refNumber - Question paper reference number
 * @param {string} password - Password to set
 * @returns {object} Result with success status
 */
function setPassword(refNumber, password) {
  if (!refNumber || !password) {
    return createErrorResponse('Reference number and password are required.');
  }

  const existingRow = findRowIndex(SHEET_NAMES.PASSWORDS, PASSWORD_COLUMNS.QP_REFERENCE_NUMBER, refNumber);

  if (existingRow) {
    // Update existing password
    updateCell(SHEET_NAMES.PASSWORDS, existingRow, PASSWORD_COLUMNS.PASSWORD, password);
    return createSuccessResponse({
      message: 'Password updated successfully.'
    });
  } else {
    // Add new password entry
    appendRow(SHEET_NAMES.PASSWORDS, [refNumber, password]);
    return createSuccessResponse({
      message: 'Password set successfully.'
    });
  }
}

/**
 * Deletes the password for a question paper
 * @param {string} refNumber - Question paper reference number
 * @returns {object} Result with success status
 */
function deletePassword(refNumber) {
  const rowIndex = findRowIndex(SHEET_NAMES.PASSWORDS, PASSWORD_COLUMNS.QP_REFERENCE_NUMBER, refNumber);

  if (!rowIndex) {
    return createErrorResponse('Password not found for this question paper.');
  }

  deleteRow(SHEET_NAMES.PASSWORDS, rowIndex);

  return createSuccessResponse({
    message: 'Password deleted successfully.'
  });
}

// =============================================================================
// SEARCH AND LISTING FUNCTIONS
// =============================================================================

/**
 * Searches question papers by subject code or name
 * @param {string} searchTerm - Search term
 * @returns {Array} Array of matching question papers
 */
function searchQuestionPapers(searchTerm) {
  const allQPs = getAllQuestionPapers();
  const term = searchTerm.toLowerCase();

  return allQPs.filter(qp => {
    return qp.SubjectCode.toLowerCase().includes(term) ||
           qp.SubjectName.toLowerCase().includes(term) ||
           qp.QPReferenceNumber.toLowerCase().includes(term);
  });
}

/**
 * Gets a formatted list of available question papers
 * @returns {string} Formatted string of question papers
 */
function getFormattedQuestionPaperList() {
  const activeQPs = getActiveQuestionPapers();

  if (activeQPs.length === 0) {
    return 'No question papers available.';
  }

  let list = '*Available Question Papers:*\n\n';

  activeQPs.forEach((qp, index) => {
    list += `${index + 1}. **${qp.QPReferenceNumber}** - ${qp.SubjectName} (${qp.SubjectCode})\n`;
  });

  return list;
}
