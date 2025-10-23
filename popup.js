/**
 * Multimodal Accessibility Assistant - Popup Script
 * Main user interface and AI processing hub
 */

// DOM Elements
let elements = {};

// State Management
let currentContent = null;
let currentResults = null;
let isProcessing = false;

/**
 * Initialize the popup when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('AURA popup loaded');
  
  // Cache DOM elements
  cacheElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize the interface
  await initializeInterface();
});

/**
 * Cache frequently used DOM elements
 */
function cacheElements() {
  elements = {
    // Status elements
    statusText: document.getElementById('status-text'),
    statusIcon: document.getElementById('status-icon'),
    
    // Content elements
    contentDisplay: document.getElementById('content-display'),
    
    // Action buttons
    summarizeBtn: document.getElementById('summarize-btn'),
    simplifyBtn: document.getElementById('simplify-btn'),
    describeBtn: document.getElementById('describe-btn'),
    translateBtn: document.getElementById('translate-btn'),
    
    // Results elements
    resultsSection: document.getElementById('results-section'),
    resultsContent: document.getElementById('results-content'),
    
    // Audio controls
    audioControls: document.getElementById('audio-controls'),
    playAudioBtn: document.getElementById('play-audio-btn'),
    stopAudioBtn: document.getElementById('stop-audio-btn'),
    
    // Save controls
    saveBtn: document.getElementById('save-btn'),
    
    // Loading and error elements
    loadingIndicator: document.getElementById('loading-indicator'),
    errorDisplay: document.getElementById('error-display'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    
    // Footer buttons
    settingsBtn: document.getElementById('settings-btn'),
    helpBtn: document.getElementById('help-btn')
  };
}

/**
 * Set up event listeners for all interactive elements
 */
function setupEventListeners() {
  // Action buttons
  elements.summarizeBtn.addEventListener('click', handleSummarize);
  elements.simplifyBtn.addEventListener('click', handleSimplify);
  elements.describeBtn.addEventListener('click', handleDescribe);
  elements.translateBtn.addEventListener('click', handleTranslate);
  
  // Audio controls
  elements.playAudioBtn.addEventListener('click', handlePlayAudio);
  elements.stopAudioBtn.addEventListener('click', handleStopAudio);
  
  // Save controls
  elements.saveBtn.addEventListener('click', handleSave);
  
  // Error handling
  elements.retryBtn.addEventListener('click', handleRetry);
  
  // Footer buttons
  elements.settingsBtn.addEventListener('click', handleSettings);
  elements.helpBtn.addEventListener('click', handleHelp);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Initialize the popup interface
 */
async function initializeInterface() {
  try {
    // Check AI model availability
    await checkModelAvailability();
    
    // Get current tab and check for selected content
    await checkSelectedContent();
    
    // Update UI state
    updateUIState();
    
  } catch (error) {
    console.error('Failed to initialize interface:', error);
    showError('Failed to initialize extension. Please try again.');
  }
}

/**
 * Check Chrome Built-in AI model availability
 */
async function checkModelAvailability() {
  try {
    elements.statusText.textContent = 'Checking AI model...';
    elements.statusIcon.className = 'status-icon';
    
    // Check if AI APIs are available
    if (!window.ai) {
      throw new Error('Chrome Built-in AI not available');
    }
    
    // Check language model availability (for image descriptions)
    const languageModelAvailability = await window.ai.languageModel?.availability();
    
    // Check summarizer availability
    const summarizerAvailability = await window.ai.summarizer?.availability();
    
    // Update status based on availability
    if (languageModelAvailability === 'readily' && summarizerAvailability === 'readily') {
      elements.statusText.textContent = 'AI model ready';
      elements.statusIcon.className = 'status-icon ready';
    } else if (languageModelAvailability === 'after-download' || summarizerAvailability === 'after-download') {
      elements.statusText.textContent = 'AI model needs download';
      elements.statusIcon.className = 'status-icon';
      // TODO: Implement model download UI in later tasks
    } else {
      throw new Error('AI model not available on this device');
    }
    
  } catch (error) {
    console.error('Model availability check failed:', error);
    elements.statusText.textContent = 'AI model unavailable';
    elements.statusIcon.className = 'status-icon error';
    
    // Show user-friendly error message
    showError('Chrome Built-in AI is not available. Please ensure you have Chrome 138+ with AI features enabled.');
  }
}

/**
 * Check for selected content in the current tab
 */
async function checkSelectedContent() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Send message to content script to get selected content
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'GET_SELECTED_CONTENT' 
    });
    
    if (response && response.content) {
      currentContent = response.content;
      displaySelectedContent(currentContent);
      enableActionButtons(currentContent.type);
    } else {
      // No content selected
      displayNoContent();
      disableActionButtons();
    }
    
  } catch (error) {
    console.error('Failed to check selected content:', error);
    // This is expected if content script isn't injected yet
    displayNoContent();
    disableActionButtons();
  }
}

/**
 * Display selected content in the popup
 */
function displaySelectedContent(content) {
  const { type, text, imageUrl, alt } = content;
  
  if (type === 'text') {
    elements.contentDisplay.innerHTML = `
      <div class="selected-text">
        <strong>Selected Text:</strong>
        <p>${escapeHtml(text.substring(0, 200))}${text.length > 200 ? '...' : ''}</p>
      </div>
    `;
  } else if (type === 'image') {
    elements.contentDisplay.innerHTML = `
      <div class="selected-image">
        <strong>Selected Image:</strong>
        <img src="${imageUrl}" alt="${escapeHtml(alt || 'Selected image')}" style="max-width: 100%; height: auto; margin-top: 8px; border-radius: 4px;">
        ${alt ? `<p><em>Current alt text: ${escapeHtml(alt)}</em></p>` : '<p><em>No alt text available</em></p>'}
      </div>
    `;
  }
}

