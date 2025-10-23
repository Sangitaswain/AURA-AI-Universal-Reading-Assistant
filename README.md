# AURA - AI Universal Reading Assistant

Understand the web your way — summarize, simplify, translate, and listen, powered by Gemini Nano.

## Overview

This extension helps make web content more accessible by providing:
- **Image Descriptions**: AI-generated alt-text and detailed descriptions for images
- **Text Summaries**: Concise 3-bullet summaries of long text passages  
- **Text Simplification**: "Explain Like I'm 5" rewrites in plain English
- **Translation**: Multilingual content support
- **Audio Playback**: Text-to-speech for all generated content

All processing happens **locally on your device** using Chrome's Built-in AI (Gemini Nano) - no data leaves your computer.

## Requirements

- **Chrome 138+** with Built-in AI features enabled
- **Storage**: 22GB free space for AI model download (first-time only)
- **Memory**: 16GB+ RAM (CPU) or 4GB+ VRAM (GPU)
- **OS**: Windows 10/11, macOS 13+, Linux, or ChromeOS

## Installation (Development)

1. **Clone or download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the project folder
5. **Pin the extension** to your toolbar for easy access

## Usage

### Text Summarization
1. **Highlight text** on any webpage
2. **Right-click** and select "Summarize with Accessibility Assistant"
3. **Or click the extension icon** to open the popup interface
4. **Click "Summarize"** to get 3 concise bullet points

### Text Simplification  
1. **Select complex text** you want to understand better
2. **Open the extension popup**
3. **Click "Explain Like I'm 5"** for plain English rewrite

### Image Descriptions
1. **Right-click any image** on a webpage
2. **Select "Describe Image"** from the context menu
3. **Get both alt-text and detailed descriptions**

### Audio Playback
1. **Generate any content** (summary, description, etc.)
2. **Click "Read Aloud"** to hear it spoken
3. **Use audio controls** to pause/stop playback

## Privacy & Security

🔒 **100% Local Processing**: All AI runs on your device using Gemini Nano
🚫 **No Data Transmission**: Your content never leaves your computer  
🔓 **Open Source**: Full transparency in how your data is handled
⚡ **Offline Capable**: Works without internet after initial model download

## Features Status

- ✅ **Project Structure**: Chrome Extension foundation
- 🚧 **Content Extraction**: Text and image selection (in progress)
- 🚧 **AI Integration**: Gemini Nano APIs (coming next)
- 🚧 **Text Summarization**: 3-bullet summaries (task 5)
- 🚧 **Text Simplification**: ELI5 rewrites (task 6)  
- 🚧 **Image Descriptions**: Alt-text generation (task 7)
- 🚧 **Translation**: Multilingual support (task 8)
- 🚧 **Audio Playback**: Text-to-speech (task 9)
- 🚧 **Content Saving**: Local storage (task 10)

## Development

This extension is built using:
- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (ES2020+)
- **Chrome Built-in AI APIs** (Gemini Nano)
- **Web Speech API** for text-to-speech
- **Chrome Storage API** for persistence

### Project Structure
```
├── manifest.json          # Extension configuration
├── popup.html             # Main UI interface  
├── popup.css              # Styling with accessibility features
├── popup.js               # UI logic and AI integration
├── contentScript.js       # DOM interaction and content extraction
├── background.js          # Service worker for coordination
├── icons/                 # Extension icons (16, 32, 48, 128px)
└── README.md             # This file
```

## Contributing

This project follows accessibility-first development principles:
- **WCAG 2.1 AA compliance** for all UI elements
- **Full keyboard navigation** support
- **Screen reader compatibility** with ARIA labels
- **High contrast mode** support
- **Reduced motion** preferences respected

## License

MIT License - see LICENSE file for details.

## Support

For issues, questions, or feature requests, please check the project documentation or create an issue in the repository.