# Team Balancer Backend

A Flask backend for the Team Balancer application that fetches player scores from Google Sheets and balances teams.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory with your Google API Key and Spreadsheet ID:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   SPREADSHEET_ID=your_spreadsheet_id_here
   ```
4. Update the `RANGE_NAME` constant in `app.py` if needed based on your sheet structure

## Running the Application

Start the Flask development server:
```
python app.py
```

The server will run on http://localhost:5000 by default.

## API Endpoints

### GET /
Returns a simple message indicating the backend is running.

### GET /api/hello
Returns a hello message from the backend.

### GET /api/refresh
Refreshes the internal score mappings from the Google Sheet.

**Note:** This endpoint is maintained for backward compatibility. It's recommended to use `/api/get_mappings?force_refresh=true` instead.

Response:
```json
{
  "success": true,
  "message": "Score mappings refreshed successfully",
  "count": 10
}
```

### GET /api/get_mappings
Returns the last fetched score mappings. Auto-refreshes the data every REFRESH_INTERVAL_HOURS hours.

Query parameters:
- `force_refresh` (boolean): If set to `true`, forces a refresh of the data if at least MIN_REFRESH_INTERVAL_SECONDS (30 seconds) have passed since the last refresh

Response:
```json
{
  "scores": {
    "Player1": 10,
    "Player2": 8,
    "Player3": 5,
    "Player4": 7
  },
  "refreshed": true,
  "force_refresh_prevented": false,
  "seconds_until_next_refresh": 0
}
```

If a forced refresh is prevented due to the minimum interval not being met, the response will include:
- `force_refresh_prevented`: true
- `seconds_until_next_refresh`: number of seconds until a forced refresh is allowed

### POST /api/balance
Balances players into two teams based on their scores.

Request body:
```json
{
  "users": {
    "Player1": 10,
    "Player2": 8,
    "Player3": 5,
    "Player4": 7
  }
}
```

Response:
```json
{
  "teamA": [
    {"nickname": "Player1", "score": 10},
    {"nickname": "Player3", "score": 5}
  ],
  "teamB": [
    {"nickname": "Player2", "score": 8},
    {"nickname": "Player4", "score": 7}
  ]
}
```

## Google Sheets Setup

1. Create a Google Sheet with player nicknames in column B and scores in column C (based on the default RANGE_NAME="scores!B2:C")
2. Make sure the sheet is publicly accessible (Anyone with the link can view)
3. Get the Spreadsheet ID from the URL (the long string in the middle of the URL)
4. Add the Spreadsheet ID to your `.env` file
