import argparse
from pathlib import Path
import re
import sqlite3
from utils.db import get_db_connection


def parse_and_transform_game_name(old_game_name):
    """
    Parses the old game_name format "YYYY-MM-DD-TeamAvsTeamB"
    and returns (game_datetime_str, new_game_name_str).
    New game_name format: "TeamA|VS|TeamB"
    """
    # Regex to capture date and the rest of the string
    # Example: "2025-04-27-Art,Alex_53vsAowe,Kibarov"
    # date_part: "2025-04-27"
    # teams_part_str: "Art,Alex_53vsAowe,Kibarov"
    date_match = re.match(r"(\d{4}-\d{2}-\d{2})-(.*)", old_game_name)

    if not date_match:
        print(
            f"WARNING: Could not parse date from game_name: '{old_game_name}'. Skipping transformation for this entry."
        )
        # Return None for date, and original game_name for new_game_name to avoid data loss,
        # or decide on a specific error handling (e.g., (None, None) and skip update)
        return None, old_game_name

    game_datetime_str = date_match.group(1)  # "YYYY-MM-DD"
    teams_part_str = date_match.group(2)

    # Split the teams part by 'vs' (case-insensitive)
    # Example: "Art,Alex_53vsAowe,Kibarov" -> ["Art,Alex_53", "Aowe,Kibarov"]
    team_components = re.split(r"vs", teams_part_str, maxsplit=1, flags=re.IGNORECASE)

    if len(team_components) == 2:
        team_a = team_components[0]
        team_b = team_components[1]
        new_game_name = f"{team_a}|VS|{team_b}"
    else:
        # 'vs' not found, or teams_part_str was empty or malformed.
        # Keep the original teams part as the new game_name, without "|VS|".
        print(
            f"WARNING: 'vs' separator not found in teams part: '{teams_part_str}' (from original: '{old_game_name}'). Storing teams part as is."
        )
        new_game_name = teams_part_str  # Fallback to the part after date

    return game_datetime_str, new_game_name


def run_migration(db_path: Path):
    """
    Performs the database schema alteration and data migration.
    """
    print("Starting database migration...")
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    try:
        # 1. Add the new game_datetime column
        #    This will be NULL for all existing rows initially.
        print("Step 1: Adding 'game_datetime' column to 'events' table...")
        try:
            cursor.execute("ALTER TABLE events ADD COLUMN game_datetime DATETIME")
            print("'game_datetime' column added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("'game_datetime' column already exists. Skipping add.")
            else:
                raise  # Re-raise other operational errors

        # 2. Fetch all existing events
        print("\nStep 2: Fetching existing events for transformation...")
        cursor.execute("SELECT id, game_name FROM events")
        events_to_migrate = cursor.fetchall()
        print(f"Found {len(events_to_migrate)} events to process.")

        # 3. Iterate, transform, and update each event
        print(
            "\nStep 3: Transforming 'game_name' and populating 'game_datetime' and replacing admin hash with admin ID..."
        )
        updated_count = 0
        skipped_count = 0
        for event_row in events_to_migrate:
            event_id = event_row["id"]
            old_game_name = event_row["game_name"]

            # Check if this row might have been partially migrated (e.g. if script is re-run)
            # A simple check could be if new_game_name is already in the new format.
            # For robustness, you might add a flag or check if game_datetime is already NOT NULL.
            # For this example, we assume we process based on old_game_name format.

            game_datetime, new_game_name = parse_and_transform_game_name(old_game_name)

            if game_datetime is None and new_game_name == old_game_name:
                # Parsing failed to extract date, likely an issue with this specific row's format
                print(
                    f"  Skipping event ID {event_id} due to parsing issue with game_name: '{old_game_name}'"
                )
                skipped_count += 1
                continue

            # Update the row
            # If game_datetime is None here, it means date parsing failed for a row that was not purely an unparsable string.
            # You might want to handle this by setting a default date or logging more critically.
            # For now, it will insert NULL if game_datetime is None from parse function.
            cursor.execute(
                "UPDATE events SET game_datetime = ?, game_name = ? WHERE id = ?",
                (game_datetime, new_game_name, event_id),
            )
            updated_count += 1
            if updated_count % 100 == 0:
                print(f"  Processed {updated_count} events...")

        conn.commit()
        print(
            f"\nTransformation complete. Updated {updated_count} events. Skipped {skipped_count} events."
        )

        # Optional: Add an index on the new game_datetime column if you query by it often
        # print("\nStep 4: Adding index on 'game_datetime'...")
        # try:
        #     cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_game_datetime ON events (game_datetime)")
        #     print("Index on 'game_datetime' created or already exists.")
        # except Exception as e:
        #     print(f"Could not create index: {e}")
        # conn.commit()

        print("\nMigration finished successfully!")

    except Exception as e:
        conn.rollback()
        print(f"ERROR: Migration failed: {e}")
        import traceback

        traceback.print_exc()
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--db", help="Path to the database file")
    args = parser.parse_args()
    db_path = Path(args.db)
    print(f"Migrating database: {db_path}")

    run_migration(db_path)
