# EQPMS Password Management Bot

A Google Chat bot integrated with Google Sheets for managing question paper passwords in the EQPMS (Examination Question Paper Management System).

## Problem Solved

- Faculty submit DOCX files with wrong/missing passwords
- COE cannot unlock papers safely
- No password tracking per assignment
- Multiple assignments per faculty

## Solution

When a paper is assigned to faculty:
1. **Auto-generate** a unique password
2. **Store** password in Google Sheets
3. Faculty **authenticate** via Google Chat
4. Faculty **encrypts** DOCX with received password
5. COE can **retrieve** password when needed

## Architecture

```
┌─────────────┐     API Call      ┌─────────────┐
│   EQPMS     │ ───────────────> │  Google     │
│  (FastAPI)  │                   │  Apps Script│
└─────────────┘                   └─────────────┘
      │                                  │
      │                                  ▼
      │                           ┌─────────────┐
      │                           │   Google    │
      │                           │   Sheets    │
      │                           └─────────────┘
      │                                  │
      ▼                                  ▼
┌─────────────┐                   ┌─────────────┐
│   Faculty   │ <── Chat Bot ───  │    COE      │
│   Portal    │                   │   Portal    │
└─────────────┘                   └─────────────┘
```

## Google Sheets Structure

### Assignments Sheet
| Column | Description |
|--------|-------------|
| Assignment_ID | Unique ID (ASN-XXX) |
| QP_Ref_No | Question paper reference |
| Faculty_Regno | Faculty registration number |
| Faculty_Name | Faculty name |
| Faculty_Email | Faculty email |
| Password | Auto-generated password |
| Generated_At | Creation timestamp |
| Status | pending/retrieved/submitted/used |
| Retrieved_At | When password was viewed |
| Board_Name | Board name |
| Subject_Name | Subject name |

### Users Sheet
| Column | Description |
|--------|-------------|
| User_ID | Unique ID |
| Name | User name |
| Email | User email |
| Regno | Registration number |
| Role | faculty/coe/hob/admin |
| Board | Assigned board |
| Status | active/inactive |

### Password_Access_Log Sheet
| Column | Description |
|--------|-------------|
| Log_ID | Unique log ID |
| Assignment_ID | Related assignment |
| QP_Ref_No | Paper reference |
| Requested_By | Who accessed |
| Requested_At | Access timestamp |
| Purpose | Access reason |

## API Endpoints

### For EQPMS Integration

```bash
# Create single assignment
POST /exec?action=create
Content-Type: application/json

{
  "qpRefNo": "QP-CS101-2024",
  "facultyRegno": "FAC001",
  "facultyName": "Dr. John Doe",
  "facultyEmail": "john@college.edu",
  "boardName": "CSE",
  "subjectName": "Data Structures"
}

# Response
{
  "success": true,
  "data": {
    "assignmentId": "ASN-ABC123",
    "password": "Xk9#mP2$vL7@",
    "status": "pending"
  }
}
```

```bash
# Bulk assignment creation
POST /exec?action=bulk
Content-Type: application/json

{
  "assignments": [
    { "qpRefNo": "QP-CS101", "facultyRegno": "FAC001", ... },
    { "qpRefNo": "QP-CS102", "facultyRegno": "FAC002", ... }
  ]
}
```

```bash
# Get password (COE access)
GET /exec?action=password&qpRefNo=QP-CS101&regno=COE001
```

## Google Chat Commands

### Faculty Commands
| Command | Description |
|---------|-------------|
| `/my-assignments` | View all your paper assignments |
| `/get-password <QP_REF>` | Get password for specific paper |
| `/help` | Show help message |

### COE/Admin Commands
| Command | Description |
|---------|-------------|
| `/password <QP_REF>` | Get password for a paper |
| `/board-passwords <BOARD>` | Get all passwords for board |
| `/pending` | Show pending assignments |
| `/stats` | View assignment statistics |
| `/access-log` | View recent password access |
| `/help` | Show help message |

## Setup Instructions

### 1. Create Google Sheets

Create a spreadsheet with 3 sheets:
- `Assignments`
- `Users`
- `Password_Access_Log`

### 2. Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create new project
3. Copy all `.gs` files
4. Update `SPREADSHEET_ID` in `Utils.gs`

### 3. Deploy

#### As Chat Bot:
1. Deploy > New deployment
2. Select "Google Chat"
3. Configure bot details
4. Deploy

#### As Web App (for EQPMS):
1. Deploy > New deployment
2. Select "Web app"
3. Execute as: User deploying
4. Who has access: Anyone
5. Deploy
6. Copy the URL for EQPMS to call

### 4. Initialize

Run `initializeSystem()` once to set up sheets.

### 5. Configure EQPMS

In your EQPMS backend, add API calls:

```python
# When assigning paper to faculty
import requests

WEBAPP_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

def assign_paper_to_faculty(qp_ref, faculty):
    response = requests.post(
        f"{WEBAPP_URL}?action=create",
        json={
            "qpRefNo": qp_ref,
            "facultyRegno": faculty.regno,
            "facultyName": faculty.name,
            "facultyEmail": faculty.email,
            "boardName": faculty.board,
            "subjectName": qp_ref.subject
        }
    )
    return response.json()
```

## File Structure

```
GChatX/
├── Code.gs              # Main bot logic
├── ApiEndpoint.gs       # Web app endpoints
├── AssignmentService.gs # Assignment management
├── UserService.gs       # User management
├── SheetsService.gs     # Database operations
├── CardBuilder.gs       # UI cards
├── Utils.gs             # Helpers & constants
├── appsscript.json      # Project manifest
└── README.md            # This file
```

## Security Features

- Auto-generated 16-character passwords
- Password access logging
- Role-based access control
- Faculty can only see their own passwords
- COE can access all passwords

## Testing

Run these functions from Apps Script editor:
- `testApi()` - Test API endpoints
- `createTestData()` - Create sample data
- `initializeSystem()` - Initialize sheets

## License

MIT
