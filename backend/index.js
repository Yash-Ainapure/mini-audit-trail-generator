/**
 * Mini Audit Trail Generator - Backend Server
 * 
 * This server provides REST API endpoints for managing text version history
 * with automatic change detection (added/removed words).
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Data file path for storing versions
const DATA_FILE = path.join(__dirname, 'data', 'versions.json');

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Ensures the data directory and file exist
 */
function ensureDataFile() {
  const dataDir = path.dirname(DATA_FILE);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ versions: [], currentText: '' }));
  }
}

/**
 * Reads data from the JSON file
 * @returns {Object} The parsed JSON data
 */
function readData() {
  ensureDataFile();
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(rawData);
}

/**
 * Writes data to the JSON file
 * @param {Object} data - The data to write
 */
function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Extracts words from text (handles punctuation and whitespace)
 * @param {string} text - The input text
 * @returns {string[]} Array of words
 */
function extractWords(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  // Split by whitespace and filter out empty strings
  // Also normalize by converting to lowercase for comparison
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Finds words that are in newWords but not in oldWords
 * @param {string[]} oldWords - Previous version words
 * @param {string[]} newWords - New version words
 * @returns {string[]} Array of added words
 */
function findAddedWords(oldWords, newWords) {
  const oldWordSet = new Set(oldWords);
  const addedWords = [];
  
  // Track word counts for duplicate handling
  const oldWordCount = {};
  const newWordCount = {};
  
  oldWords.forEach(word => {
    oldWordCount[word] = (oldWordCount[word] || 0) + 1;
  });
  
  newWords.forEach(word => {
    newWordCount[word] = (newWordCount[word] || 0) + 1;
  });
  
  // Find words that appear more times in new text or are completely new
  const processedWords = new Set();
  
  newWords.forEach(word => {
    if (!processedWords.has(word)) {
      const oldCount = oldWordCount[word] || 0;
      const newCount = newWordCount[word] || 0;
      
      if (newCount > oldCount) {
        // Add the word once for each additional occurrence
        for (let i = 0; i < newCount - oldCount; i++) {
          addedWords.push(word);
        }
      }
      processedWords.add(word);
    }
  });
  
  return addedWords;
}

/**
 * Finds words that are in oldWords but not in newWords
 * @param {string[]} oldWords - Previous version words
 * @param {string[]} newWords - New version words
 * @returns {string[]} Array of removed words
 */
function findRemovedWords(oldWords, newWords) {
  const removedWords = [];
  
  // Track word counts for duplicate handling
  const oldWordCount = {};
  const newWordCount = {};
  
  oldWords.forEach(word => {
    oldWordCount[word] = (oldWordCount[word] || 0) + 1;
  });
  
  newWords.forEach(word => {
    newWordCount[word] = (newWordCount[word] || 0) + 1;
  });
  
  // Find words that appear more times in old text or are completely removed
  const processedWords = new Set();
  
  oldWords.forEach(word => {
    if (!processedWords.has(word)) {
      const oldCount = oldWordCount[word] || 0;
      const newCount = newWordCount[word] || 0;
      
      if (oldCount > newCount) {
        // Add the word once for each removed occurrence
        for (let i = 0; i < oldCount - newCount; i++) {
          removedWords.push(word);
        }
      }
      processedWords.add(word);
    }
  });
  
  return removedWords;
}

/**
 * Generates a version summary object
 * @param {string} oldText - Previous text content
 * @param {string} newText - New text content
 * @returns {Object} Version entry object
 */
function generateVersionEntry(oldText, newText) {
  const oldWords = extractWords(oldText);
  const newWords = extractWords(newText);
  
  const addedWords = findAddedWords(oldWords, newWords);
  const removedWords = findRemovedWords(oldWords, newWords);
  
  // Generate timestamp in format: YYYY-MM-DD HH:MM
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');
  
  return {
    id: uuidv4(),
    timestamp: timestamp,
    addedWords: addedWords,
    removedWords: removedWords,
    oldLength: oldText.length,
    newLength: newText.length
  };
}

/**
 * POST /save-version
 * Saves a new version with change detection
 */
app.post('/save-version', (req, res) => {
  try {
    const { text } = req.body;
    
    if (text === undefined || text === null) {
      return res.status(400).json({ 
        error: 'Text content is required' 
      });
    }
    
    const data = readData();
    const oldText = data.currentText || '';
    
    // Check if there are actual changes
    if (text === oldText) {
      return res.status(200).json({ 
        message: 'No changes detected',
        changed: false 
      });
    }
    
    // Generate version entry with diff
    const versionEntry = generateVersionEntry(oldText, text);
    
    // Update data
    data.versions.unshift(versionEntry); // Add to beginning for newest first
    data.currentText = text;
    
    // Save to file
    writeData(data);
    
    res.status(201).json({
      message: 'Version saved successfully',
      changed: true,
      version: versionEntry
    });
  } catch (error) {
    console.error('Error saving version:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /versions
 * Returns all saved versions
 */
app.get('/versions', (req, res) => {
  try {
    const data = readData();
    res.json({
      versions: data.versions,
      currentText: data.currentText
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  ensureDataFile();
});

module.exports = app;
