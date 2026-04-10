/**
 * CardBuilder.gs - Google Chat UI Card Builders
 * Builds interactive cards for Google Chat bot
 */

// =============================================================================
// FACULTY CARDS
// =============================================================================

/**
 * Builds a card showing faculty's assignments with passwords
 * @param {Array} assignments - Array of assignment objects
 * @param {object} faculty - Faculty user object
 * @returns {object} Card object
 */
function buildFacultyAssignmentsCard(assignments, faculty) {
  if (!assignments || assignments.length === 0) {
    return {
      "header": {
        "title": "📋 My Assignments",
        "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/assignment/v6/24px.svg"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": `Hi ${faculty.Name},\n\nYou have no paper assignments at the moment.`
          }
        }]
      }]
    };
  }

  const sections = [{
    "widgets": [{
      "textParagraph": {
        "text": `Hi **${faculty.Name}**,\n\nYou have **${assignments.length}** paper assignment(s). Click on a paper to view the password.`
      }
    }]
  }];

  // Group by status
  const pending = assignments.filter(a => a.Status === ASSIGNMENT_STATUS.PENDING);
  const retrieved = assignments.filter(a => a.Status === ASSIGNMENT_STATUS.RETRIEVED);
  const submitted = assignments.filter(a => a.Status === ASSIGNMENT_STATUS.SUBMITTED);

  if (pending.length > 0) {
    sections.push({
      "header": "⏳ Pending",
      "widgets": pending.map(a => ({
        "keyValue": {
          "topLabel": a.QP_Ref_No,
          "content": `${a.Subject_Name || 'N/A'}\nBoard: ${a.Board_Name || 'N/A'}`,
          "contentMultiline": true,
          "icon": "DESCRIPTION"
        }
      }))
    });
  }

  if (retrieved.length > 0) {
    sections.push({
      "header": "🔓 Retrieved",
      "widgets": retrieved.map(a => ({
        "keyValue": {
          "topLabel": a.QP_Ref_No,
          "content": `${a.Subject_Name || 'N/A'}\nPassword retrieved`,
          "contentMultiline": true,
          "icon": "DESCRIPTION"
        }
      }))
    });
  }

  if (submitted.length > 0) {
    sections.push({
      "header": "✅ Submitted",
      "widgets": submitted.map(a => ({
        "keyValue": {
          "topLabel": a.QP_Ref_No,
          "content": `${a.Subject_Name || 'N/A'}\nSubmitted`,
          "contentMultiline": true,
          "icon": "DONE"
        }
      }))
    });
  }

  return {
    "header": {
      "title": "📋 My Assignments",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/assignment/v6/24px.svg"
    },
    "sections": sections
  };
}

/**
 * Builds a card showing password for a specific assignment
 * @param {object} assignment - Assignment object with password
 * @returns {object} Card object
 */
function buildPasswordCard(assignment) {
  return {
    "header": {
      "title": "🔐 Password for " + assignment.qpRefNo,
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/lock/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": assignment.qpRefNo,
            "icon": "DESCRIPTION"
          }
        },
        {
          "keyValue": {
            "topLabel": "Subject",
            "content": assignment.subjectName || 'N/A',
            "icon": "BOOK"
          }
        },
        {
          "keyValue": {
            "topLabel": "Board",
            "content": assignment.boardName || 'N/A'
          }
        }
      ]
    }, {
      "widgets": [{
        "textParagraph": {
          "text": "**Your Password:**"
        }
      }, {
        "textParagraph": {
          "text": `\`\`\`\n${assignment.password}\n\`\`\``,
          "bold": true
        }
      }]
    }, {
      "widgets": [{
        "textParagraph": {
          "text": "⚠️ *Please encrypt your DOCX file with this password before submitting.*"
        }
      }]
    }]
  };
}

// =============================================================================
// COE CARDS
// =============================================================================

/**
 * Builds a card showing password for COE
 * @param {object} data - Password data with assignments
 * @returns {object} Card object
 */
