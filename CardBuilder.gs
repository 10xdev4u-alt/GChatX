/**
 * CardBuilder.gs - Google Chat UI Card Builders
 * Builds interactive cards for Google Chat bot
 */

// =============================================================================
// REQUEST CARDS
// =============================================================================

/**
 * Builds a card for submitting password requests
 * @param {string} qpRef - Question paper reference number (optional)
 * @param {string} message - Message to display (optional)
 * @returns {object} Card object
 */
function buildRequestCard(qpRef, message) {
  const sections = [];

  // Header section
  const header = {
    "title": "🔐 Request Question Paper Password",
    "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/lock/v6/24px.svg"
  };

  // Message section if provided
  if (message) {
    sections.push({
      "widgets": [{
        "textParagraph": {
          "text": message
        }
      }]
    });
  }

  // Input section
  sections.push({
    "widgets": [{
      "textInput": {
        "label": "Question Paper Reference Number",
        "type": "SINGLE_LINE",
        "name": "qpReference",
        "value": qpRef || "",
        "hintText": "Enter the QP reference number (e.g., QP-001)"
      }
    }]
  });

  // Submit button section
  sections.push({
    "widgets": [{
      "buttons": [{
        "textButton": {
          "text": "SUBMIT REQUEST",
          "onClick": {
            "action": {
              "actionMethodName": "submitRequest",
              "parameters": []
            }
          }
        }
      }]
    }]
  });

  return {
    "header": header,
    "sections": sections
  };
}

/**
 * Builds a card showing request submission confirmation
 * @param {object} requestDetails - Request details
 * @returns {object} Card object
 */
function buildRequestSubmittedCard(requestDetails) {
  return {
    "header": {
      "title": "✅ Request Submitted",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/check_circle/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Request ID",
            "content": requestDetails.requestId
          }
        },
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${requestDetails.qpRefNumber}\n${requestDetails.qpName}`,
            "contentMultiline": true
          }
        },
        {
          "keyValue": {
            "topLabel": "Status",
            "content": "Pending Approval",
            "icon": "CLOCK"
          }
        }
      ]
    }, {
      "widgets": [{
        "textParagraph": {
          "text": "Your request has been submitted and is awaiting admin approval. You will be notified once approved."
        }
      }]
    }]
  };
}

// =============================================================================
// PENDING REQUESTS CARDS
// =============================================================================

/**
 * Builds a card showing all pending requests (batch view)
 * @param {Array} requests - Array of pending request objects
 * @returns {object} Card object
 */
function buildPendingRequestsCard(requests) {
  if (!requests || requests.length === 0) {
    return {
      "header": {
        "title": "📋 Pending Requests",
        "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/inbox/v6/24px.svg"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": "No pending requests at this time."
          }
        }]
      }]
    };
  }

  const sections = [{
    "widgets": [{
      "textParagraph": {
        "text": `*${requests.length} pending request(s)*`
      }
    }]
  }];

  // Add each request as a section
  requests.forEach((req, index) => {
    sections.push({
      "widgets": [
        {
          "keyValue": {
            "topLabel": `Request ${index + 1}: ${req.requestId}`,
            "content": `**User:** ${req.userName}\n**QP:** ${req.qpRefNumber} - ${req.qpName}\n**Time:** ${req.requestTimestamp}`,
            "contentMultiline": true,
            "icon": "PERSON"
          }
        },
        {
          "buttons": [
            {
              "textButton": {
                "text": "APPROVE",
                "onClick": {
                  "action": {
                    "actionMethodName": "approveRequest",
                    "parameters": [
                      { "key": "requestId", "value": req.requestId }
                    ]
                  }
                }
              }
            },
            {
              "textButton": {
                "text": "REJECT",
                "onClick": {
                  "action": {
                    "actionMethodName": "rejectRequest",
                    "parameters": [
                      { "key": "requestId", "value": req.requestId }
                    ]
                  }
                }
              }
            },
            {
              "textButton": {
                "text": "VIEW",
                "onClick": {
                  "action": {
                    "actionMethodName": "viewRequest",
                    "parameters": [
                      { "key": "requestId", "value": req.requestId }
                    ]
                  }
                }
              }
            }
          ]
        }
      ]
    });
  });

  return {
    "header": {
      "title": "📋 Pending Requests",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/inbox/v6/24px.svg"
    },
    "sections": sections
  };
}

/**
 * Builds a card showing single request details (individual view)
 * @param {object} request - Request object with full details
 * @returns {object} Card object
 */
function buildRequestDetailCard(request) {
  return {
    "header": {
      "title": `📝 Request: ${request.requestId}`,
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/description/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Requester",
            "content": `${request.userName}\n${request.userEmail}`,
            "contentMultiline": true,
            "icon": "PERSON"
          }
        },
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${request.qpRefNumber}\n${request.qpName}`,
            "contentMultiline": true,
            "icon": "BOOK"
          }
        },
        {
          "keyValue": {
            "topLabel": "Requested At",
            "content": request.requestTimestamp,
            "icon": "CLOCK"
          }
        },
        {
          "keyValue": {
            "topLabel": "Status",
            "content": request.status.toUpperCase(),
            "icon": request.status === 'pending' ? 'CLOCK' :
                    request.status === 'approved' ? 'CHECK_CIRCLE' : 'CANCEL'
          }
        }
      ]
    }, {
      "widgets": [{
        "textParagraph": {
          "text": "*Actions*"
        }
      }, {
        "buttons": [
          {
            "textButton": {
              "text": "✅ APPROVE",
              "onClick": {
                "action": {
                  "actionMethodName": "approveRequest",
                  "parameters": [
                    { "key": "requestId", "value": request.requestId }
                  ]
                }
              }
            }
          },
          {
            "textButton": {
              "text": "❌ REJECT",
              "onClick": {
                "action": {
                  "actionMethodName": "rejectRequest",
                  "parameters": [
                    { "key": "requestId", "value": request.requestId }
                  ]
                }
              }
            }
          }
        ]
      }]
    }]
  };
}

