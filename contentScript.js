/**
 * Multimodal Accessibility Assistant - Content Script
 * Handles DOM interaction and content extraction
 */

// Global state
let selectedContent = null;
let lastSelection = null;

/**
 * Initialize content script when DOM is ready
 */
function initializeContentScript() {
  console.log('AURA content script loaded');

  // Set up event listeners
  setupEventListeners();

  // Set up context menus (will be handled by background script)
  setupContextMenus();

  // Monitor selection changes
  monitorSelectionChanges();
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Listen for text selection changes
  document.addEventListener('selectionchange', handleSelectionChange);

  // Listen for image clicks (for future image selection)
  document.addEventListener('click', handleImageClick);

  // Listen for messages from popup and background script
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * Set up context menu integration
 */
function setupContextMenus() {
  // Context menus will be created by background script
  // This function is placeholder for future context menu handling
}

/**
 * Monitor selection changes and update state
 */
function monitorSelectionChanges() {
  // Check for existing selection on load
  setTimeout(() => {
    handleSelectionChange();
  }, 100);
}

/**
 * Handle text selection changes
 */
function handleSelectionChange() {
  try {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0) {
      // Store the selected text and its context
      selectedContent = {
        type: 'text',
        text: selectedText,
        range: selection.getRangeAt(0).cloneRange(),
        timestamp: Date.now(),
        url: window.location.href
      };

      lastSelection = selectedContent;

      // Notify background script about selection
      notifySelectionChange(selectedContent);

    } else if (lastSelection && Date.now() - lastSelection.timestamp < 5000) {
      // Keep last selection for a few seconds after deselection
      selectedContent = lastSelection;
    } else {
      // Clear selection
      selectedContent = null;
      lastSelection = null;
    }

  } catch (error) {
    console.error('Error handling selection change:', error);
  }
}

/**
 * Handle image clicks for future image selection
 */
function handleImageClick(event) {
  // This will be implemented in later tasks for image selection
  // For now, just log the event
  if (event.target.tagName === 'IMG') {
    console.log('Image clicked:', event.target.src);
  }
}

/**
 * Handle messages from popup and background script
 */
function handleMessage(message, sender, sendResponse) {
  console.log('Content script received message:', message);

  switch (message.type) {
    case 'GET_SELECTED_CONTENT':
      sendResponse({
        success: true,
        content: selectedContent
      });
      break;

    case 'EXTRACT_TEXT':
      const extractedText = extractSelectedText();
      sendResponse({
        success: true,
        text: extractedText
      });
      break;

    case 'EXTRACT_IMAGE':
      // Will be implemented in later tasks
      sendResponse({
        success: false,
        error: 'Image extraction not yet implemented'
      });
      break;

    case 'SHOW_OVERLAY':
      // Will be implemented in later tasks for inline overlays
      showInlineOverlay(message.data);
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({
        success: false,
        error: 'Unknown message type'
      });
  }

  return true; // Keep message channel open for async response
}

/**
 * Extract currently selected text with context
 */
function extractSelectedText() {
  try {
    const selection = window.getSelection();

    if (selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      return null;
    }

    // Get surrounding context for better AI processing
    const container = range.commonAncestorContainer;
    const containerText = container.textContent || '';

    // Find the position of selected text within container
    const startOffset = containerText.indexOf(selectedText);
    const contextBefore = containerText.substring(Math.max(0, startOffset - 100), startOffset);
    const contextAfter = containerText.substring(startOffset + selectedText.length, startOffset + selectedText.length + 100);

    return {
      text: selectedText,
      contextBefore: contextBefore,
      contextAfter: contextAfter,
      elementType: container.parentElement?.tagName?.toLowerCase() || 'unknown',
      url: window.location.href,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error extracting selected text:', error);
    return null;
  }
}

/**
 * Extract image data for AI processing (placeholder for future implementation)
 */
function extractImageData(imageElement) {
  try {
    // This will be implemented in task 7
    return {
      url: imageElement.src,
      alt: imageElement.alt || '',
      width: imageElement.naturalWidth,
      height: imageElement.naturalHeight,
      elementType: 'img',
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error extracting image data:', error);
    return null;
  }
}

/**
 * Show inline overlay with results (placeholder for future implementation)
 */
function showInlineOverlay(data) {
  // This will be implemented in later tasks
  console.log('Show inline overlay:', data);
}

/**
 * Notify background script about selection changes
 */
function notifySelectionChange(content) {
  try {
    chrome.runtime.sendMessage({
      type: 'CONTENT_SELECTED',
      data: content
    }).catch(error => {
      // Ignore errors if background script isn't ready
      console.debug('Could not notify background script:', error);
    });
  } catch (error) {
    console.debug('Could not send message to background script:', error);
  }
}

/**
 * Add context menu integration (placeholder)
 */
function addContextMenuIntegration() {
  // Context menus will be handled by background script
  // This is a placeholder for future context menu integration
}

/**
 * Utility function to check if element is visible
 */
function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Utility function to get element text content safely
 */
function getElementTextContent(element) {
  try {
    return element.textContent || element.innerText || '';
  } catch (error) {
    console.error('Error getting element text content:', error);
    return '';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}