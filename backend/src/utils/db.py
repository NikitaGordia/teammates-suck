"""
Database module for SQLite support.
This module handles all database operations for the application.
"""

import sqlite3
import os
from pathlib import Path
import hashlib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database file path
DB_PATH = os.getenv("DB_PATH")
if DB_PATH:
    DB_FILE = Path(DB_PATH)
else:
    raise Exception("DB_PATH environment variable not set")


def get_db_connection(db_file: Path = DB_FILE):
    """
    Create a connection to the SQLite database.
    Returns:
        sqlite3.Connection: Database connection object
    """
    db_file.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_file)
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
                game_datetime DATETIME NOT NULL,
                game_name TEXT NOT NULL,
                win BOOLEAN NOT NULL,
                admin TEXT NOT NULL
            )
        """)

        # Create admins table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            hash TEXT NOT NULL
        )
        """)

        conn.commit()
        print(f"Database initialized at {DB_FILE}")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()


def verify_admin_credentials(admin_passcode):
    """
    Verify admin credentials in the format "admin_name:admin_password".

    Args:
        admin_passcode (str): Admin credentials in the format "admin_name:admin_password"

    Returns:
        tuple: (bool, int, str) - (is_valid, admin_id, error_message)
    """
    # Validate format
    if not admin_passcode or ":" not in admin_passcode:
        return False, None, "Admin passcode must be in format 'admin:password'"

    # Split the admin secret into name and password
    name, password = admin_passcode.split(":", 1)

    # Validate inputs
    if not name:
        return False, None, "Admin name cannot be empty"

    if not password:
        return False, None, "Admin password cannot be empty"

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Check if admin exists
        cursor.execute("SELECT hash, id FROM admins WHERE name = ?", (name,))
        result = cursor.fetchone()

        if not result:
            return False, None, f"Admin '{name}' not found"

        stored_hash = result["hash"]

        # Check if the stored hash contains a salt (format: hash:salt)
        if ":" in stored_hash:
            stored_password_hash, salt = stored_hash.split(":", 1)

            # Hash the provided password with the stored salt
            password_with_salt = password + salt
            provided_hash = hashlib.sha256(password_with_salt.encode()).hexdigest()

            # Compare the hashes
            if provided_hash != stored_password_hash:
                return False, None, "Invalid admin password"
        else:
            return False, None, "Admin password is not hashed correctly"

        return True, result["id"], ""
    except Exception as e:
        print(f"Error verifying admin credentials: {e}")
        return False, None, f"Error verifying admin credentials: {str(e)}"
    finally:
        conn.close()


def add_events_batch(nicknames, game_datetime, game_name, wins, admin_passcode):
    """
    Add multiple events with the same game and admin.

    Args:
        nicknames (list): List of player nicknames
        game_datetime (str): Datetime of the game (e.g., "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD")
        game_name (str): Name of the game in "TeamA|VS|TeamB" format
        wins (list): List of boolean values indicating win/loss for each player
        admin_passcode (str): Admin passcode

    Returns:
        int: Number of events added

    Raises:
        ValueError: If admin credentials are invalid or if lists have different lengths
    """
    if len(nicknames) != len(wins):
        raise ValueError("Length of nicknames and wins lists must match")

    is_valid, admin_id, error_message = verify_admin_credentials(admin_passcode)
    if not is_valid:
        raise ValueError(error_message)

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        batch_params = [
            (nickname, game_datetime, game_name, win, admin_id)
            for nickname, win in zip(nicknames, wins)
        ]

        cursor.executemany(
            "INSERT INTO events (nickname, game_datetime, game_name, win, admin) VALUES (?, ?, ?, ?, ?)",
            batch_params,
        )
        conn.commit()
        return len(batch_params)
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


def admin_exists(name):
    """
    Check if an admin with the given name already exists.

    Args:
        name (str): Admin name to check

    Returns:
        bool: True if admin exists, False otherwise
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM admins WHERE name = ?", (name,))
        result = cursor.fetchone()
        return result is not None
    except Exception as e:
        print(f"Error checking if admin exists: {e}")
        return False
    finally:
        conn.close()


def add_admin(name, saled_passcode_hash):
    """
    Add a new admin to the database.

    Args:
        name (str): Admin name
        saled_passcode_hash (str): Admin passcode hash (will be stored as is)

    Returns:
        int: ID of the newly created admin

    Raises:
        ValueError: If an admin with the same name already exists
    """
    # Check if admin already exists
    if admin_exists(name):
        raise ValueError(f"Admin with name '{name}' already exists")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO admins (name, hash) VALUES (?, ?)",
            (name, saled_passcode_hash),
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        print(f"Error adding admin: {e}")
        raise
    finally:
        conn.close()


def remove_admin_by_name(name):
    """
    Remove an admin from the database by name.

    Args:
        name (str): Admin name to remove

    Returns:
        bool: True if admin was removed, False if admin was not found
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Check if admin exists
        cursor.execute("SELECT * FROM admins WHERE name = ?", (name,))
        admin = cursor.fetchone()

        if not admin:
            return False

        # Delete the admin
        cursor.execute("DELETE FROM admins WHERE name = ?", (name,))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error removing admin: {e}")
        return False
    finally:
        conn.close()


def delete_user_events(nickname):
    """
    Delete all events for a specific user by nickname.

    Args:
        nickname (str): Nickname of the user whose events should be deleted

    Returns:
        int: Number of events deleted
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Get count of events to be deleted for return value
        cursor.execute("SELECT COUNT(*) FROM events WHERE nickname = ?", (nickname,))
        events_count = cursor.fetchone()[0]

        if events_count == 0:
            # No events found for this nickname
            return 0

        # Delete all events for the specified nickname
        cursor.execute("DELETE FROM events WHERE nickname = ?", (nickname,))
        conn.commit()

        return events_count
    except Exception as e:
        conn.rollback()
        print(f"Error deleting user events: {e}")
        return -1
    finally:
        conn.close()


# Initialize the database when the module is imported
init_db()
