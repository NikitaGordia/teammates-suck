import argparse
import json
from pathlib import Path

from utils import db as db_utils


def main(db_path: Path, digest_path: Path):
    db = db_utils.Database(db_path)

    with open(digest_path, "r") as f:
        digest_data = json.load(f)

    for player in digest_data["players_for_status_change"]:
        nickname = player["nickname"]
        status = player["status"]
        current_score = player["current_score"]
        new_score = player["new_score"]
        change_type = "promotion" if status == "Promote" else "demotion"
        change_date = digest_data["metadata"]["period_end_date"]

        db.add_rank_change(nickname, change_type, current_score, new_score, change_date)
    print("✅ Rank changes added to the database.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", help="Path to the database file")
    parser.add_argument("--digest", help="Path to the digest file")
    args = parser.parse_args()
    db_path = Path(args.db)
    digest_path = Path(args.digest)
    print(f"Digest to be processed: {digest_path}")
    main(db_path, digest_path)
