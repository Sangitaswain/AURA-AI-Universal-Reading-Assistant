/**
 * AURA - AI Universal Reading Assistant - Content Script
 * Handles DOM interaction and content extraction
 */

// Global state
let selectedContent = null;
let lastSelection = null;
let selectedImage = null;
let isInitialized = false;

// Configuration
const CONFIG = {
  SELECTION_TIMEOUT: 5000, // Keep selection for 5 seconds after deselection
  MIN_TEXT_LENGTH: 3,      // Minimum text length to consider
  MAX_TEXT_LENGTH: 10000,  // Maximum text length to process
  IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  CONTEXT_LENGTH: 100      // Characters of context before/after selection
};

/**
 * Initialize content script when DOM is ready
 */
function initializeContentScript() {
  if (isInitialized) return;

  console.log('AURA content script loaded on:', window.location.href);

  try {
    // Set up event listeners
    setupEventListeners();

    // Set up image interaction
    setupImageInteraction();

    // Monitor selection changes
    monitorSelectionChanges();

    // Initialize selection state
    initializeSelectionState();

    isInitialized = true;
    console.log('AURA content script initialized successfully');

  } catch (error) {
    console.error('Error initializing AURA content script:', error);
  }
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Listen for text selection changes
  document.addEventListener('selectionchange', handleSelectionChange);

  // Listen for image interactions
  document.addEventListener('click', handleImageClick);
  document.addEventListener('contextmenu', handleContextMenu);

  // Listen for keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);

  // Listen for messages from popup and background script
  chrome.runtime.onMessage.addListener(handleMessage);

  // Listen for page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Set up image interaction handlers
 */
function setupImageInteraction() {
  // Add hover effects for images (subtle indication they're interactive)
  const style = document.createElement('style');
  style.textContent = `
    .aura-image-hover {
      outline: 2px solid rgba(102, 126, 234, 0.3) !important;
      outline-offset: 2px !important;
      cursor: help !important;
    }
  `;
  document.head.appendChild(style);

  // Add hover listeners to all images
  addImageHoverListeners();

  // Monitor for dynamically added images
  observeImageChanges();
}

/**
 * Add hover listeners to images
 */
function addImageHoverListeners() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('data-aura-processed')) {
      img.addEventListener('mouseenter', () => {
        if (isValidImage(img)) {
          img.classList.add('aura-image-hover');
        }
      });

      img.addEventListener('mouseleave', () => {
        img.classList.remove('aura-image-hover');
      });

      img.setAttribute('data-aura-processed', 'true');
    }
  });
}

/**
 * Monitor for dynamically added images
 */
function observeImageChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            addImageHoverListeners();
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll('img');
            if (images.length > 0) {
              addImageHoverListeners();
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Monitor selection changes and update state
 */
function monitorSelectionChanges() {
  // Check for existing selection on load
  setTimeout(() => {
    handleSelectionChange();
  }, 100);

  // Periodic cleanup of old selections
  setInterval(() => {
    if (lastSelection && Date.now() - lastSelection.timestamp > CONFIG.SELECTION_TIMEOUT) {
      if (selectedContent === lastSelection) {
        selectedContent = null;
      }
      lastSelection = null;
    }
  }, 1000);
}

/**
 * Initialize selection state
 */
function initializeSelectionState() {
  // Check if there's already selected text when script loads
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    handleSelectionChange();
  }
}

/**
 * Handle text selection changes
 */
function handleSelectionChange() {
  try {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length >= CONFIG.MIN_TEXT_LENGTH) {
      // Validate text length
      if (selectedText.length > CONFIG.MAX_TEXT_LENGTH) {
        console.warn('Selected text too long, truncating to', CONFIG.MAX_TEXT_LENGTH, 'characters');
      }

      const processedText = selectedText.substring(0, CONFIG.MAX_TEXT_LENGTH);

      // Extract detailed selection information
      const selectionData = extractDetailedSelection(selection, processedText);

      selectedContent = {
        type: 'text',
        text: processedText,
        ...selectionData,
        timestamp: Date.now(),
        url: window.location.href
      };

      lastSelection = selectedContent;

      // Notify background script about selection
      notifySelectionChange(selectedContent);

      console.log('Text selected:', processedText.substring(0, 50) + '...');

    } else if (lastSelection && Date.now() - lastSelection.timestamp < CONFIG.SELECTION_TIMEOUT) {
      // Keep last selection for a few seconds after deselection
      selectedContent = lastSelection;
    } else {
      // Clear selection
      if (selectedContent && selectedContent.type === 'text') {
        selectedContent = null;
      }
      lastSelection = null;
    }

  } catch (error) {
    console.error('Error handling selection change:', error);
  }
}

