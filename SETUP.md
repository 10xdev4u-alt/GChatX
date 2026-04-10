# Setup Guide

## Step 1: Create Google Sheets

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet named "Password Request System"
3. Create 4 sheets (tabs) with exact names:
   - `Users`
   - `QuestionPapers`
   - `Passwords`
   - `PasswordRequests`

## Step 2: Configure Sheet Headers

### Users Sheet
Row 1 headers: `UserID | Name | Email | Role | Status`

### QuestionPapers Sheet
Row 1 headers: `QPReferenceNumber | SubjectCode | SubjectName | Status`

### Passwords Sheet
Row 1 headers: `QPReferenceNumber | Password`

### PasswordRequests Sheet
Row 1 headers: `RequestID | UserID | QPReferenceNumber | RequestTimestamp | Status | AdminID | ApprovalTimestamp`

## Step 3: Get Spreadsheet ID

From the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
Copy the ID part.

## Step 4: Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "Password Request Bot"

## Step 5: Copy Code Files

Copy each `.gs` file from this repository into your Apps Script project.

## Step 6: Update Configuration

In `Utils.gs`, update:
- `SPREADSHEET_ID` with your spreadsheet ID
- `ADMIN_SPACE_WEBHOOK_URL` (optional, for room notifications)

## Step 7: Deploy as Chat Bot

1. Click "Deploy" > "New deployment"
2. Click the gear icon and select "Google Chat"
3. Enter bot name and description
4. Click "Deploy"

## Step 8: Run Initial Setup

Execute `setupInitialAdmin()` from the Apps Script editor to create your first admin user.

## Step 9: Add Test Data

Add a question paper to test:
- QPReferenceNumber: `QP-001`
- SubjectCode: `CS101`
- SubjectName: `Computer Science 101`
- Status: `active`

Add password:
- QPReferenceNumber: `QP-001`
- Password: `testpass123`

## Step 10: Test

In Google Chat, message your bot:
- `/help` - Should show help
- `/list` - Should show QP-001
- `/request QP-001` - Should submit request
