from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
import random
from datetime import datetime, timedelta
from utils import db

# Load environment variables from .env file
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
RANGE_NAME = "Scores!B2:C"  # Adjust based on your sheet structure

# Constants
REFRESH_INTERVAL_HOURS = 4  # Refresh interval in hours
MIN_REFRESH_INTERVAL_SECONDS = 30  # Minimum interval in seconds for a forced refresh
DEFAULT_RANDOMNESS = 0  # Default randomness value (0-100) for team balancing

# Global variables to store the score mappings and last refresh time
score_mappings = {}
last_refresh_time = None

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

gservice = build("sheets", "v4", developerKey=GOOGLE_API_KEY, cache_discovery=False)


def fetch_all_scores_from_sheet():
    """
    Fetch all scores from Google Sheet and return them as a dictionary.

    Returns:
        dict: Dictionary mapping all nicknames to scores
    """
    try:
        # Call the Sheets API to get the data
        result = (
            gservice.spreadsheets()
            .values()
            .get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME)
            .execute()
        )
        values = result.get("values", [])

        if not values:
            return {}

        # Create a dictionary mapping nicknames to scores from the sheet
        nickname_to_score = {}
        for row in values:
            if len(row) >= 2:  # Ensure row has both nickname and score
                nickname = row[0]
                try:
                    score = float(row[1])
                except ValueError:
                    score = 0  # Default score if conversion fails
                nickname_to_score[nickname] = score

        return nickname_to_score

    except Exception as e:
        print(f"Error fetching scores from sheet: {e}")
        return {}  # Return empty dict on error


def balance_teams(user_scores, randomness=DEFAULT_RANDOMNESS):
    """
    Balance players into two teams by pairing players from the sorted list and distributing each pair
    between the two teams, with optional randomness applied to the scores.

    Args:
        user_scores (dict): Dictionary mapping usernames to their scores {'user1': 3, 'user2': 2, ...}
        randomness (int): Value between 0-100 that determines how much randomness to add to scores
                         0 = no randomness, 100 = maximum randomness

    Returns:
        dict: Dictionary with 'teamA' and 'teamB' lists of player objects
    """
    # Convert the user_scores dictionary to a list of player objects
    players = []
    for username, score in user_scores.items():
        # Create a copy of the original score for balancing
        original_score = score

        # Apply randomness if specified (value between 0-100)
        if randomness > 0:
            # Calculate the maximum random adjustment based on the randomness parameter
            # Higher randomness = larger potential adjustment
            max_adjustment = original_score * (randomness / 100)

            # Generate a random adjustment between -max_adjustment and +max_adjustment
            random_adjustment = random.uniform(-max_adjustment, max_adjustment)

            # Apply the random adjustment to create a randomized score for balancing
            randomized_score = original_score + random_adjustment

            # Ensure score doesn't go below 0
            randomized_score = max(0, randomized_score)
        else:
            # No randomness, use original score
            randomized_score = original_score

        players.append(
            {
                "nickname": username,
                "score": original_score,  # Keep original score for display
                "randomized_score": randomized_score,  # Use randomized score for balancing
            }
        )

    # Shuffle the players randomly first to ensure random distribution when scores are equal
    random.shuffle(players)

    # Sort players by randomized score in descending order
    players.sort(key=lambda x: (x["randomized_score"], x["nickname"]), reverse=True)

    # Initialize teams and their total scores
    team_a = []
    team_b = []
    team_a_total = 0
    team_b_total = 0

    max_players_per_team = len(players) // 2

    # Pair players and distribute them between teams
    for player in players:
        if len(team_b) >= max_players_per_team:
            team_a.append(player)
            team_a_total += player["randomized_score"]
        elif len(team_a) >= max_players_per_team:
            team_b.append(player)
            team_b_total += player["randomized_score"]
        elif team_a_total <= team_b_total:
            team_a.append(player)
            team_a_total += player["randomized_score"]
        else:
            team_b.append(player)
            team_b_total += player["randomized_score"]

    team_a.sort(key=lambda x: x["score"], reverse=True)
    team_b.sort(key=lambda x: x["score"], reverse=True)
    return {"teamA": team_a, "teamB": team_b}


@app.route("/")
def index():
    return "Team Balancer Backend is running!"


