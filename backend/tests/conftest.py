import pytest
from backend.src.app import app as flask_app
import os
import json
import sys
from unittest.mock import patch

# Add the parent directory to sys.path to import the db module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    # Set testing config
    flask_app.config.update(
        {
            "TESTING": True,
        }
    )

    # Other setup can go here

    yield flask_app

    # Clean up / reset resources here


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()


@pytest.fixture
def mock_score_mappings():
    """Sample score mappings for testing."""
    return {
        "Player1": 10,
        "Player2": 8,
        "Player3": 5,
        "Player4": 7,
        "Player5": 6,
        "Player6": 9,
    }


@pytest.fixture
def mock_sheet_data():
    """Sample data that would be returned from Google Sheets."""
    return [
        ["Player1", "10"],
        ["Player2", "8"],
        ["Player3", "5"],
        ["Player4", "7"],
        ["Player5", "6"],
        ["Player6", "9"],
    ]


@pytest.fixture
def balance_request_data():
    """Sample request data for the balance endpoint."""
    return {
        "users": {"Player1": 10, "Player2": 8, "Player3": 5, "Player4": 7},
        "randomness": 0,
    }