// =============================================================================
// STATUS CARDS
// =============================================================================

/**
 * Builds a card showing request status
 * @param {object} request - Request status details
 * @returns {object} Card object
 */
function buildStatusCard(request) {
  const statusIcon = request.status === 'approved' ? '✅' :
                     request.status === 'rejected' ? '❌' : '⏳';

  const sections = [{
    "widgets": [
      {
        "keyValue": {
          "topLabel": "Request ID",
          "content": request.requestId
        }
      },
      {
        "keyValue": {
          "topLabel": "Question Paper",
          "content": `${request.qpRefNumber}\n${request.qpName}`,
          "contentMultiline": true,
          "icon": "BOOK"
        }
      },
      {
        "keyValue": {
          "topLabel": "Status",
          "content": `${statusIcon} ${request.status.toUpperCase()}`,
          "icon": request.status === 'approved' ? 'CHECK_CIRCLE' :
                  request.status === 'rejected' ? 'CANCEL' : 'CLOCK'
        }
      },
      {
        "keyValue": {
          "topLabel": "Requested At",
          "content": request.requestTimestamp,
          "icon": "CLOCK"
        }
      }
    ]
  }];

  // Add approval info if available
  if (request.status === 'approved' && request.adminName) {
    sections[0].widgets.push({
      "keyValue": {
        "topLabel": "Approved By",
        "content": request.adminName,
        "icon": "PERSON"
      }
    });
    if (request.approvalTimestamp) {
      sections[0].widgets.push({
        "keyValue": {
          "topLabel": "Approved At",
          "content": request.approvalTimestamp
        }
      });
    }
  }

  // Add rejection info if available
  if (request.status === 'rejected' && request.adminName) {
    sections[0].widgets.push({
      "keyValue": {
        "topLabel": "Rejected By",
        "content": request.adminName,
        "icon": "PERSON"
      }
    });
  }

  return {
    "header": {
      "title": "📊 Request Status",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/info/v6/24px.svg"
    },
    "sections": sections
  };
}

// =============================================================================
// QUESTION PAPER LIST CARDS
// =============================================================================

/**
 * Builds a card listing available question papers
 * @param {Array} questionPapers - Array of question paper objects
 * @returns {object} Card object
 */
