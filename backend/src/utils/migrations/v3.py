import argparse
from pathlib import Path
import sqlite3


def refactor_user_schema(db_path: str):
    """
    Refactors the database schema to move user nicknames into a separate 'players' table.

    This function performs the following actions within a single transaction:
    1. Creates the 'players' table with a unique constraint on the nickname.
    2. Populates the 'players' table with unique nicknames from the 'events' table.
    3. Creates a new 'events_new' table with a 'player_id' foreign key.
    4. Copies data from the old 'events' table to the new one, mapping nicknames to player IDs.
    5. Drops the old 'events' table.
    6. Renames 'events_new' to 'events'.

    Args:
        db_path: The file path to the SQLite database.
    """
    connection = None
    try:
        # Connect to the SQLite database
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        # Start a transaction
        cursor.execute("BEGIN TRANSACTION;")

        # 1. Create the new 'players' table
        print("Creating 'players' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nickname TEXT NOT NULL UNIQUE
            )
        """)

        # 2. Populate 'players' table with unique nicknames from the 'events' table
        print("Populating 'players' table...")
        cursor.execute("""
            INSERT OR IGNORE INTO players (nickname)
            SELECT DISTINCT nickname FROM events;
        """)

        # 3. Create a temporary 'events_new' table with the new schema
        print("Creating temporary 'events_new' table...")
        cursor.execute("""
            CREATE TABLE events_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER NOT NULL,
                game_datetime DATETIME NOT NULL,
                game_name TEXT NOT NULL,
                win BOOLEAN NOT NULL,
                admin TEXT NOT NULL,
                FOREIGN KEY (player_id) REFERENCES players (id)
            )
        """)

        # 4. Copy data from the old table to the new one, replacing nickname with player_id
        print("Migrating data to the new events table...")
        cursor.execute("""
            INSERT INTO events_new (id, player_id, game_datetime, game_name, win, admin)
            SELECT
                e.id,
                p.id,
                e.game_datetime,
                e.game_name,
                e.win,
                e.admin
            FROM
                events AS e
            JOIN
                players AS p ON e.nickname = p.nickname;
        """)

        # 5. Drop the old 'events' table
        print("Dropping old 'events' table...")
        cursor.execute("DROP TABLE events;")

        # 6. Rename the new table to 'events'
        print("Renaming 'events_new' to 'events'...")
        cursor.execute("ALTER TABLE events_new RENAME TO events;")

        # Commit the transaction
        connection.commit()
        print("\n✅ Schema migration completed successfully!")

    except sqlite3.Error as e:
        if connection:
            connection.rollback()
        print(f"❌ An error occurred: {e}")
        print("Transaction has been rolled back.")

    finally:
        if connection:
            connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--db", help="Path to the database file")
    args = parser.parse_args()
    db_path = Path(args.db)
    print(f"Migrating database: {db_path}")

    refactor_user_schema(db_path)
