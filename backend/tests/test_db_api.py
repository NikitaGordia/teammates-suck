import pytest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path to import the app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils import db


@pytest.fixture
def mock_db_functions():
    """Mock the database functions."""
    with patch("utils.db_api.db") as mock_db:
        # Mock get_events
        mock_db.get_events.return_value = [
            {
                "id": 1,
                "nickname": "Player1",
                "game_name": "Game1",
                "win": True,
                "admin": "hash1",
            },
            {
                "id": 2,
                "nickname": "Player2",
                "game_name": "Game2",
                "win": False,
                "admin": "hash2",
            },
        ]

        # Mock get_event_by_id
        mock_db.get_event_by_id.return_value = {
            "id": 1,
            "nickname": "Player1",
            "game_name": "Game1",
            "win": True,
            "admin": "hash1",
        }

        # Mock add_event
        mock_db.add_event.return_value = 3

        # Mock update_event
        mock_db.update_event.return_value = True

        # Mock delete_event
        mock_db.delete_event.return_value = True

        yield mock_db


def test_get_events_endpoint(client, mock_db_functions):
    """Test the GET /api/db/events endpoint."""
    response = client.get("/api/db/events")
    assert response.status_code == 200

    data = response.get_json()
    assert "events" in data
    assert len(data["events"]) == 2

    # Test with admin_passcode
    response = client.get("/api/db/events?admin_passcode=test123")
    assert response.status_code == 200

    # Verify that get_events was called with the admin_passcode
    mock_db_functions.get_events.assert_called_with("test123")


def test_get_event_endpoint(client, mock_db_functions):
    """Test the GET /api/db/events/<id> endpoint."""
    # Test with existing event
    response = client.get("/api/db/events/1")
    assert response.status_code == 200

    data = response.get_json()
    assert "event" in data
    assert data["event"]["id"] == 1

    # Test with non-existent event
    mock_db_functions.get_event_by_id.return_value = None
    response = client.get("/api/db/events/999")
    assert response.status_code == 404


def test_add_event_endpoint(client, mock_db_functions):
    """Test the POST /api/db/events endpoint."""
    # Test with valid data
    event_data = {
        "nickname": "TestPlayer",
        "game_name": "TestGame",
        "win": True,
        "admin_passcode": "admin123",
    }

    response = client.post(
        "/api/db/events", data=json.dumps(event_data), content_type="application/json"
    )

    assert response.status_code == 200
    data = response.get_json()
    assert "id" in data
    assert data["id"] == 3

    # Test with missing field
    invalid_data = {
        "nickname": "TestPlayer",
        "game_name": "TestGame",
        "win": True,
        # Missing admin_passcode
    }

    response = client.post(
        "/api/db/events", data=json.dumps(invalid_data), content_type="application/json"
    )

    assert response.status_code == 400

    # Test with invalid data type
    invalid_data = {
        "nickname": "TestPlayer",
        "game_name": "TestGame",
        "win": "not_a_boolean",  # Should be boolean
        "admin_passcode": "admin123",
    }

    response = client.post(
        "/api/db/events", data=json.dumps(invalid_data), content_type="application/json"
    )

    assert response.status_code == 400


def test_update_event_endpoint(client, mock_db_functions):
    """Test the PUT /api/db/events/<id> endpoint."""
    # Test with valid data
    update_data = {
        "nickname": "UpdatedPlayer",
        "game_name": "UpdatedGame",
        "win": False,
        "admin_passcode": "admin123",
    }

    response = client.put(
        "/api/db/events/1",
        data=json.dumps(update_data),
        content_type="application/json",
    )

    assert response.status_code == 200

    # Test with missing admin_passcode
    invalid_data = {
        "nickname": "UpdatedPlayer",
        "game_name": "UpdatedGame",
        "win": False,
        # Missing admin_passcode
    }

    response = client.put(
        "/api/db/events/1",
        data=json.dumps(invalid_data),
        content_type="application/json",
    )

    assert response.status_code == 400

    # Test with non-existent event
    mock_db_functions.get_event_by_id.return_value = None

    response = client.put(
        "/api/db/events/999",
        data=json.dumps(update_data),
        content_type="application/json",
    )

    assert response.status_code == 404


def test_delete_event_endpoint(client, mock_db_functions):
    """Test the DELETE /api/db/events/<id> endpoint."""
    # Test with valid data
    delete_data = {"admin_passcode": "admin123"}

    response = client.delete(
        "/api/db/events/1",
        data=json.dumps(delete_data),
        content_type="application/json",
    )

    assert response.status_code == 200

    # Test with missing admin_passcode
    invalid_data = {}

    response = client.delete(
        "/api/db/events/1",
        data=json.dumps(invalid_data),
        content_type="application/json",
    )

    assert response.status_code == 400

    # Test with invalid admin_passcode
    mock_db_functions.delete_event.return_value = False

    response = client.delete(
        "/api/db/events/1",
        data=json.dumps(delete_data),
        content_type="application/json",
    )

    assert response.status_code == 404
