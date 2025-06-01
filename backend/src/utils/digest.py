from datetime import datetime
import json
import os
from pathlib import Path
import sqlite3
from dotenv import load_dotenv
import typer
import matplotlib.pyplot as plt
import subprocess
import pandas as pd

from utils.dates import get_last_month_date_range
from utils.user import clean_user_history
from utils.spreadsheet import SCORES, SheetScoreFetcher

from utils import db


app = typer.Typer(help="Generate monthly digests")


def get_top_active_players(start_date_str, end_date_str, top_n=10):
    """
    Retrieves the top N active players based on event attendance between specific dates.

    "Activity" is determined by the number of events a player (nickname) has attended.

    Args:
        start_date_str (str): The start date of the period (inclusive), formatted as 'YYYY-MM-DD'.
        end_date_str (str): The end date of the period (inclusive), formatted as 'YYYY-MM-DD'.
        top_n (int): The number of top players to return. Defaults to 10.

    Returns:
        list: A list of dictionaries, where each dictionary contains
              'nickname' and 'event_count'. Returns an empty list if no
              players are found or an error occurs.
              Example: [{'nickname': 'PlayerA', 'event_count': 15}, ...]
    """
    if not (isinstance(start_date_str, str) and isinstance(end_date_str, str)):
        print("Error: Start and end dates must be strings in 'YYYY-MM-DD' format.")
        return []
    if not isinstance(top_n, int) or top_n <= 0:
        print("Error: top_n must be a positive integer.")
        return []

    # Adjust date strings to cover the full day for DATETIME comparisons
    # Assumes game_datetime in the 'events' table stores full timestamp information.
    # If game_datetime only stores dates, these adjustments might not be necessary,
    # and you could use DATE(game_datetime) in the query.
    query_start_datetime = f"{start_date_str} 00:00:00"
    query_end_datetime = f"{end_date_str} 23:59:59"

    conn = None  # Initialize conn to None for robust error handling in finally block
    results = []
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()

        sql_query = """
            SELECT
                nickname,
                COUNT(id) as event_count
            FROM
                events
            WHERE
                game_datetime BETWEEN ? AND ?
            GROUP BY
                nickname
            ORDER BY
                event_count DESC
            LIMIT ?
        """
        cursor.execute(sql_query, (query_start_datetime, query_end_datetime, top_n))

        rows = cursor.fetchall()
        for row in rows:
            results.append(
                {"nickname": row["nickname"], "game_count": row["event_count"]}
            )

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        # Potentially log the error to a file or monitoring system in a real application
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()

    return results


def get_top_admins_by_contribution(start_date_str=None, end_date_str=None, top_n=10):
    """
    Retrieves the top N admins based on the number of distinct games they are
    associated with (i.e., for which they recorded events).
    Assumes 'events.admin' stores the admin's ID as a TEXT string.

    Args:
        start_date_str (str, optional): Start date of the period (YYYY-MM-DD).
        end_date_str (str, optional): End date of the period (YYYY-MM-DD).
        top_n (int): The number of top admins to return. Defaults to 10.

    Returns:
        list: A list of dictionaries, where each dictionary contains
              'admin_name' and 'distinct_games_count'.
              Example: [{'admin_name': 'AdminX', 'distinct_games_count': 15}, ...]
              Returns an empty list on error or if no data.
    """
    if not isinstance(top_n, int) or top_n <= 0:
        print("Error: top_n must be a positive integer.")
        return []

    # SQL query now counts distinct game names for contribution
    base_sql = """
        SELECT
            a.name AS admin_name,
            COUNT(DISTINCT e.game_name || '|' || e.game_datetime) AS distinct_games_count
        FROM
            events e
        JOIN
            admins a ON e.admin = CAST(a.id AS TEXT)
    """
    # The join condition e.admin = CAST(a.id AS TEXT) assumes events.admin stores
    # the admin ID as a string, matching the text representation of admins.id.

    final_query_parts = [base_sql]
    final_params = []

    # Add date range filtering if specified
    date_where_clause, date_params = db._build_date_range_clause(
        start_date_str, end_date_str
    )
    if date_where_clause:  # date_where_clause is empty or starts with " WHERE "
        final_query_parts.append(date_where_clause)
        final_params.extend(date_params)

    # Add GROUP BY, ORDER BY, and LIMIT clauses
    # Order by the new count alias 'distinct_games_count'
    final_query_parts.append("""
        GROUP BY
            a.name
        ORDER BY
            distinct_games_count DESC
        LIMIT ?
    """)
    final_params.append(top_n)

    sql_query = " ".join(final_query_parts)

    conn = None
    results = []
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(final_params))  # Ensure params is a tuple
        rows = cursor.fetchall()
        for row in rows:
            results.append(
                {
                    "admin_name": row["admin_name"],
                    "distinct_games_count": row["distinct_games_count"],  # Updated key
                }
            )
    except sqlite3.Error as e:
        print(f"Database error in get_top_admins_by_contribution: {e}")
    except Exception as e:
        print(f"An unexpected error occurred in get_top_admins_by_contribution: {e}")
    finally:
        if conn:
            conn.close()

    return results