/**
 * Extract detailed selection information
 */
function extractDetailedSelection(selection, selectedText) {
  try {
    if (selection.rangeCount === 0) {
      return {};
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Get surrounding context
    const context = extractContext(container, selectedText);

    // Get element information
    const elementInfo = getElementInfo(container);

    // Get position information
    const positionInfo = getPositionInfo(range);

    return {
      ...context,
      ...elementInfo,
      ...positionInfo,
      range: range.cloneRange()
    };

  } catch (error) {
    console.error('Error extracting detailed selection:', error);
    return {};
  }
}

/**
 * Extract context around selected text
 */
function extractContext(container, selectedText) {
  try {
    const containerText = getElementTextContent(container);
    const startIndex = containerText.indexOf(selectedText);

    if (startIndex === -1) {
      return { contextBefore: '', contextAfter: '' };
    }

    const contextBefore = containerText.substring(
      Math.max(0, startIndex - CONFIG.CONTEXT_LENGTH),
      startIndex
    );

    const contextAfter = containerText.substring(
      startIndex + selectedText.length,
      startIndex + selectedText.length + CONFIG.CONTEXT_LENGTH
    );

    return {
      contextBefore: contextBefore.trim(),
      contextAfter: contextAfter.trim(),
      fullContext: containerText
    };

  } catch (error) {
    console.error('Error extracting context:', error);
    return { contextBefore: '', contextAfter: '' };
  }
}

/**
 * Get element information
 */
function getElementInfo(container) {
  try {
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

    return {
      elementType: element?.tagName?.toLowerCase() || 'unknown',
      elementClass: element?.className || '',
      elementId: element?.id || '',
      isVisible: element ? isElementVisible(element) : false
    };

  } catch (error) {
    console.error('Error getting element info:', error);
    return { elementType: 'unknown' };
  }
}

/**
 * Get position information
 */
function getPositionInfo(range) {
  try {
    const rect = range.getBoundingClientRect();

    return {
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

  } catch (error) {
    console.error('Error getting position info:', error);
    return {};
  }
}

/**
 * Handle image clicks
 */
function handleImageClick(event) {
  if (event.target.tagName === 'IMG' && isValidImage(event.target)) {
    // Don't interfere with normal image interactions unless specifically requested
    console.log('Image clicked:', event.target.src);

    // Store image selection (will be used when context menu is triggered)
    selectedImage = {
      element: event.target,
      timestamp: Date.now()
    };
  }
}

/**
 * Handle context menu events
 */
function handleContextMenu(event) {
  if (event.target.tagName === 'IMG' && isValidImage(event.target)) {
    // Store image data for context menu action
    const imageData = extractImageData(event.target);

    selectedContent = {
      type: 'image',
      ...imageData,
      timestamp: Date.now(),
      url: window.location.href
    };

    // Notify background script about image selection
    notifySelectionChange(selectedContent);

    console.log('Image right-clicked for description:', event.target.src);
  }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+A to trigger AURA on current selection
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();

    if (selectedContent) {
      // Notify background script to open popup
      chrome.runtime.sendMessage({
        type: 'OPEN_POPUP_WITH_CONTENT',
        data: selectedContent
      }).catch(error => {
        console.debug('Could not send keyboard shortcut message:', error);
      });
    }
  }
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
  if (document.hidden) {
    // Page is hidden, clear temporary selections
    if (selectedContent && selectedContent.type === 'image') {
      selectedContent = null;
    }
  }
}

/**
 * Handle messages from popup and background script
 */
function handleMessage(message, sender, sendResponse) {
  console.log('Content script received message:', message);

  try {
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
        const extractedImage = extractSelectedImage(message.data);
        sendResponse({
          success: true,
          image: extractedImage
        });
        break;

      case 'SHOW_OVERLAY':
        showInlineOverlay(message.data);
        sendResponse({ success: true });
        break;

      case 'CLEAR_SELECTION':
        clearSelection();
        sendResponse({ success: true });
        break;

      case 'PING':
        sendResponse({ success: true, status: 'ready' });
        break;

      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({
          success: false,
          error: 'Unknown message type'
        });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true; // Keep message channel open for async response
}

/**
 * Extract currently selected text with full context
 */
function extractSelectedText() {
  try {
    const selection = window.getSelection();

    if (selection.rangeCount === 0) {
      return null;
    }

    const selectedText = selection.toString().trim();

    if (!selectedText || selectedText.length < CONFIG.MIN_TEXT_LENGTH) {
      return null;
    }

    // Use existing detailed extraction
    const selectionData = extractDetailedSelection(selection, selectedText);

    return {
      text: selectedText.substring(0, CONFIG.MAX_TEXT_LENGTH),
      ...selectionData,
      url: window.location.href,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error extracting selected text:', error);
    return null;
  }
}

/**
 * Extract image data for AI processing
 */
function extractImageData(imageElement) {
  try {
    if (!isValidImage(imageElement)) {
      throw new Error('Invalid image element');
    }

    const imageData = {
      url: imageElement.src,
      alt: imageElement.alt || '',
      title: imageElement.title || '',
      width: imageElement.naturalWidth || imageElement.width,
      height: imageElement.naturalHeight || imageElement.height,
      displayWidth: imageElement.width,
      displayHeight: imageElement.height,
      elementType: 'img',
      className: imageElement.className || '',
      id: imageElement.id || '',
      isVisible: isElementVisible(imageElement),
      timestamp: Date.now()
    };

    // Try to get additional context
    const parentElement = imageElement.parentElement;
    if (parentElement) {
      imageData.parentContext = {
        tagName: parentElement.tagName.toLowerCase(),
        className: parentElement.className || '',
        textContent: getElementTextContent(parentElement).substring(0, 200)
      };
    }

    return imageData;

  } catch (error) {
    console.error('Error extracting image data:', error);
    return null;
  }
}

/**
 * Extract selected image data
 */
function extractSelectedImage(imageSelector) {
  try {
    let imageElement;

    if (imageSelector) {
      imageElement = document.querySelector(imageSelector);
    } else if (selectedImage && selectedImage.element) {
      imageElement = selectedImage.element;
    } else {
      return null;
    }

    return extractImageData(imageElement);

  } catch (error) {
    console.error('Error extracting selected image:', error);
    return null;
  }
}

/**
 * Show inline overlay with results
 */
function showInlineOverlay(data) {
  try {
    // This will be implemented in later tasks for inline result display
    console.log('Show inline overlay:', data);

    // For now, just create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-width: 300px;
    `;
    notification.textContent = data.message || 'AURA processing complete';

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);

  } catch (error) {
    console.error('Error showing inline overlay:', error);
  }
}

/**
 * Clear current selection
 */
function clearSelection() {
  selectedContent = null;
  lastSelection = null;
  selectedImage = null;

  // Clear browser selection
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
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
 * Check if image is valid for processing
 */
function isValidImage(imageElement) {
  if (!imageElement || imageElement.tagName !== 'IMG') {
    return false;
  }

  // Check if image has a valid source
  if (!imageElement.src || imageElement.src === '') {
    return false;
  }

  // Check if image is not too small (likely decorative)
  const minSize = 50;
  if (imageElement.naturalWidth < minSize || imageElement.naturalHeight < minSize) {
    return false;
  }

  // Check if image is visible
  if (!isElementVisible(imageElement)) {
    return false;
  }

  return true;
}

/**
 * Utility function to check if element is visible
 */
function isElementVisible(element) {
  if (!element) return false;

  try {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  } catch (error) {
    console.error('Error checking element visibility:', error);
    return false;
  }
}

/**
 * Utility function to get element text content safely
 */
function getElementTextContent(element) {
  try {
    if (!element) return '';

    // For text nodes, return the text content directly
    if (element.nodeType === Node.TEXT_NODE) {
      return element.textContent || '';
    }

    // For element nodes, get text content
    return element.textContent || element.innerText || '';
  } catch (error) {
    console.error('Error getting element text content:', error);
    return '';
  }
}

/**
 * Utility function to generate unique IDs
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Utility function to debounce function calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Handle page navigation (for SPAs)
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('AURA: Page navigation detected, reinitializing...');

    // Clear selections on navigation
    clearSelection();

    // Reinitialize if needed
    setTimeout(() => {
      if (!isInitialized) {
        initializeContentScript();
      }
    }, 100);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('AURA content script loaded and ready');