/**
 * Display no content message
 */
function displayNoContent() {
  elements.contentDisplay.innerHTML = `
    <p class="no-content">No content selected. Highlight text or right-click an image on any webpage.</p>
  `;
}

/**
 * Enable action buttons based on content type
 */
function enableActionButtons(contentType) {
  // Reset all buttons
  disableActionButtons();
  
  if (contentType === 'text') {
    elements.summarizeBtn.disabled = false;
    elements.simplifyBtn.disabled = false;
    elements.translateBtn.disabled = false;
  } else if (contentType === 'image') {
    elements.describeBtn.disabled = false;
    elements.translateBtn.disabled = false; // Can translate descriptions
  }
}

/**
 * Disable all action buttons
 */
function disableActionButtons() {
  elements.summarizeBtn.disabled = true;
  elements.simplifyBtn.disabled = true;
  elements.describeBtn.disabled = true;
  elements.translateBtn.disabled = true;
}

/**
 * Update overall UI state
 */
function updateUIState() {
  // Hide results section if no results
  if (!currentResults) {
    elements.resultsSection.classList.add('hidden');
  }
  
  // Hide loading indicator
  elements.loadingIndicator.classList.add('hidden');
  
  // Hide error display
  elements.errorDisplay.classList.add('hidden');
}

/**
 * Show loading state
 */
function showLoading(message = 'Processing with AI...') {
  isProcessing = true;
  elements.loadingIndicator.classList.remove('hidden');
  document.getElementById('loading-text').textContent = message;
  elements.errorDisplay.classList.add('hidden');
  
  // Disable action buttons during processing
  disableActionButtons();
}

/**
 * Hide loading state
 */
function hideLoading() {
  isProcessing = false;
  elements.loadingIndicator.classList.add('hidden');
  
  // Re-enable appropriate action buttons
  if (currentContent) {
    enableActionButtons(currentContent.type);
  }
}

/**
 * Show error message
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorDisplay.classList.remove('hidden');
  hideLoading();
}

/**
 * Hide error message
 */
function hideError() {
  elements.errorDisplay.classList.add('hidden');
}

/**
 * Display results in the results section
 */
function displayResults(results) {
  currentResults = results;
  
  // Show results section
  elements.resultsSection.classList.remove('hidden');
  
  // Display the results content
  elements.resultsContent.innerHTML = formatResults(results);
  
  // Show audio controls if results contain text
  if (results.content) {
    elements.audioControls.classList.remove('hidden');
  }
  
  // Scroll results into view
  elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Format results for display
 */
function formatResults(results) {
  const { type, content, language } = results;
  
  let html = '';
  
  switch (type) {
    case 'summary':
      html = `
        <div class="result-summary">
          <h4>Summary</h4>
          <div class="summary-content">${escapeHtml(content)}</div>
        </div>
      `;
      break;
      
    case 'simplification':
      html = `
        <div class="result-simplification">
          <h4>Simplified Text</h4>
          <div class="simplified-content">${escapeHtml(content)}</div>
        </div>
      `;
      break;
      
    case 'description':
      html = `
        <div class="result-description">
          <h4>Image Description</h4>
          <div class="description-content">${escapeHtml(content)}</div>
        </div>
      `;
      break;
      
    case 'translation':
      html = `
        <div class="result-translation">
          <h4>Translation${language ? ` (${language})` : ''}</h4>
          <div class="translation-content">${escapeHtml(content)}</div>
        </div>
      `;
      break;
      
    default:
      html = `<div class="result-generic">${escapeHtml(content)}</div>`;
  }
  
  return html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event Handlers (placeholder implementations for now)

async function handleSummarize() {
  console.log('Summarize clicked - will implement in task 5');
  showError('Summarization feature will be implemented in the next task.');
}

async function handleSimplify() {
  console.log('Simplify clicked - will implement in task 6');
  showError('Text simplification feature will be implemented in a future task.');
}

async function handleDescribe() {
  console.log('Describe clicked - will implement in task 7');
  showError('Image description feature will be implemented in a future task.');
}

async function handleTranslate() {
  console.log('Translate clicked - will implement in task 8');
  showError('Translation feature will be implemented in a future task.');
}

async function handlePlayAudio() {
  console.log('Play audio clicked - will implement in task 9');
  showError('Audio playback feature will be implemented in a future task.');
}

async function handleStopAudio() {
  console.log('Stop audio clicked - will implement in task 9');
}

async function handleSave() {
  console.log('Save clicked - will implement in task 10');
  showError('Save feature will be implemented in a future task.');
}

async function handleRetry() {
  console.log('Retry clicked');
  hideError();
  await initializeInterface();
}

async function handleSettings() {
  console.log('Settings clicked - will implement in future task');
  showError('Settings feature will be implemented in a future task.');
}

async function handleHelp() {
  console.log('Help clicked - will implement in future task');
  showError('Help feature will be implemented in a future task.');
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+A to focus on first action button
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();
    const firstEnabledButton = document.querySelector('.action-btn:not(:disabled)');
    if (firstEnabledButton) {
      firstEnabledButton.focus();
    }
  }
  
  // Escape to close error messages
  if (event.key === 'Escape') {
    hideError();
  }
}