def get_all_unique_games(start_date_str=None, end_date_str=None):
    """
    Retrieves all unique game events, including game name, datetime,
    and admin name.
    Assumes 'events.admin' stores the admin's ID as a TEXT string
    and 'events.event_date' stores the datetime.

    Args:
        start_date_str (str, optional): Start date of the period (YYYY-MM-DD).
        end_date_str (str, optional): End date of the period (YYYY-MM-DD).

    Returns:
        list: A list of dictionaries, where each dictionary contains
              'game_name', 'datetime', and 'admin_name'.
              Example: [{'game_name': 'GameA', 'datetime': '2024-05-26 10:00:00',
                         'admin_name': 'AdminX'}, ...]
              Returns an empty list on error or if no data.
    """
    # *** Assumption: The datetime column in 'events' is named 'event_date'. ***
    # Using DISTINCT to ensure each row (game, datetime, admin) is unique.
    base_sql = """
        SELECT DISTINCT
            e.game_name,
            e.game_datetime,
            a.name AS admin_name
        FROM
            events e
        JOIN
            admins a ON e.admin = CAST(a.id AS TEXT)
    """

    final_query_parts = [base_sql]
    final_params = []

    # Add date range filtering if specified
    # Ensure the date column name matches your schema ('e.event_date' used here)
    date_where_clause, date_params = db._build_date_range_clause(
        start_date_str, end_date_str
    )
    if date_where_clause:
        final_query_parts.append(date_where_clause)
        final_params.extend(date_params)

    # Add an ORDER BY clause for predictable results
    final_query_parts.append("""
        ORDER BY
            e.game_datetime DESC
    """)

    sql_query = " ".join(final_query_parts)

    conn = None
    results = []
    try:
        conn = db.get_db_connection()
        if not conn:
            return []  # Return empty if connection fails

        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(final_params))
        rows = cursor.fetchall()
        for row in rows:
            # Convert row object to dictionary
            results.append(dict(row))
    except sqlite3.Error as e:
        print(f"Database error in get_all_unique_games: {e}")
    except Exception as e:
        print(f"An unexpected error occurred in get_all_unique_games: {e}")
    finally:
        if conn:
            conn.close()

    return results


def get_game_activity_by_hour(start_date_str=None, end_date_str=None):
    """
    Aggregates counts of distinct games played by hour of the day (00-23).

    Args:
        start_date_str (str, optional): Start date 'YYYY-MM-DD'. Defaults to None (no start limit).
        end_date_str (str, optional): End date 'YYYY-MM-DD'. Defaults to None (no end limit).

    Returns:
        list: List of dicts [{'hour_of_day': 'HH', 'game_count': N}],
              covering all 24 hours. Returns empty list on database error.
    """
    hourly_activity = [{"hour_of_day": f"{h:02d}", "game_count": 0} for h in range(24)]

    base_sql = "SELECT strftime('%H', game_datetime) as hour_str, COUNT(DISTINCT game_name || '|' || game_datetime) as game_count FROM events"

    where_clause, params = db._build_date_range_clause(start_date_str, end_date_str)
    sql_query = base_sql + where_clause + " GROUP BY hour_str ORDER BY hour_str"

    conn = None
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, params)
        rows = cursor.fetchall()

        # Create a dictionary for quick lookup from DB results
        db_results = {row["hour_str"]: row["game_count"] for row in rows}

        # Update the initialized list with counts from the database
        for item in hourly_activity:
            if item["hour_of_day"] in db_results:
                item["game_count"] = db_results[item["hour_of_day"]]

    except sqlite3.Error as e:
        print(f"Database error in get_game_activity_by_hour: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error in get_game_activity_by_hour: {e}")
        return []
    finally:
        if conn:
            conn.close()

    return hourly_activity


