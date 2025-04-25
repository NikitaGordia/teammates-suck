import pytest
import os
import sqlite3
import tempfile
from unittest.mock import patch, MagicMock
import sys
import hashlib

# Add the parent directory to sys.path to import the db module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db


@pytest.fixture
def test_db():
    """Create a temporary database for testing."""
    # Create a temporary file
    temp_db = tempfile.NamedTemporaryFile(delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    # Patch the DB_FILE constant to use our temporary database
    with patch('db.DB_FILE', temp_db_path):
        # Initialize the database
        db.init_db()
        yield
        
    # Clean up the temporary file
    os.unlink(temp_db_path)


def test_hash_passcode():
    """Test the hash_passcode function."""
    passcode = "test_passcode"
    expected_hash = hashlib.sha256(passcode.encode()).hexdigest()
    
    # Call the function
    result = db.hash_passcode(passcode)
    
    # Check the result
    assert result == expected_hash


def test_add_and_get_event(test_db):
    """Test adding and retrieving an event."""
    # Add an event
    with patch('db.DB_FILE', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database.sqlite'))):
        event_id = db.add_event("TestPlayer", "TestGame", True, "admin123")
        
        # Get the event
        event = db.get_event_by_id(event_id)
        
        # Check the event data
        assert event is not None
        assert event['nickname'] == "TestPlayer"
        assert event['game_name'] == "TestGame"
        assert event['win'] == 1  # SQLite stores booleans as integers
        assert event['admin'] == db.hash_passcode("admin123")


def test_get_events(test_db):
    """Test getting all events."""
    # Add multiple events
    with patch('db.DB_FILE', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database.sqlite'))):
        db.add_event("Player1", "Game1", True, "admin123")
        db.add_event("Player2", "Game2", False, "admin123")
        db.add_event("Player3", "Game3", True, "admin456")
        
        # Get all events
        all_events = db.get_events()
        
        # Get events for a specific admin
        admin_events = db.get_events("admin123")
        
        # Check the results
        assert len(all_events) == 3
        assert len(admin_events) == 2
        
        # Check that the events for admin123 have the correct admin hash
        admin_hash = db.hash_passcode("admin123")
        for event in admin_events:
            assert event['admin'] == admin_hash


def test_update_event(test_db):
    """Test updating an event."""
    # Add an event
    with patch('db.DB_FILE', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database.sqlite'))):
        event_id = db.add_event("TestPlayer", "TestGame", True, "admin123")
        
        # Update the event
        result = db.update_event(event_id, nickname="UpdatedPlayer", game_name="UpdatedGame", win=False)
        
        # Check the result
        assert result is True
        
        # Get the updated event
        event = db.get_event_by_id(event_id)
        
        # Check the updated data
        assert event['nickname'] == "UpdatedPlayer"
        assert event['game_name'] == "UpdatedGame"
        assert event['win'] == 0  # SQLite stores booleans as integers


def test_delete_event(test_db):
    """Test deleting an event."""
    # Add an event
    with patch('db.DB_FILE', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database.sqlite'))):
        event_id = db.add_event("TestPlayer", "TestGame", True, "admin123")
        
        # Delete the event with incorrect passcode
        result = db.delete_event(event_id, "wrong_passcode")
        assert result is False
        
        # Event should still exist
        event = db.get_event_by_id(event_id)
        assert event is not None
        
        # Delete the event with correct passcode
        result = db.delete_event(event_id, "admin123")
        assert result is True
        
        # Event should no longer exist
        event = db.get_event_by_id(event_id)
        assert event is None
