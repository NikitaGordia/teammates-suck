"""
API endpoints for database operations.
This module contains all the Flask routes for interacting with the database.
"""

from flask import Blueprint, jsonify, request
import db

# Create a Blueprint for the database API
db_api = Blueprint("db_api", __name__)


@db_api.route("/events", methods=["GET"])
def get_events():
    """
    Get all events or events for a specific admin.

    Query parameters:
        admin_passcode (str, optional): If provided, only return events with matching admin hash

    Returns:
        JSON: List of events
    """
    try:
        admin_passcode = request.args.get("admin_passcode")
        events = db.get_events(admin_passcode)
        return jsonify({"events": events})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@db_api.route("/events/<int:event_id>", methods=["GET"])
def get_event(event_id):
    """
    Get a specific event by ID.

    Args:
        event_id (int): ID of the event to retrieve

    Returns:
        JSON: Event data or error message
    """
    try:
        event = db.get_event_by_id(event_id)
        if event:
            return jsonify({"event": event})
        return jsonify({"error": "Event not found"}), 404
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@db_api.route("/events", methods=["POST"])
def add_event():
    """
    Add a new event.

    Expected request body: {
        'nickname': 'player_name',
        'game_name': 'game_name',
        'win': true/false,
        'admin_passcode': 'admin_passcode'
    }

    Returns:
        JSON: New event ID or error message
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["nickname", "game_name", "win", "admin_passcode"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Validate data types
        if not isinstance(data["nickname"], str):
            return jsonify({"error": "Nickname must be a string"}), 400
        if not isinstance(data["game_name"], str):
            return jsonify({"error": "Game name must be a string"}), 400
        if not isinstance(data["win"], bool):
            return jsonify({"error": "Win must be a boolean"}), 400
        if not isinstance(data["admin_passcode"], str):
            return jsonify({"error": "Admin passcode must be a string"}), 400

        # Add the event
        event_id = db.add_event(
            data["nickname"], data["game_name"], data["win"], data["admin_passcode"]
        )

        return jsonify({"id": event_id, "message": "Event added successfully"})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@db_api.route("/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    """
    Update an existing event.

    Args:
        event_id (int): ID of the event to update

    Expected request body: {
        'nickname': 'player_name',  # Optional
        'game_name': 'game_name',   # Optional
        'win': true/false,          # Optional
        'admin_passcode': 'admin_passcode'  # Required for verification
    }

    Returns:
        JSON: Success message or error
    """
    try:
        data = request.get_json()

        # Validate admin_passcode is provided
        if "admin_passcode" not in data:
            return jsonify({"error": "Admin passcode is required"}), 400

        # Get current event to verify admin passcode
        current_event = db.get_event_by_id(event_id)
        if not current_event:
            return jsonify({"error": "Event not found"}), 404

        # Verify admin passcode
        if not db.delete_event(event_id, data["admin_passcode"]):
            return jsonify({"error": "Invalid admin passcode"}), 403

        # Add the event back with updated data
        nickname = data.get("nickname", current_event["nickname"])
        game_name = data.get("game_name", current_event["game_name"])
        win = data.get("win", current_event["win"])

        # Add the updated event
        db.add_event(nickname, game_name, win, data["admin_passcode"])

        return jsonify({"message": "Event updated successfully"})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@db_api.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    """
    Delete an event.

    Args:
        event_id (int): ID of the event to delete

    Expected request body: {
        'admin_passcode': 'admin_passcode'  # Required for verification
    }

    Returns:
        JSON: Success message or errore
    """
    try:
        data = request.get_json()

        # Validate admin_passcode is provided
        if "admin_passcode" not in data:
            return jsonify({"error": "Admin passcode is required"}), 400

        # Delete the event
        if db.delete_event(event_id, data["admin_passcode"]):
            return jsonify({"message": "Event deleted successfully"})
        else:
            return jsonify({"error": "Event not found or invalid admin passcode"}), 404
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@db_api.route("/events/batch", methods=["POST"])
def add_events_batch():
    """
    Add multiple events with the same game and admin.

    Expected request body: {
        'nicknames': ['player1', 'player2', ...],
        'game_name': 'game_name',
        'wins': [true, false, ...],
        'admin_passcode': 'admin_passcode'
    }

    Returns:
        JSON: List of new event IDs or error message
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["nicknames", "game_name", "wins", "admin_passcode"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Validate data types
        if not isinstance(data["nicknames"], list):
            return jsonify({"error": "Nicknames must be a list"}), 400
        if not isinstance(data["game_name"], str):
            return jsonify({"error": "Game name must be a string"}), 400
        if not isinstance(data["wins"], list):
            return jsonify({"error": "Wins must be a list"}), 400
        if not isinstance(data["admin_passcode"], str):
            return jsonify({"error": "Admin passcode must be a string"}), 400

        # Validate list lengths
        if len(data["nicknames"]) != len(data["wins"]):
            return jsonify(
                {"error": "Nicknames and wins lists must have the same length"}
            ), 400

        # Validate all wins are booleans
        if not all(isinstance(win, bool) for win in data["wins"]):
            return jsonify({"error": "All values in wins list must be booleans"}), 400

        # Add the events batch
        events_added = db.add_events_batch(
            data["nicknames"], data["game_name"], data["wins"], data["admin_passcode"]
        )

        return jsonify({"count": events_added, "message": "Events added successfully"})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@db_api.route("/players/stats", methods=["POST"])
def get_player_stats():
    """
    Get total wins and losses for each nickname in the request.

    Expected request body: {
        'nicknames': ['player1', 'player2', ...]
    }

    Returns:
        JSON: Dictionary with nickname as key and stats as value
              Format: {nickname: {'wins': count, 'losses': count}}
    """
    try:
        data = request.get_json()

        # Validate required fields
        if "nicknames" not in data:
            return jsonify({"error": "Missing required field: nicknames"}), 400

        # Validate data types
        if not isinstance(data["nicknames"], list):
            return jsonify({"error": "Nicknames must be a list"}), 400

        # Validate list is not empty
        if not data["nicknames"]:
            return jsonify({"error": "Nicknames list cannot be empty"}), 400

        # Get player stats
        stats = db.get_player_stats(data["nicknames"])

        return jsonify({"stats": stats})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
