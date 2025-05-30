from googleapiclient.discovery import build
import os
import json


def get_scores():
    """Get scores from environment variable APP_SCORES, with fallback to default values."""
    scores_env = os.getenv("APP_SCORES")
    if scores_env:
        return json.loads(scores_env)
    else:
        raise ValueError("APP_SCORES environment variable is not set")


SCORES = get_scores()


class SheetScoreFetcher:
    def __init__(self, api_key, spreadsheet_id, range_name="Scores!B2:C"):
        self.api_key = api_key
        self.spreadsheet_id = spreadsheet_id
        self.range_name = range_name
        self.service = build(
            "sheets", "v4", developerKey=api_key, cache_discovery=False
        )

    def fetch_all_scores(self):
        """
        Fetch all scores from Google Sheet and return them as a dictionary.

        Returns:
            dict: Dictionary mapping all nicknames to scores
        """
        try:
            # Call the Sheets API to get the data
            result = (
                self.service.spreadsheets()
                .values()
                .get(spreadsheetId=self.spreadsheet_id, range=self.range_name)
                .execute()
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
