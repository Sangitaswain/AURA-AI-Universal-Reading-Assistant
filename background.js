/**
 * Multimodal Accessibility Assistant - Background Service Worker
 * Coordinates communication between content script and popup
 */

// Global state
let modelStatus = {
  available: false,
  downloading: false,
  error: null
};

/**
 * Initialize background service worker
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AURA background script installed');
  
  // Set up context menus
  setupContextMenus();
  
  // Initialize model status checking
  initializeModelStatus();
  
  // Set up storage defaults
  initializeStorage();
});

/**
 * Set up context menus for right-click actions
 */
function setupContextMenus() {
  // Remove existing context menus
  chrome.contextMenus.removeAll(() => {
    // Create context menu for text selection
    chrome.contextMenus.create({
      id: 'summarize-text',
      title: 'Summarize with AURA',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    // Create context menu for images
    chrome.contextMenus.create({
      id: 'describe-image',
      title: 'Describe Image',
      contexts: ['image'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    // Create context menu for page-level actions
    chrome.contextMenus.create({
      id: 'open-assistant',
      title: 'Open AURA',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  try {
    switch (info.menuItemId) {
      case 'summarize-text':
        await handleSummarizeContext(info, tab);
        break;
        
      case 'describe-image':
        await handleDescribeImageContext(info, tab);
        break;
        
      case 'open-assistant':
        await handleOpenAssistant(tab);
        break;
        
      default:
        console.warn('Unknown context menu item:', info.menuItemId);
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
  }
});

/**
 * Handle message passing between components
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  switch (message.type) {
    case 'CONTENT_SELECTED':
      handleContentSelected(message.data, sender);
      break;
      
    case 'CHECK_MODEL_STATUS':
      sendResponse({
        success: true,
        status: modelStatus
      });
      break;
      
    case 'GET_STORAGE':
      handleGetStorage(message.data, sendResponse);
      break;
      
    case 'SET_STORAGE':
      handleSetStorage(message.data, sendResponse);
      break;
      
    case 'PROCESS_CONTENT':
      handleProcessContent(message.data, sendResponse);
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({
        success: false,
        error: 'Unknown message type'
      });
  }
  
  return true; // Keep message channel open for async responses
});

/**
 * Initialize AI model status checking
 */
async function initializeModelStatus() {
  try {
    // This will be expanded in later tasks when we implement AI integration
    modelStatus = {
      available: false,
      downloading: false,
      error: 'Model status checking will be implemented in task 4'
    };
    
    console.log('Model status initialized:', modelStatus);
    
  } catch (error) {
    console.error('Error initializing model status:', error);
    modelStatus = {
      available: false,
      downloading: false,
      error: error.message
    };
  }
}

/**
 * Initialize storage with default values
 */
async function initializeStorage() {
  try {
    const defaultSettings = {
      preferredLanguage: 'en',
      ttsVoice: 'default',
      summaryLength: 'short',
      autoSave: false,
      firstRun: true
    };
    
    // Check if settings already exist
    const result = await chrome.storage.local.get(['userSettings']);
    
    if (!result.userSettings) {
      // Set default settings
      await chrome.storage.local.set({
        userSettings: defaultSettings,
        savedContent: {}
      });
      
      console.log('Default settings initialized');
    }
    
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * Handle content selection from content script
 */
function handleContentSelected(content, sender) {
  console.log('Content selected:', content);
  
  // Store the selected content for popup access
  // This will be expanded in later tasks
}

/**
 * Handle summarize context menu action
 */
async function handleSummarizeContext(info, tab) {
  try {
    // Send message to content script to extract selected text
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_TEXT'
    });
    
    if (response && response.success) {
      // Open popup or process directly
      // This will be implemented in task 5
      console.log('Text extracted for summarization:', response.text);
    }
    
  } catch (error) {
    console.error('Error handling summarize context:', error);
  }
}

/**
 * Handle describe image context menu action
 */
async function handleDescribeImageContext(info, tab) {
  try {
    // Extract image information
    const imageInfo = {
      src: info.srcUrl,
      pageUrl: info.pageUrl,
      timestamp: Date.now()
    };
    
    // This will be implemented in task 7
    console.log('Image selected for description:', imageInfo);
    
  } catch (error) {
    console.error('Error handling describe image context:', error);
  }
}

/**
 * Handle open assistant context menu action
 */
async function handleOpenAssistant(tab) {
  try {
    // Open the extension popup
    // Since we can't programmatically open popup, we'll focus on the extension icon
    console.log('Opening accessibility assistant for tab:', tab.id);
    
  } catch (error) {
    console.error('Error opening assistant:', error);
  }
}

/**
 * Handle storage get requests
 */
async function handleGetStorage(keys, sendResponse) {
  try {
    const result = await chrome.storage.local.get(keys);
    sendResponse({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting storage:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle storage set requests
 */
async function handleSetStorage(data, sendResponse) {
  try {
    await chrome.storage.local.set(data);
    sendResponse({
      success: true
    });
  } catch (error) {
    console.error('Error setting storage:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle content processing requests (placeholder for AI integration)
 */
async function handleProcessContent(data, sendResponse) {
  try {
    // This will be implemented in tasks 5-8 for actual AI processing
    console.log('Content processing requested:', data);
    
    sendResponse({
      success: false,
      error: 'Content processing will be implemented in future tasks'
    });
    
  } catch (error) {
    console.error('Error processing content:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Manage AI model availability and status
 */
async function manageModelAvailability() {
  try {
    // This will be implemented in task 4
    console.log('Managing model availability...');
    
    return modelStatus;
    
  } catch (error) {
    console.error('Error managing model availability:', error);
    return {
      available: false,
      downloading: false,
      error: error.message
    };
  }
}

/**
 * Handle extension icon click (when popup is disabled)
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
  
  // The popup will handle this automatically
  // This listener is here as a fallback
});

/**
 * Handle tab updates to refresh content script if needed
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Tab finished loading
    console.log('Tab updated:', tabId, tab.url);
    
    // Refresh model status if needed
    if (!modelStatus.available && !modelStatus.downloading) {
      await initializeModelStatus();
    }
  }
});

/**
 * Utility function to check if URL is accessible
 */
function isAccessibleUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Utility function to generate unique IDs
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

console.log('AURA background service worker loaded');