# SAP IDOC Monitor

Real-time SAP IDOC monitoring dashboard with professional UI and auto-refresh.

## Features
- 📊 Live IDOC statistics (Total, Errors, Success, Processing)
- 📋 Error table with detailed IDOC information
- 🔄 Auto-refresh every 30 seconds
- 📱 Responsive design

## Files
- `index.html` - Main dashboard
- `style.css` - Professional styling
- `script.js` - Data loading and UI updates
- `fetch_idocs.py` - SAP API data fetcher (not included)

## Setup
1. Configure SAP credentials in `fetch_idocs.py`
2. Run `python fetch_idocs.py` to fetch data
3. Open `index.html` in browser

## Usage
- Dashboard auto-updates every 30 seconds
- Click refresh button to manually update
- Search IDOCs using the search box

Built for SAP IDOC monitoring and error tracking.