def get_game_activity_by_day_of_week(
    start_date_str=None, end_date_str=None, hours_shift=0
):
    """
    Aggregates counts of distinct games played by day of the week (Sunday-Saturday),
    allowing for a shift in the start hour of each day.

    Args:
        start_date_str (str, optional): Start date 'YYYY-MM-DD'. Defaults to None.
        end_date_str (str, optional): End date 'YYYY-MM-DD'. Defaults to None.
        hours_shift (int, optional): Number of hours to shift the start of the day.
                                     For example, hours_shift=4 means a "day" runs from
                                     04:00:00 to 03:59:59 of the next calendar day.
                                     Defaults to 0 (no shift, day starts at 00:00:00).

    Returns:
        list: List of dicts [{'day_numeric': D, 'day_name': 'Name', 'game_count': N}],
              for all 7 days. Returns empty list on database error.
              (0=Sunday, 1=Monday, ..., 6=Saturday)
    """
    day_names = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ]
    weekly_activity = [
        {"day_numeric": i, "day_name": day_names[i], "game_count": 0} for i in range(7)
    ]

    # Prepare the time shift modifier for the SQL query.
    # This will be a string like '-4 hours'.
    # int() conversion ensures hours_shift is treated as a number.
    time_shift_modifier = f"-{int(hours_shift)} hours"

    # The first '?' in the SELECT clause is for the time_shift_modifier.
    # We adjust game_datetime by subtracting 'hours_shift' hours before determining its day of the week.
    base_sql = "SELECT strftime('%w', datetime(game_datetime, ?)) as day_w_str, COUNT(DISTINCT game_name || '|' || game_datetime) as game_count FROM events"

    # The _build_date_range_clause filters on the original, unshifted game_datetime.
    # Its parameters will follow the time_shift_modifier parameter.
    where_clause, date_filter_params = db._build_date_range_clause(
        start_date_str, end_date_str
    )
    # If your _build_date_range_clause might need the column name:
    # where_clause, date_filter_params = db._build_date_range_clause(start_date_str, end_date_str, datetime_column_name='game_datetime')

    sql_query = base_sql + where_clause + " GROUP BY day_w_str ORDER BY day_w_str"

    # The first parameter in final_params corresponds to the '?' in datetime(game_datetime, ?).
    # The subsequent parameters (date_filter_params) correspond to '?'s in the where_clause.
    final_params = [time_shift_modifier] + date_filter_params

    print(sql_query, final_params)

    conn = None
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, final_params)
        rows = cursor.fetchall()

        db_results = {int(row["day_w_str"]): row["game_count"] for row in rows}

        for item in weekly_activity:
            if item["day_numeric"] in db_results:
                item["game_count"] = db_results[item["day_numeric"]]

    except sqlite3.Error as e:
        print(f"Database error in get_game_activity_by_day_of_week: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error in get_game_activity_by_day_of_week: {e}")
        return []
    finally:
        if conn:
            conn.close()

    return weekly_activity


