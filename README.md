# MisInfo Detective

A Chrome extension that helps users detect potential misinformation in web content using Google's Fact Check API and Gemini AI.

## Features

- **Real-time Analysis**: Automatically scans web pages as you browse
- **Credibility Scoring**: Provides a credibility score based on multiple factors
- **Visual Indicators**: Uses badge colors and icons to show analysis status
- **Detailed Reports**: Access comprehensive analysis through the extension popup
- **History Tracking**: Maintains a history of scanned pages and their results
- **Auto-Scan Toggle**: Option to enable/disable automatic page scanning

## How It Works

### 1. Page Analysis
- When you visit a webpage, the extension automatically scans the content (if auto-scan is enabled)
- The extension icon shows the current status:
  - `⟳` (Blue): Page is being scanned
  - `✕` (Gray): Error occurred during scanning
  - `!` (Red): Low credibility score (<60%)
  - `?` (Orange): Medium credibility score (60-80%)
  - `✓` (Green): High credibility score (>80%)

### 2. Analysis Process
1. **Content Extraction**: Extracts relevant text content from the webpage
2. **Fact Checking**: Uses Google's Fact Check API to find related fact checks
3. **AI Analysis**: Employs Gemini AI to analyze the content's credibility
4. **Score Calculation**: Combines results to generate an overall credibility score

### 3. User Interface
- **Extension Popup**: Click the extension icon to view:
  - Detailed credibility analysis
  - Found fact checks
  - AI insights
  - Content warnings
- **Settings Tab**: Configure extension preferences
- **History Tab**: View past analyses and revisit previous results

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Add your API keys to `.env`:
```
GOOGLE_FACT_CHECK_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

4. Build the extension:
```bash
npm run build
```

5. Load in Chrome:
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory

## API Keys

- **Google Fact Check API**: Get your key from [Google Cloud Console](https://console.cloud.google.com/)
- **Gemini AI**: Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Technical Details

### Components
- **Background Service Worker**: Manages analysis and badge updates
- **Content Script**: Extracts page content
- **Popup Interface**: Displays analysis results and settings
- **Analysis Manager**: Coordinates API calls and result processing

### APIs Used
- Google Fact Check API: Retrieves fact checks for claims
- Gemini AI API: Analyzes content credibility
- Chrome Extension APIs: Storage, Tabs, and Scripting

### Storage
- Uses Chrome's storage API to save:
  - User settings
  - Analysis history
  - Result cache
