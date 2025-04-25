import requests
import json
import time

# Test data
test_data = {
    "teamA": [
        {"nickname": "player1"},
        {"nickname": "player2"},
        {"nickname": "player3"},
    ],
    "teamB": [
        {"nickname": "player4"},
        {"nickname": "player5"},
        {"nickname": "player6"},
    ],
    "winningTeam": "A",
    "gameName": f"Test Game {time.strftime('%Y-%m-%d %H:%M:%S')}",
    "adminPasscode": "admin123",
}

# Send the request to the endpoint
response = requests.post(
    "http://localhost:5050/api/submit_game",
    json=test_data,
    headers={"Content-Type": "application/json"},
)

# Print the response
print(f"Status Code: {response.status_code}")
try:
    response_json = response.json()
    print(f"Response: {json.dumps(response_json, indent=2)}")
except Exception as e:
    print(f"Error parsing response as JSON: {e}")
    print(f"Raw response: {response.text}")

# If successful, try to retrieve the events
if response.status_code == 200:
    try:
        events_added = response.json().get("count", 0)
        print(f"\nCreated {events_added} events")
    except Exception as e:
        print(f"Error getting event count: {e}")
        print(f"Raw response: {response.text}")

    # Get all events for the admin
    events_response = requests.get(
        "http://localhost:5050/api/db/events", params={"admin_passcode": "admin123"}
    )

    if events_response.status_code == 200:
        events = events_response.json().get("events", [])
        print(f"\nRetrieved {len(events)} events for admin:")
        for event in events:
            print(
                f"  - {event['nickname']} played {event['game_name']} and {'won' if event['win'] else 'lost'}"
            )

        # Print summary by team
        team_a = [p["nickname"] for p in test_data["teamA"]]
        team_b = [p["nickname"] for p in test_data["teamB"]]

        print("\nTeam A players:")
        for nickname in team_a:
            for event in events:
                if event["nickname"] == nickname:
                    print(f"  - {nickname}: {'Won' if event['win'] else 'Lost'}")
                    break

        print("\nTeam B players:")
        for nickname in team_b:
            for event in events:
                if event["nickname"] == nickname:
                    print(f"  - {nickname}: {'Won' if event['win'] else 'Lost'}")
                    break
    else:
        print(f"\nFailed to retrieve events: {events_response.status_code}")
        print(events_response.text)
