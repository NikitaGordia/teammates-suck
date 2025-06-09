#!/usr/bin/env python3
"""
Script to manage user data in the database.
This script can clean history (wins and losses) for a specific user by nickname.

For cleaning user history:
    - Accepts a nickname
    - Deletes all events for the specified nickname
    - Returns the number of events deleted

Usage:
    python user.py clean "nickname"

Environment Variables:
    DB_PATH: Path to the SQLite database file
"""

import typer

from utils import db as db_utils

db = db_utils.Database()
app = typer.Typer(help="Manage user data in the database")


def clean_user_history(nickname):
    """Clean history (wins and losses) for a specific user by nickname."""
    try:
        # Clean user history
        events_deleted = db.delete_user_events(nickname)
        return events_deleted
    except Exception as e:
        typer.echo(f"Error: {e}")
        raise typer.Exit(code=1)


@app.command()
def clean(
    nickname: str = typer.Argument(
        ..., help="Nickname of the user to clean history for"
    ),
):
    events_deleted = clean_user_history(nickname)
    if events_deleted == 0:
        typer.echo(f"No events found for user '{nickname}'")
    else:
        typer.echo(
            f"Successfully deleted {events_deleted} events for user '{nickname}'"
        )


if __name__ == "__main__":
    app()
