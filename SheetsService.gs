/**
 * SheetsService.gs - Google Sheets CRUD Operations
 * Provides low-level database operations for all sheets
 */

// =============================================================================
// SHEET ACCESS FUNCTIONS
// =============================================================================

/**
 * Gets a sheet by name from the configured spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} The Google Sheet object
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found`);
  }

  return sheet;
}

/**
 * Gets the spreadsheet object
 * @returns {Spreadsheet} The Google Spreadsheet object
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * Gets all data from a sheet as a 2D array
 * @param {string} sheetName - Name of the sheet
 * @returns {Array} 2D array of all data
 */
function getAllRows(sheetName) {
  const sheet = getSheet(sheetName);
  const range = sheet.getDataRange();
  return range.getValues();
}

/**
 * Gets all data as an array of objects with header keys
 * @param {string} sheetName - Name of the sheet
 * @returns {Array} Array of objects with header keys
 */
function getAllRowsAsObjects(sheetName) {
  const data = getAllRows(sheetName);
  if (data.length === 0) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Finds a row by a column value
 * @param {string} sheetName - Name of the sheet
 * @param {number} columnIndex - 1-based column index to search
 * @param {*} value - Value to search for
 * @returns {object|null} Row data as object or null if not found
 */
function findRowByColumn(sheetName, columnIndex, value) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length === 0) return null;

  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][columnIndex - 1] === value) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = data[i][index];
      });
      obj._rowIndex = i + 1; // 1-based row number
      return obj;
    }
  }

  return null;
}

/**
 * Finds all rows matching a column value
 * @param {string} sheetName - Name of the sheet
 * @param {number} columnIndex - 1-based column index to search
 * @param {*} value - Value to search for
 * @returns {Array} Array of matching row objects
 */
function findRowsByColumn(sheetName, columnIndex, value) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length === 0) return [];

  const headers = data[0];
  const results = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][columnIndex - 1] === value) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = data[i][index];
      });
      obj._rowIndex = i + 1;
      results.push(obj);
    }
  }

  return results;
}

/**
 * Gets a row by its row number
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowNumber - 1-based row number
 * @returns {object|null} Row data as object
 */
function getRowByNumber(sheetName, rowNumber) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length === 0 || rowNumber > data.length) return null;

  const headers = data[0];
  const rowData = data[rowNumber - 1];

  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = rowData[index];
  });
  obj._rowIndex = rowNumber;

  return obj;
}

// =============================================================================
// WRITE OPERATIONS
// =============================================================================

/**
 * Appends a new row to a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} rowData - Array of values to append
 * @returns {number} The row number of the new row
 */
function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(rowData);
  return sheet.getLastRow();
}

/**
 * Updates a row by row number
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowNumber - 1-based row number
 * @param {Array} rowData - Array of new values
 * @returns {boolean} Success status
 */
function updateRow(sheetName, rowNumber, rowData) {
  const sheet = getSheet(sheetName);
  const columnCount = rowData.length;
  const range = sheet.getRange(rowNumber, 1, 1, columnCount);
  range.setValues([rowData]);
  return true;
}

/**
 * Updates a specific cell
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowNumber - 1-based row number
 * @param {number} columnIndex - 1-based column index
 * @param {*} value - New value
 * @returns {boolean} Success status
 */
function updateCell(sheetName, rowNumber, columnIndex, value) {
  const sheet = getSheet(sheetName);
  const range = sheet.getRange(rowNumber, columnIndex);
  range.setValue(value);
  return true;
}

/**
 * Deletes a row by row number
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowNumber - 1-based row number
 * @returns {boolean} Success status
 */
function deleteRow(sheetName, rowNumber) {
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowNumber);
  return true;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets the total number of data rows (excluding header)
 * @param {string} sheetName - Name of the sheet
 * @returns {number} Number of data rows
 */
function getRowCount(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  return lastRow > 0 ? lastRow - 1 : 0; // Exclude header row
}

/**
 * Checks if a sheet is empty (no data rows)
 * @param {string} sheetName - Name of the sheet
 * @returns {boolean} True if empty
 */
function isSheetEmpty(sheetName) {
  return getRowCount(sheetName) === 0;
}

/**
 * Clears all data rows (keeps header)
 * @param {string} sheetName - Name of the sheet
 * @returns {boolean} Success status
 */
function clearSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  return true;
}

/**
 * Gets the headers of a sheet
 * @param {string} sheetName - Name of the sheet
 * @returns {Array} Array of header strings
 */
function getHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  return range.getValues()[0];
}

/**
 * Finds the row index by column value (returns 1-based row number)
 * @param {string} sheetName - Name of the sheet
 * @param {number} columnIndex - 1-based column index
 * @param {*} value - Value to search for
 * @returns {number|null} Row number or null if not found
 */
function findRowIndex(sheetName, columnIndex, value) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][columnIndex - 1] === value) {
      return i + 1; // 1-based row number
    }
  }

  return null;
}
