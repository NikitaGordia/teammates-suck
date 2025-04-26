import pytest
from unittest.mock import patch, MagicMock
from backend.src.app import fetch_all_scores_from_sheet


def test_fetch_all_scores_from_sheet_success(mock_sheet_data):
    """Test successful fetching of scores from Google Sheets."""
    # Create a mock for the Google Sheets API response
    mock_result = MagicMock()
    mock_result.get.return_value = mock_sheet_data
    
    mock_sheet = MagicMock()
    mock_sheet.values().get().execute.return_value = mock_result
    
    mock_service = MagicMock()
    mock_service.spreadsheets.return_value = mock_sheet
    
    # Patch the build function to return our mock service
    with patch('app.build', return_value=mock_service):
        result = fetch_all_scores_from_sheet()
        
        # Check that the result is as expected
        expected = {
            "Player1": 10.0,
            "Player2": 8.0,
            "Player3": 5.0,
            "Player4": 7.0,
            "Player5": 6.0,
            "Player6": 9.0
        }
        assert result == expected


def test_fetch_all_scores_from_sheet_empty():
    """Test fetching scores when the sheet is empty."""
    # Create a mock for an empty Google Sheets response
    mock_result = MagicMock()
    mock_result.get.return_value = []
    
    mock_sheet = MagicMock()
    mock_sheet.values().get().execute.return_value = mock_result
    
    mock_service = MagicMock()
    mock_service.spreadsheets.return_value = mock_sheet
    
    # Patch the build function to return our mock service
    with patch('app.build', return_value=mock_service):
        result = fetch_all_scores_from_sheet()
        
        # Should return an empty dictionary
        assert result == {}


def test_fetch_all_scores_from_sheet_api_error():
    """Test handling of API errors when fetching scores."""
    # Patch the build function to raise an exception
    with patch('app.build', side_effect=Exception("API Error")):
        result = fetch_all_scores_from_sheet()
        
        # Should return an empty dictionary on error
        assert result == {}


def test_fetch_all_scores_from_sheet_invalid_score():
    """Test handling of invalid score values in the sheet."""
    # Create mock data with an invalid score
    mock_data = [
        ["Player1", "10"],
        ["Player2", "not-a-number"],  # Invalid score
        ["Player3", "5"]
    ]
    
    mock_result = MagicMock()
    mock_result.get.return_value = mock_data
    
    mock_sheet = MagicMock()
    mock_sheet.values().get().execute.return_value = mock_result
    
    mock_service = MagicMock()
    mock_service.spreadsheets.return_value = mock_sheet
    
    # Patch the build function to return our mock service
    with patch('app.build', return_value=mock_service):
        result = fetch_all_scores_from_sheet()
        
        # Should convert invalid score to 0
        expected = {
            "Player1": 10.0,
            "Player2": 0.0,  # Invalid score converted to 0
            "Player3": 5.0
        }
        assert result == expected