def get_game_activity_by_day_of_month(
    start_date_str=None, end_date_str=None, hours_shift=0
):
    """
    Aggregates counts of distinct games played by day of the month (01-31),
    allowing for a shift in the start hour of each day.
    This function groups activity for the Nth day across all months in the selected period.

    Args:
        start_date_str (str, optional): Start date 'YYYY-MM-DD'. Defaults to None.
        end_date_str (str, optional): End date 'YYYY-MM-DD'. Defaults to None.
        hours_shift (int, optional): Number of hours to shift the start of the day.
                                     For example, hours_shift=4 means a "day" (e.g., the 15th)
                                     runs from 04:00:00 on the 15th to 03:59:59 on the 16th.
                                     Defaults to 0 (no shift, day starts at 00:00:00).

    Returns:
        list: List of dicts [{'day_of_month': 'DD', 'game_count': N}],
              for all 31 potential days (01-31). Returns empty list on database error.
    """
    monthly_activity_by_day = [
        {"day_of_month": f"{d:02d}", "game_count": 0} for d in range(1, 32)
    ]

    # Prepare the time shift modifier for the SQL query.
    time_shift_modifier = f"-{int(hours_shift)} hours"

    # The first '?' in the SELECT clause is for the time_shift_modifier.
    # We adjust game_datetime by subtracting 'hours_shift' hours before extracting the day of the month.
    base_sql = "SELECT strftime('%d', datetime(game_datetime, ?)) as day_m_str, COUNT(DISTINCT game_name || '|' || game_datetime) as game_count FROM events"

    # The _build_date_range_clause filters on the original, unshifted game_datetime.
    where_clause, date_filter_params = db._build_date_range_clause(
        start_date_str, end_date_str
    )
    # If your _build_date_range_clause might need the column name:
    # where_clause, date_filter_params = db._build_date_range_clause(start_date_str, end_date_str, datetime_column_name='game_datetime')

    sql_query = base_sql + where_clause + " GROUP BY day_m_str ORDER BY day_m_str"

    # The first parameter in final_params corresponds to the '?' in datetime(game_datetime, ?).
    # The subsequent parameters (date_filter_params) correspond to '?'s in the where_clause.
    final_params = [time_shift_modifier] + date_filter_params

    conn = None
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, final_params)
        rows = cursor.fetchall()

        # Results from DB will have day_m_str as strings like '01', '02', ..., '31'
        db_results = {row["day_m_str"]: row["game_count"] for row in rows}

        for item in monthly_activity_by_day:
            # item["day_of_month"] is also '01', '02', ...
            if item["day_of_month"] in db_results:
                item["game_count"] = db_results[item["day_of_month"]]

    except sqlite3.Error as e:
        print(f"Database error in get_game_activity_by_day_of_month: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error in get_game_activity_by_day_of_month: {e}")
        return []
    finally:
        if conn:
            conn.close()

    return monthly_activity_by_day