function buildCOEPasswordCard(data) {
  const sections = [{
    "widgets": [{
      "textParagraph": {
        "text": `**QP Reference:** ${data.qpRefNo}\n\nFound **${data.assignments.length}** assignment(s) for this paper.`
      }
    }]
  }];

  data.assignments.forEach(a => {
    sections.push({
      "widgets": [
        {
          "keyValue": {
            "topLabel": a.facultyName,
            "content": `Reg: ${a.facultyRegno}\nSubject: ${a.subjectName || 'N/A'}`,
            "contentMultiline": true,
            "icon": "PERSON"
          }
        },
        {
          "keyValue": {
            "topLabel": "Password",
            "content": a.password,
            "icon": "KEY"
          }
        },
        {
          "keyValue": {
            "topLabel": "Status",
            "content": a.status.toUpperCase()
          }
        }
      ]
    });
  });

  return {
    "header": {
      "title": "🔐 Password Access",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/lock_open/v6/24px.svg"
    },
    "sections": sections
  };
}

/**
 * Builds a card showing all board passwords
 * @param {object} data - Board password data
 * @returns {object} Card object
 */
function buildBoardPasswordsCard(data) {
  const sections = [{
    "widgets": [{
      "textParagraph": {
        "text": `**Board:** ${data.boardName}\n\nTotal **${data.total}** assignment(s).`
      }
    }]
  }];

  data.assignments.forEach(a => {
    sections.push({
      "widgets": [
        {
          "keyValue": {
            "topLabel": a.qpRefNo,
            "content": `Faculty: ${a.facultyName}\nSubject: ${a.subjectName || 'N/A'}`,
            "contentMultiline": true,
            "icon": "DESCRIPTION"
          }
        },
        {
          "keyValue": {
            "topLabel": "Password",
            "content": a.password,
            "icon": "KEY"
          }
        },
        {
          "keyValue": {
            "topLabel": "Status",
            "content": a.status.toUpperCase()
          }
        }
      ]
    });
  });

  return {
    "header": {
      "title": "📋 Board Passwords",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/folder/v6/24px.svg"
    },
    "sections": sections
  };
}

// =============================================================================
// STATS CARDS
// =============================================================================

/**
 * Builds a statistics card
 * @param {object} stats - Statistics object
 * @returns {object} Card object
 */
function buildStatsCard(stats) {
  return {
    "header": {
      "title": "📊 Assignment Statistics",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/analytics/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Total Assignments",
            "content": stats.total.toString(),
            "icon": "DESCRIPTION"
          }
        },
        {
          "keyValue": {
            "topLabel": "Pending",
            "content": stats.pending.toString(),
            "icon": "CLOCK"
          }
        },
        {
          "keyValue": {
            "topLabel": "Retrieved",
            "content": stats.retrieved.toString(),
            "icon": "INBOX"
          }
        },
        {
          "keyValue": {
            "topLabel": "Submitted",
            "content": stats.submitted.toString(),
            "icon": "DONE"
          }
        },
        {
          "keyValue": {
            "topLabel": "Used",
            "content": stats.used.toString(),
            "icon": "CHECK_CIRCLE"
          }
        }
      ]
    }]
  };
}

// =============================================================================
// ACCESS LOG CARDS
// =============================================================================

/**
 * Builds a card showing recent access logs
 * @param {Array} logs - Array of log objects
 * @returns {object} Card object
 */
function buildAccessLogCard(logs) {
  if (!logs || logs.length === 0) {
    return {
      "header": {
        "title": "📜 Access Log",
        "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/history/v6/24px.svg"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": "No access logs found."
          }
        }]
      }]
    };
  }

  const sections = [{
    "widgets": [{
      "textParagraph": {
        "text": `Showing last **${logs.length}** access entries.`
      }
    }]
  }];

  logs.slice(0, 10).forEach(log => {
    sections.push({
      "widgets": [{
        "keyValue": {
          "topLabel": log.QP_Ref_No,
          "content": `By: ${log.Requested_By} (${log.Requester_Role})\nPurpose: ${log.Purpose}`,
          "contentMultiline": true,
          "icon": "PERSON"
        }
      }, {
        "keyValue": {
          "topLabel": "Time",
          "content": log.Requested_At,
          "icon": "CLOCK"
        }
      }]
    });
  });

  return {
    "header": {
      "title": "📜 Access Log",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/history/v6/24px.svg"
    },
    "sections": sections
  };
}