function buildQuestionPapersListCard(questionPapers) {
  if (!questionPapers || questionPapers.length === 0) {
    return {
      "header": {
        "title": "📚 Question Papers",
        "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/book/v6/24px.svg"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": "No question papers available."
          }
        }]
      }]
    };
  }

  const widgets = questionPapers.map((qp, index) => ({
    "keyValue": {
      "topLabel": `${index + 1}. ${qp.QPReferenceNumber}`,
      "content": `${qp.SubjectName}\n(${qp.SubjectCode})`,
      "contentMultiline": true,
      "icon": "BOOK"
    }
  }));

  return {
    "header": {
      "title": "📚 Available Question Papers",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/book/v6/24px.svg"
    },
    "sections": [{
      "widgets": [{
        "textParagraph": {
          "text": `*${questionPapers.length} question paper(s) available*\n\nUse \`/request <QP_REF>\` to request a password.`
        }
      }]
    }, {
      "widgets": widgets
    }]
  };
}

// =============================================================================
// HELP AND ERROR CARDS
// =============================================================================

/**
 * Builds a help card with available commands
 * @returns {object} Card object
 */
function buildHelpCard() {
  return {
    "header": {
      "title": "❓ Help - Password Request Bot",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/help/v6/24px.svg"
    },
    "sections": [{
      "header": "User Commands",
      "widgets": [{
        "textParagraph": {
          "text": "• `/request <QP_REF>` - Request password for a question paper\n" +
                  "• `/status [REQUEST_ID]` - Check request status\n" +
                  "• `/list` - List available question papers\n" +
                  "• `/history` - View your request history\n" +
                  "• `/help` - Show this help message"
        }
      }]
    }, {
      "header": "Admin Commands",
      "widgets": [{
        "textParagraph": {
          "text": "• `/pending` - View all pending requests\n" +
                  "• `/view <REQUEST_ID>` - View single request details\n" +
                  "• `/approve <REQUEST_ID>` - Approve a request\n" +
                  "• `/reject <REQUEST_ID> [REASON]` - Reject a request"
        }
      }]
    }]
  };
}

/**
 * Builds an error card
 * @param {string} errorMessage - Error message to display
 * @returns {object} Card object
 */
function buildErrorCard(errorMessage) {
  return {
    "header": {
      "title": "❌ Error",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/error/v6/24px.svg"
    },
    "sections": [{
      "widgets": [{
        "textParagraph": {
          "text": errorMessage
        }
      }, {
        "buttons": [{
          "textButton": {
            "text": "GET HELP",
            "onClick": {
              "action": {
                "actionMethodName": "showHelp",
                "parameters": []
              }
            }
          }
        }]
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
      "title": `✅ ${title}`,
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
// APPROVAL/REJECTION RESULT CARDS
// =============================================================================

/**
 * Builds a card showing approval result with password
 * @param {object} details - Approval details including password
 * @returns {object} Card object
 */
function buildApprovalResultCard(details) {
  return {
    "header": {
      "title": "✅ Request Approved",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/check_circle/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Request ID",
            "content": details.requestId
          }
        },
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${details.qpRefNumber}\n${details.qpName}`,
            "contentMultiline": true,
            "icon": "BOOK"
          }
        },
        {
          "keyValue": {
            "topLabel": "Password",
            "content": details.password,
            "icon": "KEY"
          }
        }
      ]
    }, {
      "widgets": [{
        "textParagraph": {
          "text": `Password has been sent to ${details.userName} (${details.userEmail})`
        }
      }]
    }]
  };
}

/**
 * Builds a card showing rejection result
 * @param {object} details - Rejection details
 * @returns {object} Card object
 */
function buildRejectionResultCard(details) {
  return {
    "header": {
      "title": "❌ Request Rejected",
      "imageUrl": "https://fonts.gstatic.com/s/i/googlematerialicons/cancel/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Request ID",
            "content": details.requestId
          }
        },
        {
          "keyValue": {
            "topLabel": "Question Paper",
            "content": `${details.qpRefNumber}\n${details.qpName}`,
            "contentMultiline": true,
            "icon": "BOOK"
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
    }, {
      "widgets": [{
        "textParagraph": {
          "text": `User ${details.userName} has been notified of the rejection.`
        }
      }]
    }]
  };
}
