# Google Chat Password Request & Approval System

A Google Chat bot integrated with Google Sheets for managing password requests and approvals for question papers.

## Features

- **User Commands**: Request passwords, check status, view history
- **Admin Commands**: Approve/reject requests, view pending requests
- **Notifications**: Admins notified via DM and dedicated room
- **Card UI**: Rich interactive cards for better UX

## Setup Instructions

### 1. Create Google Sheets

Create a new Google Spreadsheet with 4 sheets:

#### Users Sheet
| UserID | Name | Email | Role | Status |
|--------|------|-------|------|--------|

#### QuestionPapers Sheet
| QPReferenceNumber | SubjectCode | SubjectName | Status |
|-------------------|-------------|-------------|--------|

#### Passwords Sheet
| QPReferenceNumber | Password |
|-------------------|----------|

#### PasswordRequests Sheet
| RequestID | UserID | QPReferenceNumber | RequestTimestamp | Status | AdminID | ApprovalTimestamp |
|-----------|--------|-------------------|------------------|--------|---------|-------------------|

### 2. Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create new project
3. Copy all `.gs` files into the project
4. Copy `appsscript.json` content

### 3. Configure

Update in `Utils.gs`:
- `SPREADSHEET_ID` - Your Google Sheets ID
- `ADMIN_SPACE_WEBHOOK_URL` - Admin room webhook URL

### 4. Deploy as Chat Bot

1. Click Deploy > New deployment
2. Select "Google Chat" as type
3. Configure bot details
4. Deploy

### 5. Run Setup

Execute `setupInitialAdmin()` once to create first admin.

## Commands

### User Commands
- `/request <QP_REF>` - Request password
- `/status [REQUEST_ID]` - Check status
- `/list` - List question papers
- `/history` - View request history
- `/help` - Show help

### Admin Commands
- `/pending` - View pending requests
- `/view <REQUEST_ID>` - View request details
- `/approve <REQUEST_ID>` - Approve request
- `/reject <REQUEST_ID> [REASON]` - Reject request

## License

MIT
