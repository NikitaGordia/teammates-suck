"""
Database module for SQLite support.
This module handles all database operations for the application.
"""

import sqlite3
import os
from pathlib import Path
import hashlib


# Database file path
DB_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
DB_FILE = DB_DIR / "database.sqlite"


def get_db_connection():
    """
    Create a connection to the SQLite database.
    Returns:
        sqlite3.Connection: Database connection object
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn


def init_db():
    """
    Initialize the database by creating necessary tables if they don't exist.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Create events table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            game_name TEXT NOT NULL,
            win BOOLEAN NOT NULL,
            admin TEXT NOT NULL
        )
        """)

        conn.commit()
        print(f"Database initialized at {DB_FILE}")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()


def hash_passcode(passcode):
    """
    Create a hash of the admin passcode.

    Args:
        passcode (str): The admin passcode to hash

    Returns:
        str: Hashed passcode
    """
    return hashlib.sha256(passcode.encode()).hexdigest()


def add_event(nickname, game_name, win, admin_passcode):
    """
    Add a new event to the database.

    Args:
        nickname (str): Player's nickname
        game_name (str): Name of the game
        win (bool): True if the player won, False if they lost
        admin_passcode (str): Admin passcode (will be hashed)

    Returns:
        int: ID of the newly created event
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        admin_hash = hash_passcode(admin_passcode)

        cursor.execute(
            "INSERT INTO events (nickname, game_name, win, admin) VALUES (?, ?, ?, ?)",
            (nickname, game_name, win, admin_hash),
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        print(f"Error adding event: {e}")
        raise
    finally:
        conn.close()


def get_events(admin_passcode=None):
    """
    Get all events from the database.

    Args:
        admin_passcode (str, optional): If provided, only return events with matching admin hash

    Returns:
        list: List of events as dictionaries
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        if admin_passcode:
            admin_hash = hash_passcode(admin_passcode)
            cursor.execute("SELECT * FROM events WHERE admin = ?", (admin_hash,))
        else:
            cursor.execute("SELECT * FROM events")

        events = [dict(row) for row in cursor.fetchall()]
        return events
    except Exception as e:
        print(f"Error getting events: {e}")
        return []
    finally:
        conn.close()


def get_event_by_id(event_id):
    """
    Get a specific event by ID.

    Args:
        event_id (int): ID of the event to retrieve

    Returns:
        dict: Event data or None if not found
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        event = cursor.fetchone()

        if event:
            return dict(event)
        return None
    except Exception as e:
        print(f"Error getting event by ID: {e}")
        return None
    finally:
        conn.close()


def update_event(
    event_id, nickname=None, game_name=None, win=None, admin_passcode=None
):
    """
    Update an existing event.

    Args:
        event_id (int): ID of the event to update
        nickname (str, optional): New nickname
        game_name (str, optional): New game name
        win (bool, optional): New win status
        admin_passcode (str, optional): New admin passcode

    Returns:
        bool: True if update was successful, False otherwise
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Get current event data
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        event = cursor.fetchone()

        if not event:
            return False

        # Prepare update data
        update_data = {}
        if nickname is not None:
            update_data["nickname"] = nickname
        if game_name is not None:
            update_data["game_name"] = game_name
        if win is not None:
            update_data["win"] = win
        if admin_passcode is not None:
            update_data["admin"] = hash_passcode(admin_passcode)

        if not update_data:
            return True  # Nothing to update

        # Build the SQL query
        set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
        values = list(update_data.values())
        values.append(event_id)

        cursor.execute(f"UPDATE events SET {set_clause} WHERE id = ?", values)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error updating event: {e}")
        return False
    finally:
        conn.close()


def delete_event(event_id, admin_passcode):
    """
    Delete an event from the database.

    Args:
        event_id (int): ID of the event to delete
        admin_passcode (str): Admin passcode for verification

    Returns:
        bool: True if deletion was successful, False otherwise
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        admin_hash = hash_passcode(admin_passcode)

        # Verify admin passcode matches the event
        cursor.execute(
            "SELECT * FROM events WHERE id = ? AND admin = ?", (event_id, admin_hash)
        )
        event = cursor.fetchone()

        if not event:
            return False

        cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error deleting event: {e}")
        return False
    finally:
        conn.close()


def add_events_batch(nicknames, game_name, wins, admin_passcode):
    """
    Add multiple events with the same game and admin.

    Args:
        nicknames (list): List of player nicknames
        game_name (str): Name of the game
        wins (list): List of boolean values indicating win/loss for each player
        admin_passcode (str): Admin passcode (will be hashed)

    Returns:
        int: Number of events added
    """
    if len(nicknames) != len(wins):
        raise ValueError("Length of nicknames and wins lists must match")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        admin_hash = hash_passcode(admin_passcode)

        # Prepare batch parameters
        batch_params = [
            (nickname, game_name, win, admin_hash)
            for nickname, win in zip(nicknames, wins)
        ]

        # Use executemany for better performance with a single SQL statement
        cursor.executemany(
            "INSERT INTO events (nickname, game_name, win, admin) VALUES (?, ?, ?, ?)",
            batch_params,
        )

        conn.commit()
        return len(batch_params)  # Return the number of events added
    except Exception as e:
        conn.rollback()
        print(f"Error adding batch events: {e}")
        raise
    finally:
        conn.close()


def get_player_stats(nicknames):
    """
    Get total wins and losses for each nickname in the request.

    Args:
        nicknames (list): List of player nicknames to get stats for

    Returns:
        dict: Dictionary with nickname as key and stats as value
              Format: {nickname: {'wins': count, 'losses': count}}
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        result = {}

        # Use placeholders for the IN clause
        placeholders = ", ".join(["?"] * len(nicknames))
        query = f"""
            SELECT nickname,
                   SUM(CASE WHEN win = 1 THEN 1 ELSE 0 END) as wins,
                   SUM(CASE WHEN win = 0 THEN 1 ELSE 0 END) as losses
            FROM events
            WHERE nickname IN ({placeholders})
            GROUP BY nickname
        """

        cursor.execute(query, nicknames)

        # Process results
        for row in cursor.fetchall():
            result[row["nickname"]] = {
                "wins": row["wins"] or 0,  # Handle NULL values
                "losses": row["losses"] or 0,
            }

        # Add entries with zero stats for nicknames not found in the database
        for nickname in nicknames:
            if nickname not in result:
                result[nickname] = {"wins": 0, "losses": 0}

        return result
    except Exception as e:
        print(f"Error getting player stats: {e}")
        return {nickname: {"wins": 0, "losses": 0} for nickname in nicknames}
    finally:
        conn.close()


# Initialize the database when the module is imported
init_db()
