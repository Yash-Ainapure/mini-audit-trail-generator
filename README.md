# Mini Audit Trail Generator

A micro web application that automatically generates a change-history audit trail every time text content is modified. This full-stack application tracks additions, removals, and changes to text content with timestamps and unique identifiers.

## Features

- **Content Editor**: A text area where users can enter and modify content
- **Save Version**: Button to save the current version and generate change history
- **Version History**: Panel displaying all saved versions with detailed change information
- **Change Detection**: Automatically detects added and removed words between versions
- **Timestamps**: Each version includes a timestamp of when it was saved
- **UUID**: Each version has a unique identifier

## Tech Stack

- **Frontend**: React (Vite) with JavaScript
- **Backend**: Node.js with Express
- **Storage**: JSON file-based storage (no database required)

## Project Structure

```
mini-audit-trail-generator/
├── backend/
│   ├── index.js          # Express server with API endpoints
│   ├── data/
│   │   └── versions.json # JSON file storage for versions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── App.css       # Component styles
│   │   ├── main.jsx      # React entry point
│   │   └── index.css     # Global styles
│   ├── index.html
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

### Running Both (Quick Start)

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend && npm install && npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm install && npm run dev
```

## API Endpoints

### POST /save-version

Saves a new version with change detection.

**Request Body:**
```json
{
  "text": "Your new content here"
}
```

**Response:**
```json
{
  "message": "Version saved successfully",
  "changed": true,
  "version": {
    "id": "uuid",
    "timestamp": "2025-11-26 13:40",
    "addedWords": ["new", "words"],
    "removedWords": ["old", "words"],
    "oldLength": 43,
    "newLength": 51
  }
}
```

### GET /versions

Returns all saved versions and current text.

**Response:**
```json
{
  "versions": [...],
  "currentText": "Current text content"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Version Entry Format

Each version entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique UUID for the version |
| `timestamp` | string | When the version was saved (YYYY-MM-DD HH:MM) |
| `addedWords` | string[] | Words added in this version |
| `removedWords` | string[] | Words removed in this version |
| `oldLength` | number | Character count of previous version |
| `newLength` | number | Character count of new version |

## How It Works

1. User enters text in the Content Editor
2. User clicks "Save Version" button
3. Backend receives the new text
4. Backend compares with the previous version
5. Backend detects added and removed words
6. Backend generates a version entry with:
   - Unique UUID
   - Timestamp
   - Added words list
   - Removed words list
   - Old and new text lengths
7. Version is saved to JSON file
8. Frontend displays the new version in the Version History panel
