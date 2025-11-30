import { useState, useEffect } from 'react'
import './App.css'

// API base URL - configurable for production
const API_BASE_URL = 'https://mini-audit-trail-generator-fuja.onrender.com';

/**
 * Main Application Component
 * Mini Audit Trail Generator - tracks text changes with version history
 */
function App() {
  // State for the current text in the editor
  const [text, setText] = useState('');
  
  // State for version history
  const [versions, setVersions] = useState([]);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  
  // State for status messages
  const [statusMessage, setStatusMessage] = useState('');

  /**
   * Fetches the current text and version history from the backend
   */
  useEffect(() => {
    fetchVersions();
  }, []);

  /**
   * Fetches version history from the backend
   */
  const fetchVersions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/versions`);
      const data = await response.json();
      setVersions(data.versions || []);
      setText(data.currentText || '');
    } catch (error) {
      console.error('Error fetching versions:', error);
      setStatusMessage('Error loading data. Make sure the backend is running.');
    }
  };

  /**
   * Saves a new version when the user clicks the Save Version button
   */
  const handleSaveVersion = async () => {
    setIsLoading(true);
    setStatusMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/save-version`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.changed) {
        setStatusMessage('Version saved successfully!');
        // Refresh version history
        await fetchVersions();
      } else {
        setStatusMessage('No changes detected.');
      }
    } catch (error) {
      console.error('Error saving version:', error);
      setStatusMessage('Error saving version. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles text changes in the editor
   */
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Mini Audit Trail Generator</h1>
        <p className="subtitle">Track every change to your content with detailed version history</p>
      </header>

      <main className="main-content">
        {/* Content Editor Section */}
        <section className="editor-section">
          <h2>Content Editor</h2>
          <textarea
            className="content-editor"
            value={text}
            onChange={handleTextChange}
            placeholder="Start typing your content here..."
            rows={10}
          />
          
          <div className="editor-actions">
            <button 
              className="save-button"
              onClick={handleSaveVersion}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Version'}
            </button>
            
            {statusMessage && (
              <span className={`status-message ${statusMessage.includes('Error') ? 'error' : 'success'}`}>
                {statusMessage}
              </span>
            )}
          </div>
          
          <div className="text-stats">
            <span>Characters: {text.length}</span>
            <span>Words: {text.trim() ? text.trim().split(/\s+/).length : 0}</span>
          </div>
        </section>

        {/* Version History Section */}
        <section className="history-section">
          <h2>Version History</h2>
          
          {versions.length === 0 ? (
            <div className="no-versions">
              <p>No versions saved yet.</p>
              <p>Start editing and click "Save Version" to create your first version.</p>
            </div>
          ) : (
            <div className="version-list">
              {versions.map((version, index) => (
                <div key={version.id} className="version-item">
                  <div className="version-header">
                    <span className="version-number">Version #{versions.length - index}</span>
                    <span className="version-timestamp">{version.timestamp}</span>
                  </div>
                  
                  <div className="version-details">
                    <div className="version-stats">
                      <span className="stat">
                        Length: {version.oldLength} → {version.newLength} 
                        <span className={version.newLength > version.oldLength ? 'positive' : 'negative'}>
                          ({version.newLength > version.oldLength ? '+' : ''}{version.newLength - version.oldLength})
                        </span>
                      </span>
                    </div>
                    
                    {version.addedWords.length > 0 && (
                      <div className="words-change added">
                        <span className="change-label">+ Added:</span>
                        <span className="words-list">
                          {version.addedWords.map((word, i) => (
                            <span key={i} className="word-tag added-tag">{word}</span>
                          ))}
                        </span>
                      </div>
                    )}
                    
                    {version.removedWords.length > 0 && (
                      <div className="words-change removed">
                        <span className="change-label">- Removed:</span>
                        <span className="words-list">
                          {version.removedWords.map((word, i) => (
                            <span key={i} className="word-tag removed-tag">{word}</span>
                          ))}
                        </span>
                      </div>
                    )}
                    
                    {version.addedWords.length === 0 && version.removedWords.length === 0 && (
                      <div className="no-word-changes">
                        <span>Only whitespace or formatting changes</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="version-id">
                    <span>ID: {version.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>Mini Audit Trail Generator © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
