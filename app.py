from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
import random
from datetime import datetime, timedelta

# Load environment variables from .env file
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
RANGE_NAME = "Scores!B2:C"  # Adjust based on your sheet structure

# Global variables to store the score mappings and last refresh time
score_mappings = {}
last_refresh_time = None

# Refresh interval in hours
REFRESH_INTERVAL_HOURS = 4

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})


def fetch_all_scores_from_sheet():
    """
    Fetch all scores from Google Sheet and return them as a dictionary.

    Returns:
        dict: Dictionary mapping all nicknames to scores
    """
    try:
        # Build the Sheets API service
        service = build("sheets", "v4", developerKey=GOOGLE_API_KEY)

        # Call the Sheets API to get the data
        sheet = service.spreadsheets()
        result = (
            sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
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


def get_scores_from_sheet(nicknames_to_find):
    """
    Get scores for specific nicknames from the global score_mappings.
    If score_mappings is empty or it's been more than REFRESH_INTERVAL_HOURS since the last refresh,
    fetch all scores first.

    Args:
        nicknames_to_find (list): List of nicknames to find scores for

    Returns:
        dict: Dictionary mapping requested nicknames to scores
    """
    global score_mappings, last_refresh_time

    # Check if we need to refresh the data
    current_time = datetime.now()
    refresh_interval = timedelta(hours=REFRESH_INTERVAL_HOURS)

    if (
        not score_mappings
        or last_refresh_time is None
        or (current_time - last_refresh_time) > refresh_interval
    ):
        score_mappings = fetch_all_scores_from_sheet()
        last_refresh_time = current_time
        print(f"Auto-refreshed score mappings at {current_time}")

    # Create result dictionary with scores for requested nicknames
    result_scores = {}
    for nickname in nicknames_to_find:
        result_scores[nickname] = score_mappings.get(
            nickname, 0
        )  # Default to 0 if not found

    return result_scores


def balance_teams(user_scores):
    """
    Balance players into two teams based on their scores.

    Args:
        user_scores (dict): Dictionary mapping usernames to their scores {'user1': 3, 'user2': 2, ...}

    Returns:
        dict: Dictionary with 'teamA' and 'teamB' lists of player objects
    """
    # Convert the user_scores dictionary to a list of player objects
    players = []
    for username, score in user_scores.items():
        players.append({"nickname": username, "score": score})

    # Shuffle the players randomly first
    random.shuffle(players)

    # Sort players by score in descending order
    players.sort(key=lambda x: x["score"], reverse=True)

    # Initialize teams and their total scores
    team_a = []
    team_b = []
    team_a_total = 0
    team_b_total = 0

    # Assign players to teams based on the lowest current team total score
    for player in players:
        if team_a_total <= team_b_total:
            team_a.append(player)
            team_a_total += player["score"]
        else:
            team_b.append(player)
            team_b_total += player["score"]

    return {"teamA": team_a, "teamB": team_b}


@app.route("/")
def index():
    return "Team Balancer Backend is running!"


@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Team Balancer Backend!"})


@app.route("/api/refresh", methods=["GET"])
def refresh():
    """
    Endpoint to refresh the score mappings from Google Sheet.

    Returns: {'success': True/False, 'message': '...', 'count': number_of_scores}
    """
    try:
        global score_mappings, last_refresh_time
        score_mappings = fetch_all_scores_from_sheet()
        last_refresh_time = datetime.now()

        return jsonify(
            {
                "success": True,
                "message": "Score mappings refreshed successfully",
                "count": len(score_mappings),
            }
        )

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"An error occurred: {str(e)}", "count": 0}
        ), 500


@app.route("/api/get_mappings", methods=["GET"])
def get_mappings():
    """
    Endpoint to get the last fetched score mappings.
    Auto-refreshes the data every REFRESH_INTERVAL_HOURS hours.

    Returns: {'scores': {nickname: score, ...}}
    """
    try:
        global score_mappings, last_refresh_time

        # If score_mappings is empty or it's been more than REFRESH_INTERVAL_HOURS since the last refresh,
        # fetch the data again
        current_time = datetime.now()
        refresh_interval = timedelta(hours=REFRESH_INTERVAL_HOURS)

        if (
            not score_mappings
            or last_refresh_time is None
            or (current_time - last_refresh_time) > refresh_interval
        ):
            score_mappings = fetch_all_scores_from_sheet()
            last_refresh_time = current_time
            print(f"Auto-refreshed score mappings at {current_time}")

        return jsonify({"scores": score_mappings})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/api/balance", methods=["POST"])
def balance():
    """
    Endpoint to balance players into two teams based on their scores.

    Expected request body: {'users': {'user1': 3, 'user2': 2, ...}}
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

        balanced_teams = balance_teams(user_scores)

        return jsonify(balanced_teams)

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
