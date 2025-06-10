# Team Balancer Backend

![Python](https://img.shields.io/badge/python-3.11-blue.svg) ![Flask](https://img.shields.io/badge/flask-2.3.3-lightgrey.svg) ![Gunicorn](https://img.shields.io/badge/gunicorn-21.2.0-green.svg) ![SQLite](https://img.shields.io/badge/sqlite-3-003B57.svg) ![Pytest](https://img.shields.io/badge/pytest-7.4.0-0A9EDC.svg) ![Google Sheets](https://img.shields.io/badge/Google_Sheets-API-4285F4.svg) ![Typer](https://img.shields.io/badge/typer-0.9.0-FF6B6B.svg)

A Flask backend for the Team Balancer application that fetches player scores from Google Sheets, stores game results in SQLite, and balances teams.

## Technologies Used

- **Flask** - Web framework
- **Gunicorn** - WSGI HTTP Server for production deployment
- **Google Sheets API** - For fetching player data
- **SQLite** - Embedded database for storing events
- **Pytest** - For testing

## Setup

1. Clone the repository
2. Create and activate a virtual environment:
   ```bash
   # Create a virtual environment
   python -m venv .venv

   # Activate the virtual environment
   # On macOS/Linux:
   source .venv/bin/activate
   # On Windows:
   # .venv\Scripts\activate
   ```
3. Install dependencies using pip:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   # Google Sheets API (optional if using SQLite only)
   GOOGLE_API_KEY=your_google_api_key_here
   SPREADSHEET_ID=your_spreadsheet_id_here

   # Database configuration
   DB_PATH=data/database.sqlite
   ```
5. Update the `RANGE_NAME` constant in `app.py` if needed based on your sheet structure

## Running the Application

Make sure your virtual environment is activated, then start the server:

### Development Mode (Flask Development Server)
```bash
# Activate the virtual environment (if not already activated)
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Start the Flask development server
python app.py
```

The Flask development server will run on http://localhost:5050. Note that this is only recommended for development.

### Production Mode (Gunicorn)
```bash
# Activate the virtual environment (if not already activated)
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Start the Gunicorn server
gunicorn --workers=4 --bind=0.0.0.0:5050 app:app
```

Gunicorn is the recommended way to run the application in production.

Gunicorn will run on http://0.0.0.0:5050, making it accessible from other devices on the network.

## API Endpoints

### GET /
Returns a simple message indicating the backend is running.

### GET /api/hello
Returns a hello message from the backend.

### GET /api/users
Returns all users with their scores and win/loss statistics. Auto-refreshes the data every REFRESH_INTERVAL_HOURS hours.

Query parameters:
- `force_refresh` (boolean): If set to `true`, forces a refresh of the data if at least MIN_REFRESH_INTERVAL_SECONDS (30 seconds) have passed since the last refresh

Response:
```json
{
  "users": {
    "Player1": {
      "score": 10,
      "wins": 5,
      "losses": 2
    },
    "Player2": {
      "score": 8,
      "wins": 3,
      "losses": 4
    },
    "Player3": {
      "score": 5,
      "wins": 1,
      "losses": 0
    },
    "Player4": {
      "score": 7,
      "wins": 2,
      "losses": 3
    }
  },
  "refreshed": true,
  "force_refresh_prevented": false,
  "seconds_until_next_refresh": 0
}
```

If a forced refresh is prevented due to the minimum interval not being met, the response will include:
- `force_refresh_prevented`: true
- `seconds_until_next_refresh`: number of seconds until a forced refresh is allowed

**Note:** This endpoint replaces the previous `/api/get_mappings` endpoint and adds win/loss statistics for each player.

### POST /api/balance
Balances players into two teams so that the total sum of each team's scores is as close as possible.

Request body:
```json
{
  "users": {
    "Player1": 10,
    "Player2": 8,
    "Player3": 5,
    "Player4": 7
  },
  "randomness": 50
}
```

Parameters:
- `users` (object, required): Mapping of player nicknames to their scores
- `randomness` (integer, optional): Value between 0-100 that determines how much randomness to add to scores
  - 0 = no randomness (default)
  - 100 = maximum randomness

Note: The algorithm sorts players by score (with randomness applied if specified), then pairs consecutive players and distributes each pair between the two teams. This ensures that for every high-skilled player in one team, there's a corresponding high-skilled player in the other team. If there's an odd number of players, the last player is assigned to the team with the lower total score.

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

### POST /api/submit_game
Submits a new game with two teams and records the results in the database.

Request body:
```json
{
  "teamA": [
    {"nickname": "player1"},
    {"nickname": "player2"}
  ],
  "teamB": [
    {"nickname": "player3"},
    {"nickname": "player4"}
  ],
  "winningTeam": "A",
  "gameName": "Game name",
  "gameDatetime": "YYYY-MM-DD HH:MM:SS",
  "adminPasscode": "admin:password"
}
```

Parameters:
- `teamA` (array, required): Array of player objects for team A
- `teamB` (array, required): Array of player objects for team B
- `winningTeam` (string, required): Either "A" or "B" to indicate  the winning team
- `gameName` (string, required): Name of the game
- `gameDatetime` (string, required): Datetime of the game
- `adminPasscode` (string, required): Admin credentials in the format "admin:password"

Response:
```json
{
  "count": 4,
  "message": "Game results recorded successfully"
}
```

### GET /api/digest
Returns the latest digest data.

Response:
```json
{
  "metadata": {
    "generated_on": "2024-01-01T12:00:00",
    "period_start_date": "2023-12-01",
    "period_end_date": "2023-12-31"
  },
  "top_players": [
    {"nickname": "Player1", "game_count": 10},
    {"nickname": "Player2", "game_count": 8},
    {"nickname": "Player3", "game_count": 5},
    {"nickname": "Player4", "game_count": 7}
    ...
  ],
  "top_admins": [
    {"admin_name": "Admin1", "distinct_games_count": 15},
    {"admin_name": "Admin2", "distinct_games_count": 12},
    {"admin_name": "Admin3", "distinct_games_count": 10}
    ...
  ],
  "players_for_status_change": [
    {"nickname": "Player5", "total_games_played": 10, "wins": 6, "losses": 4, "win_rate_percentage": 60.0, "status": "Promote"},
    {"nickname": "Player6", "total_games_played": 10, "wins": 4, "losses": 6, "win_rate_percentage": 40.0, "status": "Demote"}
    ...
  ],
  "hourly_activity": [
    {"hour": 0, "game_count": 5},
    {"hour": 1, "game_count": 3},
    ...
  ],
  "weekly_activity_by_day": [
    {"day": "Sunday", "game_count": 10},
    {"day": "Monday", "game_count": 8},
    ...
  ],
  "total_activity_by_day_of_month": [
    {"day_of_month": "01", "game_count": 15},
    {"day_of_month": "02", "game_count": 12},
    ...
  ]
}
```

In case there are no digests generated yet, the endpoint will return:
```json
{
  "error": "No digest found"
}
```

## Database API Endpoints

The following endpoints are available for interacting with the SQLite database:

### GET /api/db/events
Returns all events or events for a specific admin.

Query parameters:
- `admin_passcode` (optional): If provided, only returns events with matching admin hash

Response:
```json
{
  "events": [
    {
      "id": 1,
      "nickname": "player1",
      "game_name": "Game1",
      "win": true,
      "admin": "hashed_admin_passcode"
    },
    {
      "id": 2,
      "nickname": "player2",
      "game_name": "Game2",
      "win": false,
      "admin": "hashed_admin_passcode"
    }
  ]
}
```

### GET /api/db/events/:id
Returns a specific event by ID.

Response:
```json
{
  "event": {
    "id": 1,
    "nickname": "player1",
    "game_name": "Game1",
    "win": true,
    "admin": "hashed_admin_passcode"
  }
}
```

### POST /api/db/events
Creates a new event.

Request body:
```json
{
  "nickname": "player1",
  "game_name": "Game1",
  "win": true,
  "admin_passcode": "admin123"
}
```

Response:
```json
{
  "id": 1,
  "message": "Event added successfully"
}
```

### PUT /api/db/events/:id
Updates an existing event.

Request body:
```json
{
  "nickname": "updated_player",  // Optional
  "game_name": "Updated Game",   // Optional
  "win": false,                  // Optional
  "admin_passcode": "admin123"   // Required for verification
}
```

Response:
```json
{
  "message": "Event updated successfully"
}
```

### DELETE /api/db/events/:id
Deletes an event.

Request body:
```json
{
  "admin_passcode": "admin123"  // Required for verification
}
```

Response:
```json
{
  "message": "Event deleted successfully"
}
```

## Utility Scripts

The project includes several utility scripts for managing the database:

### Admin Management

```bash
# Add a new admin (format: admin:password)
python -m src.utils.admin add "admin:password"

# Remove an admin
python -m src.utils.admin remove "admin"
```

### User Management

```bash
# Clean history (wins and losses) for a specific user
python -m src.utils.user clean "nickname"
```

When running in Docker, prefix the commands with `docker compose exec backend`:

```bash
docker compose exec backend python -m src.utils.admin add "admin:password"
docker compose exec backend python -m src.utils.user clean "nickname"
```

## Testing

The backend includes a comprehensive test suite using pytest. To run the tests:

```bash
# Activate the virtual environment
source .venv/bin/activate

# Install pytest and related packages (if not already installed)
pip install pytest pytest-flask pytest-mock

# Run all tests
python -m pytest

# Run tests with verbose output
python -m pytest -v

# Run a specific test file
python -m pytest tests/test_app.py
```

For more details about the tests, see the [tests README](tests/README.md).

## Migrations

`v2`: Added `game_datetime` column to `events` table and transformed `game_name` format to "TeamA|VS|TeamB". Replace admin's hash with admin's ID in `events` table.
`v3`: Nickname -> player_id. Edit events and added rank_changes table as well as players table. How to migrate:
1. Run `python -m src.utils.migrations.v3 refactor-user-schema -d data/database.sqlite` to change events and add all tables
2. Run `python -m src.utils.digest generate --no-plots --late-night-shift 4` to generate new digest with player_id
3. Run `python -m src.utils.digest apply` to populate rank_changes table with the changes from the lastest digest

## Google Sheets Setup

1. Create a Google Sheet with player nicknames in column B and scores in column C (based on the default RANGE_NAME="scores!B2:C")
2. Make sure the sheet is publicly accessible (Anyone with the link can view)
3. Get the Spreadsheet ID from the URL (the long string in the middle of the URL)
4. Add the Spreadsheet ID to your `.env` file