def get_player_promotion_demotion_candidates(
    min_games_threshold: int,
    promotion_win_rate_pct: float,  # e.g., 60.0 for 60%
    demotion_win_rate_pct: float,  # e.g., 40.0 for 40%
    start_date_str: str = None,
    end_date_str: str = None,
):
    """
    Identifies players eligible for promotion or demotion based on their game statistics.

    Args:
        min_games_threshold (int): Minimum number of games a player must have played.
        promotion_win_rate_pct (float): Win rate percentage above which a player is promoted.
        demotion_win_rate_pct (float): Win rate percentage below which a player is demoted.
        start_date_str (str, optional): Start date for calculating stats (YYYY-MM-DD).
                                        If None, considers all-time stats.
        end_date_str (str, optional): End date for calculating stats (YYYY-MM-DD).
                                      If None, considers all-time stats.

    Returns:
        list: A list of dictionaries for players needing promotion or demotion.
              Each dictionary contains:
              - 'nickname' (str)
              - 'total_games_played' (int)
              - 'wins' (int)
              - 'losses' (int)
              - 'win_rate_percentage' (float, rounded to 2 decimal places)
              - 'status' (str: "Promote" or "Demote")
              Returns an empty list if no players meet the criteria or an error occurs.
    """

    if not (isinstance(min_games_threshold, int) and min_games_threshold >= 0):
        print("Error: min_games_threshold must be a non-negative integer.")
        return []
    if not (
        isinstance(promotion_win_rate_pct, (int, float))
        and 0 <= promotion_win_rate_pct <= 100
    ):
        print("Error: promotion_win_rate_pct must be between 0 and 100.")
        return []
    if not (
        isinstance(demotion_win_rate_pct, (int, float))
        and 0 <= demotion_win_rate_pct <= 100
    ):
        print("Error: demotion_win_rate_pct must be between 0 and 100.")
        return []
    if promotion_win_rate_pct <= demotion_win_rate_pct:
        print(
            "Warning: promotion_win_rate_pct should ideally be greater than demotion_win_rate_pct."
        )
        # Allow processing to continue, but this setup might be illogical.

    load_dotenv()
    fetcher = SheetScoreFetcher(
        os.getenv("GOOGLE_API_KEY"), os.getenv("SPREADSHEET_ID")
    )
    scores = fetcher.fetch_all_scores()

    # SQL to get total games and wins per player
    # Assumes 'win' column in 'events' is 1 for TRUE (win) and 0 for FALSE (loss)
    base_sql = """
        SELECT
            nickname,
            COUNT(id) AS total_games,
            SUM(CASE WHEN win = 1 THEN 1 ELSE 0 END) AS total_wins
        FROM
            events
    """

    final_query_parts = [base_sql]
    params = []

    # Add date range filtering if specified.
    # For this query, game_datetime doesn't need a table alias if 'events' is the only table.
    date_where_clause, date_params = db._build_date_range_clause(
        start_date_str, end_date_str
    )
    if date_where_clause:
        final_query_parts.append(date_where_clause)
        params.extend(date_params)

    final_query_parts.append("GROUP BY nickname")
    sql_query = " ".join(final_query_parts)

    conn = None
    players_for_status_change = []
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(params))
        player_stats = cursor.fetchall()

        for row in player_stats:
            nickname = row["nickname"]
            total_games = int(row["total_games"])
            # SUM can return None if no rows match, but GROUP BY ensures rows exist for players.
            # However, if all 'win' values for a player were NULL (not possible with BOOLEAN NOT NULL),
            # SUM could be NULL. With 0/1, SUM(0) is 0.
            total_wins = int(row["total_wins"] if row["total_wins"] is not None else 0)

            if total_games >= min_games_threshold:
                win_rate_percentage = 0.0
                if (
                    total_games > 0
                ):  # Avoid division by zero, though SQL ensures total_games > 0 for rows from query
                    win_rate_percentage = (total_wins / total_games) * 100.0

                status = "Maintain"  # Default status
                if win_rate_percentage > promotion_win_rate_pct:
                    status = "Promote"
                elif win_rate_percentage < demotion_win_rate_pct:
                    status = "Demote"

                # Only include players who need promotion or demotion
                if status == "Promote" or status == "Demote":
                    score = scores.get(nickname, None)
                    if score:
                        ix = SCORES.index(score)
                        new_ix = ix + (1 if status == "Promote" else -1)
                        new_score = SCORES[new_ix]
                    else:
                        continue  # Skip players without a score

                    players_for_status_change.append(
                        {
                            "nickname": nickname,
                            "total_games_played": total_games,
                            "wins": total_wins,
                            "losses": total_games - total_wins,
                            "win_rate_percentage": round(win_rate_percentage, 2),
                            "status": status,
                            "current_score": score,
                            "new_score": new_score,
                        }
                    )

    except sqlite3.Error as e:
        print(f"Database error in get_player_promotion_demotion_candidates: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()

    return players_for_status_change


def get_digest_dir(start_date_str, end_date_str):
    digest_path = Path(os.getenv("DIGEST_PATH"))
    path = digest_path / f"{start_date_str}_to_{end_date_str}"
    path.mkdir(exist_ok=True, parents=True)

    return path


def plot_top_players(data, directory, start_date, end_date):
    if not data:
        print("No top players data to plot.")
        return

    nicknames = [item["nickname"] for item in data]
    # Assuming 'event_count' is the key for counts.
    # Change to 'distinct_game_count' if that's what your function returns.
    counts = [item["game_count"] for item in data]

    # For horizontal bar chart, reverse the lists so the top player is at the top
    nicknames.reverse()
    counts.reverse()

    plt.figure(
        figsize=(10, max(6, len(nicknames) * 0.5))
    )  # Adjust height based on number of players
    plt.barh(nicknames, counts, color="teal")
    plt.xlabel("Number of Events")  # Or "Number of Distinct Games"
    plt.ylabel("Player Nickname")
    plt.title(f"Top Active Players ({start_date} to {end_date})")
    plt.tight_layout()  # Adjust layout to make room for labels

    filepath = os.path.join(directory, "top_players.png")
    try:
        plt.savefig(filepath)
        print(f"Saved top players plot to {filepath}")
    except Exception as e:
        print(f"Error saving top players plot: {e}")
    plt.close()


def plot_hourly_activity(data, directory, start_date, end_date):
    if not data:
        print("No hourly activity data to plot.")
        return

    hours = [item["hour_of_day"] for item in data]
    counts = [item["game_count"] for item in data]  # Assuming 'event_count'

    plt.figure(figsize=(12, 6))
    plt.bar(hours, counts, color="skyblue")
    plt.xlabel("Hour of Day")
    plt.ylabel("Number of Games")  # Or "Number of Distinct Games"
    plt.title(f"Hourly Game Activity ({start_date} to {end_date})")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    filepath = os.path.join(directory, "hourly_activity.png")
    try:
        plt.savefig(filepath)
        print(f"Saved hourly activity plot to {filepath}")
    except Exception as e:
        print(f"Error saving hourly activity plot: {e}")
    plt.close()


def plot_weekly_activity(data, directory, start_date, end_date):
    if not data:
        print("No weekly activity data to plot.")
        return

    # Assumes data is sorted by day_numeric (0=Sunday to 6=Saturday)
    day_names = [item["day_name"] for item in data]
    counts = [item["game_count"] for item in data]  # Assuming 'event_count'

    plt.figure(figsize=(10, 6))
    plt.bar(day_names, counts, color="lightgreen")
    plt.xlabel("Day of the Week")
    plt.ylabel("Number of Games")  # Or "Number of Distinct Games"
    plt.title(f"Weekly Game Activity ({start_date} to {end_date})")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    filepath = os.path.join(directory, "weekly_activity.png")
    try:
        plt.savefig(filepath)
        print(f"Saved weekly activity plot to {filepath}")
    except Exception as e:
        print(f"Error saving weekly activity plot: {e}")
    plt.close()


def plot_monthly_activity(data, directory, start_date, end_date):
    if not data:
        print("No day-of-month activity data to plot.")
        return

    days_of_month = [item["day_of_month"] for item in data]
    counts = [item["game_count"] for item in data]  # Assuming 'event_count'

    plt.figure(figsize=(15, 6))
    plt.bar(days_of_month, counts, color="salmon")
    plt.xlabel("Day of the Month")
    plt.ylabel("Number of Games")  # Or "Number of Distinct Games"
    plt.title(f"Event Game by Day of Month ({start_date} to {end_date})")
    plt.xticks(rotation=45, ha="right")
    # Show fewer ticks if there are too many days (e.g., every 2nd or 3rd day)
    if len(days_of_month) > 15:
        tick_positions = range(0, len(days_of_month), max(1, len(days_of_month) // 15))
        plt.xticks(
            ticks=[days_of_month[i] for i in tick_positions], rotation=45, ha="right"
        )

    plt.tight_layout()

    filepath = os.path.join(directory, "day_of_month_activity.png")
    try:
        plt.savefig(filepath)
        print(f"Saved day-of-month activity plot to {filepath}")
    except Exception as e:
        print(f"Error saving day-of-month plot: {e}")
    plt.close()


def plot_top_admins(data, directory, start_date, end_date):
    """
    Generates and saves a horizontal bar chart for top contributing admins.
    """
    if not data:
        print("No top admins data to plot.")
        return

    admin_names = [item["admin_name"] for item in data]
    # Assuming 'contribution_count' is the key from get_top_admins_by_contribution
    counts = [item["distinct_games_count"] for item in data]

    # For horizontal bar chart, reverse the lists so the top admin is at the top
    admin_names.reverse()
    counts.reverse()

    plt.figure(
        figsize=(10, max(6, len(admin_names) * 0.5))
    )  # Adjust height based on number of admins
    plt.barh(admin_names, counts, color="slateblue")  # Using a different color
    plt.xlabel("Number of Contributions (Games Recorded)")
    plt.ylabel("Admin Name")
    plt.title(f"Top Contributing Admins ({start_date} to {end_date})")
    plt.tight_layout()  # Adjust layout to make room for labels

    filepath = os.path.join(directory, "top_admins.png")
    try:
        plt.savefig(filepath)
        print(f"Saved top admins plot to {filepath}")
    except Exception as e:
        print(f"Error saving top admins plot: {e}")
    plt.close()  # Close the figure to free memory


@app.command(
    name="generate",
    help="Generate monthly digests",
)
def generate(
    days_shift: int = typer.Option(
        0, "-d", "--days-shift", help="Number of days to shift the date range"
    ),
    late_night_shift: int = typer.Option(
        0,
        "-ln",
        "--late-night-shift",
        help="Number of hours to shift the start of the day for weekly activity",
    ),
    no_plots: bool = typer.Option(
        False, "-np", "--no-plots", help="Don't generate plots"
    ),
):
    start, end = get_last_month_date_range(days_shift)
    print(f"Digest for {start} to {end} period...")

    digest_dir = get_digest_dir(start, end)

    top_players = get_top_active_players(start, end, top_n=10)
    admin_contributions = get_top_admins_by_contribution(start, end, top_n=10)
    hourly_activity = get_game_activity_by_hour(start, end)
    weekly_activity = get_game_activity_by_day_of_week(
        start, end, hours_shift=late_night_shift
    )
    monthly_activity = get_game_activity_by_day_of_month(
        start, end, hours_shift=late_night_shift
    )
    players_for_status_change = get_player_promotion_demotion_candidates(
        min_games_threshold=10,
        promotion_win_rate_pct=60.0,
        demotion_win_rate_pct=40.0,
        start_date_str=start,
        end_date_str=end,
    )

    # 2. Print raw data (as in your original function)
    print("\n--- Raw Data ---")
    print("Top Players:")
    print(top_players)
    print("\nAdmin Contributions:")
    print(admin_contributions)
    print("\nPlayers for Status Change:")
    print(players_for_status_change)
    print("\nHourly Activity:")
    print(hourly_activity)
    print("\nWeekly Activity:")
    print(weekly_activity)
    print("\nMonthly Activity (Day of Month):")
    print(monthly_activity)
    print("--- End of Raw Data ---\n")

    # 3. Plot data and save images
    if not no_plots:
        print("--- Generating Plots ---")
        plot_top_players(top_players, digest_dir, start, end)
        plot_top_admins(admin_contributions, digest_dir, start, end)
        plot_hourly_activity(hourly_activity, digest_dir, start, end)
        plot_weekly_activity(weekly_activity, digest_dir, start, end)
        plot_monthly_activity(monthly_activity, digest_dir, start, end)
        print("--- Plot Generation Complete ---")

    raw_digest = {
        "metadata": {
            "generated_on": datetime.now().isoformat(),
            "period_start_date": start,
            "period_end_date": end,
        },
        "top_players": top_players,
        "top_admins": admin_contributions,
        "players_for_status_change": players_for_status_change,
        "hourly_activity": hourly_activity,
        "weekly_activity_by_day": weekly_activity,
        "total_activity_by_day_of_month": monthly_activity,
    }

    json_filepath = digest_dir / "raw_digest.json"
    try:
        with open(json_filepath, "w") as f:
            json.dump(raw_digest, f, indent=4)
        print(f"\n🗂️  Aggregated data report saved to: {json_filepath}")
    except IOError as e:
        print(f"Error saving data to JSON file {json_filepath}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred while saving JSON to {json_filepath}: {e}")

    games = get_all_unique_games(start, end)
    df = pd.DataFrame(games)
    games_path = digest_dir / "games.xls"
    df.to_excel(games_path)
    print(f"👾 All games from {start} to {end} is saved to {games_path}")


def get_latest_digest_dir() -> Path:
    digest_path = Path(os.getenv("DIGEST_PATH"))

    first = next(digest_path.iterdir(), None)
    if first is None:
        return None

    latest_digest_dir = max(digest_path.iterdir())
    return latest_digest_dir


def load_digest(digest_dir: Path):
    try:
        with open(digest_dir / "raw_digest.json", "r") as f:
            raw_digest = json.load(f)
        return raw_digest
    except Exception as e:
        app.logger.error(f"Error loading JSON from file: {e}")
        return None  # Or raise error, or return default


def load_latest_digest():
    digest_dir = get_latest_digest_dir()
    if digest_dir is None:
        return None
    return load_digest(digest_dir)


@app.command(
    name="apply",
    help="Reset history for players based on the digest",
)
def apply():
    digest_dir = get_latest_digest_dir()
    if digest_dir is None:
        print("No digest found. Exiting.")
        return

    print(f"Processing the latest digest at {digest_dir} ...")
    raw_digest = load_digest(digest_dir)

    changes = raw_digest["players_for_status_change"]

    print("Changes:")
    for change in changes:
        nickname = change["nickname"]
        score = change["current_score"]
        new_score = change["new_score"]

        emoji = "🔼" if change["status"] == "Promote" else "🔻"
        print(f" - {nickname} {emoji}: {score} -> {new_score}")

    players = [change["nickname"] for change in changes]
    clear_history = typer.confirm(f"🧹Clear history for players? ({players})")
    if clear_history:
        result = subprocess.run(
            ["./scripts/backup.sh"], check=True, capture_output=True, text=True
        )
        if result.stdout:
            print(result.stdout)

        total_events_deleted = 0
        for player in players:
            events_deleted = clean_user_history(player)
            total_events_deleted += events_deleted
            print(f"Deleted {events_deleted} events for {player}")

        print(f"\n - Total events deleted: {total_events_deleted} events")
        print("✅ History cleared for selected players.")
    else:
        print("Okay, bruh.😒")


if __name__ == "__main__":
    app()
