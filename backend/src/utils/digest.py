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
from utils.spreadsheet import SCORES, SheetScoreFetcher
from utils import db as db_utils

db = db_utils.Database()
app = typer.Typer(help="Generate monthly digests")


def get_top_active_players(start_date_str, end_date_str, top_n=10):
    """
    Retrieves the top N active players based on event attendance between specific dates.

    "Activity" is determined by the number of events a player has attended.

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

    query_start_datetime = f"{start_date_str} 00:00:00"
    query_end_datetime = f"{end_date_str} 23:59:59"

    conn = None
    results = []
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()

        # MODIFIED: Join with players table to get nickname
        sql_query = """
            SELECT
                p.id,
                p.nickname,
                COUNT(e.id) as event_count
            FROM
                events e
            JOIN
                players p ON e.player_id = p.id
            WHERE
                e.game_datetime BETWEEN ? AND ?
            GROUP BY
                p.nickname
            ORDER BY
                event_count DESC
            LIMIT ?
        """
        cursor.execute(sql_query, (query_start_datetime, query_end_datetime, top_n))

        rows = cursor.fetchall()
        for row in rows:
            results.append(
                {
                    "nickname": row["nickname"],
                    "game_count": row["event_count"],
                    "id": row["id"],
                }
            )

    except sqlite3.Error as e:
        print(f"Database error: {e}")
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

    base_sql = """
        SELECT
            a.name AS admin_name,
            COUNT(DISTINCT e.game_name || '|' || e.game_datetime) AS distinct_games_count
        FROM
            events e
        JOIN
            admins a ON e.admin = CAST(a.id AS TEXT)
    """

    final_query_parts = [base_sql]
    final_params = []

    date_where_clause, date_params = db_utils._build_date_range_clause(
        start_date_str, end_date_str
    )
    if date_where_clause:
        final_query_parts.append(date_where_clause)
        final_params.extend(date_params)

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
        cursor.execute(sql_query, tuple(final_params))
        rows = cursor.fetchall()
        for row in rows:
            results.append(
                {
                    "admin_name": row["admin_name"],
                    "distinct_games_count": row["distinct_games_count"],
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
    """
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

    date_where_clause, date_params = db_utils._build_date_range_clause(
        start_date_str, end_date_str
    )
    if date_where_clause:
        final_query_parts.append(date_where_clause)
        final_params.extend(date_params)

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
            return []

        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(final_params))
        rows = cursor.fetchall()
        for row in rows:
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
    """
    hourly_activity = [{"hour_of_day": f"{h:02d}", "game_count": 0} for h in range(24)]

    base_sql = "SELECT strftime('%H', game_datetime) as hour_str, COUNT(DISTINCT game_name || '|' || game_datetime) as game_count FROM events"

    where_clause, params = db_utils._build_date_range_clause(
        start_date_str, end_date_str
    )
    sql_query = base_sql + where_clause + " GROUP BY hour_str ORDER BY hour_str"

    conn = None
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, params)
        rows = cursor.fetchall()

        db_results = {row["hour_str"]: row["game_count"] for row in rows}

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
    Aggregates counts of distinct games played by day of the week (Sunday-Saturday).
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
    time_shift_modifier = f"-{int(hours_shift)} hours"

    base_sql = "SELECT strftime('%w', datetime(game_datetime, ?)) as day_w_str, COUNT(DISTINCT game_name || '|' || game_datetime) as game_count FROM events"
    where_clause, date_filter_params = db_utils._build_date_range_clause(
        start_date_str, end_date_str
    )
    sql_query = base_sql + where_clause + " GROUP BY day_w_str ORDER BY day_w_str"
    final_params = [time_shift_modifier] + date_filter_params

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
    Aggregates counts of distinct games played by day of the month (01-31).
    """
    monthly_activity_by_day = [
        {"day_of_month": f"{d:02d}", "game_count": 0} for d in range(1, 32)
    ]

    time_shift_modifier = f"-{int(hours_shift)} hours"
    base_sql = "SELECT strftime('%d', datetime(game_datetime, ?)) as day_m_str, COUNT(DISTINCT game_name || '|' || game_datetime) as game_count FROM events"

    where_clause, date_filter_params = db_utils._build_date_range_clause(
        start_date_str, end_date_str
    )
    sql_query = base_sql + where_clause + " GROUP BY day_m_str ORDER BY day_m_str"
    final_params = [time_shift_modifier] + date_filter_params

    conn = None
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, final_params)
        rows = cursor.fetchall()

        db_results = {row["day_m_str"]: row["game_count"] for row in rows}

        for item in monthly_activity_by_day:
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
    promotion_win_rate_pct: float,
    demotion_win_rate_pct: float,
    start_date_str: str = None,
    end_date_str: str = None,
):
    """
    Identifies players eligible for promotion or demotion based on their game statistics.
    """
    if not (isinstance(min_games_threshold, int) and min_games_threshold >= 0):
        print("Error: min_games_threshold must be a non-negative integer.")
        return []
    if not (0 <= promotion_win_rate_pct <= 100):
        print("Error: promotion_win_rate_pct must be between 0 and 100.")
        return []
    if not (0 <= demotion_win_rate_pct <= 100):
        print("Error: demotion_win_rate_pct must be between 0 and 100.")
        return []
    if promotion_win_rate_pct <= demotion_win_rate_pct:
        print(
            "Warning: promotion_win_rate_pct should ideally be greater than demotion_win_rate_pct."
        )

    load_dotenv()
    fetcher = SheetScoreFetcher(
        os.getenv("GOOGLE_API_KEY"), os.getenv("SPREADSHEET_ID")
    )
    scores = fetcher.fetch_all_scores()

    # MODIFIED: Join with players table to get nickname
    base_sql = """
        SELECT
            p.id as player_id,
            p.nickname,
            COUNT(e.id) AS total_games,
            SUM(CASE WHEN e.win = 1 THEN 1 ELSE 0 END) AS total_wins
        FROM
            events e
        JOIN
            players p ON e.player_id = p.id
    """

    final_query_parts = [base_sql]
    params = []

    date_where_clause, date_params = db_utils._build_date_range_clause(
        start_date_str, end_date_str
    )
    if date_where_clause:
        final_query_parts.append(date_where_clause)
        params.extend(date_params)

    # MODIFIED: Group by player id and nickname
    final_query_parts.append("GROUP BY p.id, p.nickname")
    sql_query = " ".join(final_query_parts)

    conn = None
    players_for_status_change = []
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(params))
        player_stats = cursor.fetchall()

        for row in player_stats:
            # MODIFIED: Get player_id from the query result
            player_id = row["player_id"]
            nickname = row["nickname"]
            total_games = int(row["total_games"])
            total_wins = int(row["total_wins"] if row["total_wins"] is not None else 0)

            if total_games >= min_games_threshold:
                win_rate_percentage = 0.0
                if total_games > 0:
                    win_rate_percentage = (total_wins / total_games) * 100.0

                status = "Maintain"
                if win_rate_percentage > promotion_win_rate_pct:
                    status = "Promote"
                elif win_rate_percentage < demotion_win_rate_pct:
                    status = "Demote"

                if status in ["Promote", "Demote"]:
                    score = scores.get(nickname, None)
                    if score:
                        ix = SCORES.index(score)
                        new_ix = ix + (1 if status == "Promote" else -1)
                        new_score = SCORES[new_ix]
                    else:
                        continue

                    # MODIFIED: Include player_id in the result
                    players_for_status_change.append(
                        {
                            "player_id": player_id,
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
    counts = [item["game_count"] for item in data]

    nicknames.reverse()
    counts.reverse()

    plt.figure(figsize=(10, max(6, len(nicknames) * 0.5)))
    plt.barh(nicknames, counts, color="teal")
    plt.xlabel("Number of Events")
    plt.ylabel("Player Nickname")
    plt.title(f"Top Active Players ({start_date} to {end_date})")
    plt.tight_layout()

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
    counts = [item["game_count"] for item in data]

    plt.figure(figsize=(12, 6))
    plt.bar(hours, counts, color="skyblue")
    plt.xlabel("Hour of Day")
    plt.ylabel("Number of Games")
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

    day_names = [item["day_name"] for item in data]
    counts = [item["game_count"] for item in data]

    plt.figure(figsize=(10, 6))
    plt.bar(day_names, counts, color="lightgreen")
    plt.xlabel("Day of the Week")
    plt.ylabel("Number of Games")
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
    counts = [item["game_count"] for item in data]

    plt.figure(figsize=(15, 6))
    plt.bar(days_of_month, counts, color="salmon")
    plt.xlabel("Day of the Month")
    plt.ylabel("Number of Games")
    plt.title(f"Event Game by Day of Month ({start_date} to {end_date})")
    plt.xticks(rotation=45, ha="right")
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
    counts = [item["distinct_games_count"] for item in data]

    admin_names.reverse()
    counts.reverse()

    plt.figure(figsize=(10, max(6, len(admin_names) * 0.5)))
    plt.barh(admin_names, counts, color="slateblue")
    plt.xlabel("Number of Contributions (Games Recorded)")
    plt.ylabel("Admin Name")
    plt.title(f"Top Contributing Admins ({start_date} to {end_date})")
    plt.tight_layout()

    filepath = os.path.join(directory, "top_admins.png")
    try:
        plt.savefig(filepath)
        print(f"Saved top admins plot to {filepath}")
    except Exception as e:
        print(f"Error saving top admins plot: {e}")
    plt.close()


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
    ignore: str = typer.Option(
        "", "-ig", "--ignore", help="Players to ignore (comma-separated)"
    ),
):
    start, end = get_last_month_date_range(days_shift)
    print(f"Digest for {start} to {end} period...")

    top_players = get_top_active_players(start, end, top_n=10)
    admin_contributions = get_top_admins_by_contribution(start, end, top_n=10)
    hourly_activity = get_game_activity_by_hour(start, end)
    weekly_activity = get_game_activity_by_day_of_week(
        start, end, hours_shift=late_night_shift
    )
    monthly_activity = get_game_activity_by_day_of_month(
        start, end, hours_shift=late_night_shift
    )
    ignore_ids = [int(i) for i in ignore.split(",")] if len(ignore) > 0 else []
    players_for_status_change = [
        player
        for player in get_player_promotion_demotion_candidates(
            min_games_threshold=10,
            promotion_win_rate_pct=60.0,
            demotion_win_rate_pct=40.0,
            start_date_str=start,
            end_date_str=end,
        )
        if player["player_id"] not in ignore_ids
    ]

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

    confirmed = typer.confirm("Save new digest?")
    if confirmed:
        digest_dir = get_digest_dir(start, end)

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

        if not no_plots:
            print("--- Generating Plots ---")
            plot_top_players(top_players, digest_dir, start, end)
            plot_top_admins(admin_contributions, digest_dir, start, end)
            plot_hourly_activity(hourly_activity, digest_dir, start, end)
            plot_weekly_activity(weekly_activity, digest_dir, start, end)
            plot_monthly_activity(monthly_activity, digest_dir, start, end)
            print("--- Plot Generation Complete ---")

        json_filepath = digest_dir / "raw_digest.json"
        try:
            with open(json_filepath, "w") as f:
                json.dump(raw_digest, f, indent=4)
            print(f"\n🗂️  Aggregated data report saved to: {json_filepath}")
        except IOError as e:
            print(f"Error saving data to JSON file {json_filepath}: {e}")
        except Exception as e:
            print(
                f"An unexpected error occurred while saving JSON to {json_filepath}: {e}"
            )

        games = get_all_unique_games(start, end)
        df = pd.DataFrame(games)
        games_path = digest_dir / "games.xls"
        df.to_excel(games_path)
        print(f"👾 All games from {start} to {end} is saved to {games_path}")
    else:
        print("Aborted.")


def get_latest_digest_dir() -> Path:
    digest_path = Path(os.getenv("DIGEST_PATH"))
    if not digest_path.exists():
        return None

    dirs = [d for d in digest_path.iterdir() if d.is_dir()]
    if not dirs:
        return None

    latest_digest_dir = max(dirs)
    return latest_digest_dir


def load_digest(digest_dir: Path):
    try:
        with open(digest_dir / "raw_digest.json", "r") as f:
            raw_digest = json.load(f)
        return raw_digest
    except Exception as e:
        print(f"Error loading JSON from file: {e}")
        return None


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
    clear_history = typer.confirm(
        f"✍️ Add new scores for {len(players)} players? ({players})"
    )
    if clear_history:
        result = subprocess.run(
            ["./scripts/backup.sh"], check=True, capture_output=True, text=True
        )
        if result.stdout:
            print(result.stdout)

        for change in changes:
            # MODIFIED: Use player_id instead of nickname
            db.add_rank_change(
                player_id=change["player_id"],
                change_type="promotion"
                if change["status"] == "Promote"
                else "demotion",
                old_rank=change["current_score"],
                new_rank=change["new_score"],
                change_date=raw_digest["metadata"]["period_end_date"],
            )
        print("✅ Rank changes added to the database.")
    else:
        print("Okay, bruh.😒")


if __name__ == "__main__":
    app()