@app.route("/api/users", methods=["GET"])
def get_users():
    """
    Endpoint to get all users with their scores and win/loss statistics.
    Auto-refreshes the data every REFRESH_INTERVAL_HOURS hours.

    Query parameters:
        force_refresh (bool): If 'true', forces a refresh of the data if at least MIN_REFRESH_INTERVAL_SECONDS
                             have passed since the last refresh

    Returns: {
        'users': {
            nickname: {
                'score': float,
                'wins': int,
                'losses': int
            },
            ...
        },
        'refreshed': True/False,
        'force_refresh_prevented': True/False,
        'seconds_until_next_refresh': int (seconds remaining until a forced refresh is allowed)
    }
    """
    try:
        global score_mappings, last_refresh_time

        # Check if force_refresh is set to true in the query parameters
        force_refresh = request.args.get("force_refresh", "").lower() == "true"
        refreshed = False

        # Get current time for refresh check
        current_time = datetime.now()
        refresh_interval = timedelta(hours=REFRESH_INTERVAL_HOURS)
        min_refresh_interval = timedelta(seconds=MIN_REFRESH_INTERVAL_SECONDS)

        # Check if we can do a forced refresh (at least MIN_REFRESH_INTERVAL_SECONDS since last refresh)
        can_force_refresh = (
            last_refresh_time is None
            or (current_time - last_refresh_time) > min_refresh_interval
        )

        # Refresh if auto-refresh conditions are met or if forced and minimum interval has passed
        if (
            (force_refresh and can_force_refresh)
            or not score_mappings
            or last_refresh_time is None
            or (current_time - last_refresh_time) > refresh_interval
        ):
            score_mappings = fetch_all_scores_from_sheet()
            last_refresh_time = current_time
            refreshed = True
            refresh_type = "auto"
            if force_refresh:
                if can_force_refresh:
                    refresh_type = "forced"
                else:
                    refresh_type = "forced (prevented - too soon)"

            print(f"Refreshed score mappings at {current_time} ({refresh_type})")

        # Add information about whether a forced refresh was prevented due to time constraints
        force_refresh_prevented = force_refresh and not can_force_refresh

        # Get all unique nicknames from the score mappings
        nicknames = list(score_mappings.keys())

        # Get win/loss statistics for all nicknames directly from the database
        user_stats = {}
        if nicknames:
            user_stats = db.get_player_stats(nicknames)

        # Combine scores and statistics into a single users dictionary
        users = {}
        for nickname, score in score_mappings.items():
            stats = user_stats.get(nickname, {"wins": 0, "losses": 0})
            users[nickname] = {
                "score": score,
                "wins": stats["wins"],
                "losses": stats["losses"],
            }

        return jsonify(
            {
                "users": users,
                "refreshed": refreshed,
                "force_refresh_prevented": force_refresh_prevented,
                "seconds_until_next_refresh": MIN_REFRESH_INTERVAL_SECONDS
                - (current_time - last_refresh_time).total_seconds()
                if force_refresh_prevented
                else 0,
            }
        )

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/api/balance", methods=["POST"])
def balance():
    """
    Endpoint to balance players into two teams based on their scores.

    Expected request body: {
        'users': {'user1': 3, 'user2': 2, ...},
        'randomness': 50  # Optional, value between 0-100
    }
    Returns: {'teamA': [...], 'teamB': [...]}
    """
    try:
        data = request.get_json()

        if not data or "users" not in data:
            return jsonify(
                {"error": "Invalid request. Please provide a users object with scores."}
            ), 400

        user_scores = data["users"]

        # Validate that user_scores is a dictionary
        if not isinstance(user_scores, dict):
            return jsonify(
                {
                    "error": "Invalid format. 'users' should be an object mapping usernames to scores."
                }
            ), 400

        # Validate that all scores are numbers
        for username, score in user_scores.items():
            if not isinstance(score, (int, float)):
                user_scores[username] = 0  # Convert non-numeric scores to 0

        # Get randomness parameter if provided, otherwise use default
        randomness = DEFAULT_RANDOMNESS
        if "randomness" in data:
            try:
                randomness = int(data["randomness"])
                # Ensure randomness is within valid range (0-100)
                if randomness < 0 or randomness > 100:
                    return jsonify(
                        {"error": "Randomness must be a value between 0 and 100."}
                    ), 400
            except (ValueError, TypeError):
                return jsonify(
                    {"error": "Randomness must be a valid integer between 0 and 100."}
                ), 400

        balanced_teams = balance_teams(user_scores, randomness)

        return jsonify(balanced_teams)

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/api/submit_game", methods=["POST"])
def submit_game():
    """
    Endpoint to submit a new game with two teams and record the results in the database.

    Expected request body: {
        'teamA': [{'nickname': 'player1'}, {'nickname': 'player2'}, ...],
        'teamB': [{'nickname': 'player3'}, {'nickname': 'player4'}, ...],
        'winningTeam': 'A' or 'B',
        'gameName': 'Game name',
        'adminPasscode': 'admin_passcode'
    }

    Returns: {
        'eventIds': [1, 2, 3, ...],
        'message': 'Game results recorded successfully'
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = [
            "teamA",
            "teamB",
            "winningTeam",
            "gameName",
            "gameDatetime",
            "adminPasscode",
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Validate teams format
        if not isinstance(data["teamA"], list) or not isinstance(data["teamB"], list):
            return jsonify(
                {"error": "Teams must be provided as lists of player objects"}
            ), 400

        # Validate winning team
        if data["winningTeam"] not in ["A", "B"]:
            return jsonify({"error": "winningTeam must be either 'A' or 'B'"}), 400

        # Extract player nicknames from both teams
        team_a_nicknames = [
            player.get("nickname") for player in data["teamA"] if player.get("nickname")
        ]
        team_b_nicknames = [
            player.get("nickname") for player in data["teamB"] if player.get("nickname")
        ]

        # Validate that we have at least one player in each team
        if not team_a_nicknames or not team_b_nicknames:
            return jsonify(
                {"error": "Each team must have at least one player with a nickname"}
            ), 400

        # Combine all players and determine win/loss status
        all_nicknames = []
        all_wins = []

        # Add Team A players
        for nickname in team_a_nicknames:
            all_nicknames.append(nickname)
            all_wins.append(data["winningTeam"] == "A")

        # Add Team B players
        for nickname in team_b_nicknames:
            all_nicknames.append(nickname)
            all_wins.append(data["winningTeam"] == "B")

        # Call the database function directly to add events in batch
        events_added = db.add_events_batch(
            nicknames=all_nicknames,
            game_datetime=data["gameDatetime"],
            game_name=data["gameName"],
            wins=all_wins,
            admin_passcode=data["adminPasscode"],
        )

        return jsonify(
            {"count": events_added, "message": "Game results recorded successfully"}
        )

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
