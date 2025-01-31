# MisInfo Detective - Chrome Extension

A Chrome extension that helps users detect and analyze potential misinformation on web pages using Google's Fact Check API and Google's Gemini AI.

## Features

1. **Real-time Content Analysis**
   - Analyzes webpage content for potential misinformation
   - Provides a credibility score based on fact-checking results
   - Shows relevant fact-checks from trusted sources
   - Generates a summary of potential misinformation concerns

2. **Automatic Background Scanning**
   - Automatically scans pages as you browse (optional feature)
   - Shows notifications for pages with potential misinformation
   - Visual indicators on the extension icon for suspicious content
   - Can be enabled/disabled through settings

3. **History Tracking**
   - Maintains a history of scanned pages
   - Stores detailed analysis results for each scan
   - Allows reviewing past scans with full details
   - Helps track patterns of misinformation across sites

4. **User Interface**
   - Clean, modern interface with tabbed navigation
   - Easy-to-understand credibility scoring
   - Detailed fact-check results with sources
   - Settings panel for customization

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd MisInfo-Detective
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   GOOGLE_FACT_CHECK_API_KEY=your_google_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from your project folder

## Usage

### Basic Scanning
1. Click the MisInfo Detective icon in your Chrome toolbar
2. Click "Scan Page" to analyze the current webpage
3. View the analysis results, including:
   - Overall credibility score
   - Fact-check matches
   - AI-generated content analysis
   - Recommendations

### Automatic Scanning
1. Open the extension popup
2. Go to the Settings tab
3. Enable "Auto-Scan Pages"
4. Browse normally - the extension will:
   - Automatically scan new pages you visit
   - Show notifications for suspicious content
   - Display warning badges on the extension icon
   - Save results to your scan history

### Viewing History
1. Open the extension popup
2. Click the History tab
3. Browse through your past scans
4. Click any history item to view detailed results

### Settings
- **Auto-Scan Pages**: Enable/disable automatic page scanning
- **API Status**: Check the connection status of required APIs
- **API Configuration**: View and verify API setup

## Development

### Project Structure
```
MisInfo-Detective/
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── background/
│   │   └── background.js
│   ├── content/
│   │   └── content.js
│   ├── history-details.html
│   └── history-details.js
├── dist/
├── webpack.config.js
├── package.json
└── .env
```

### Build Process
1. Development build:
   ```bash
   npm run build
   ```

2. Watch mode for development:
   ```bash
   npm run watch
   ```

### Testing
1. Make changes to the code
2. Run the build command
3. Go to `chrome://extensions/`
4. Click the refresh icon on the extension

## API Usage

### Google Fact Check API
- Used for retrieving fact-checks from various sources
- Requires a valid API key from Google Cloud Console
- Configure in `.env` file

### Google Gemini AI
- Used for content analysis and summarization
- Requires a valid Gemini API key
- Configure in `.env` file

## Security Notes

1. API Keys
   - Store API keys in `.env` file
   - Never commit `.env` file to version control
   - Keep API keys confidential

2. Permissions
   - The extension requires specific permissions for functionality
   - Only accesses necessary webpage content
   - Respects user privacy and data

## Troubleshooting

### Common Issues

1. Auto-scan not working:
   - Confirm auto-scan is enabled in settings
   - Check if notifications are allowed in Chrome
   - Look for any console errors in Developer Tools

### Debug Mode
- Open Chrome Developer Tools
- Check the Console tab for error messages
- Enable verbose logging in the extension

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
[Add your license information here]