// =============================================================================
// HELP CARDS
// =============================================================================

/**
 * Builds a help card for faculty
 * @returns {object} Card object
 */
function buildFacultyHelpCard() {
  return {
    "header": {
      "title": "❓ Faculty Help",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/help/v6/24px.svg"
    },
    "sections": [{
      "header": "Available Commands",
      "widgets": [{
        "textParagraph": {
          "text": "• `/my-assignments` - View all your paper assignments\n" +
                  "• `/get-password <QP_REF>` - Get password for a specific paper\n" +
                  "• `/help` - Show this help message"
        }
      }]
    }, {
      "header": "How It Works",
      "widgets": [{
        "textParagraph": {
          "text": "1. When a paper is assigned to you, a unique password is generated.\n" +
                  "2. Use `/my-assignments` to see your papers.\n" +
                  "3. Use `/get-password QP-REF` to get the password.\n" +
                  "4. Encrypt your DOCX file with this password.\n" +
                  "5. Submit the encrypted file to EQPMS."
        }
      }]
    }]
  };
}

/**
 * Builds a help card for COE
 * @returns {object} Card object
 */
function buildCOEHelpCard() {
  return {
    "header": {
      "title": "❓ COE Help",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/help/v6/24px.svg"
    },
    "sections": [{
      "header": "Available Commands",
      "widgets": [{
        "textParagraph": {
          "text": "• `/password <QP_REF>` - Get password(s) for a paper\n" +
                  "• `/board-passwords <BOARD>` - Get all passwords for a board\n" +
                  "• `/pending` - Show pending assignments\n" +
                  "• `/stats` - View assignment statistics\n" +
                  "• `/access-log` - View recent password access log\n" +
                  "• `/help` - Show this help message"
        }
      }]
    }]
  };
}

// =============================================================================
// ERROR CARDS
// =============================================================================

/**
 * Builds an error card
 * @param {string} message - Error message
 * @returns {object} Card object
 */
function buildErrorCard(message) {
  return {
    "header": {
      "title": "❌ Error",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/error/v6/24px.svg"
    },
    "sections": [{
      "widgets": [{
        "textParagraph": {
          "text": message
        }
      }]
    }]
  };
}

/**
 * Builds a success card
 * @param {string} title - Card title
 * @param {string} message - Success message
 * @returns {object} Card object
 */
function buildSuccessCard(title, message) {
  return {
    "header": {
      "title": "✅ " + title,
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/check_circle/v6/24px.svg"
    },
    "sections": [{
      "widgets": [{
        "textParagraph": {
          "text": message
        }
      }]
    }]
  };
}

// =============================================================================
// WELCOME CARD
// =============================================================================

/**
 * Builds a welcome card
 * @param {object} user - User object
 * @returns {object} Card object
 */
function buildWelcomeCard(user) {
  const roleCommands = user.Role === USER_ROLES.FACULTY
    ? "• `/my-assignments` - View your assignments\n• `/get-password <QP_REF>` - Get password"
    : "• `/password <QP_REF>` - Get password for paper\n• `/board-passwords <BOARD>` - Get board passwords\n• `/stats` - View statistics";

  return {
    "header": {
      "title": "👋 Welcome to Password Bot",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/lock/v6/24px.svg"
    },
    "sections": [{
      "widgets": [{
        "textParagraph": {
          "text": `Hello **${user.Name}**!\n\nYou are registered as **${user.Role.toUpperCase()}**.`
        }
      }]
    }, {
      "header": "Quick Commands",
      "widgets": [{
        "textParagraph": {
          "text": roleCommands + "\n• `/help` - Show all commands"
        }
      }]
    }]
  };
}
