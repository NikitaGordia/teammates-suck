import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock


def test_get_mappings_endpoint(client, mock_score_mappings):
    """Test the get_mappings endpoint."""
    with patch('app.score_mappings', mock_score_mappings), \
         patch('app.last_refresh_time', datetime.now() - timedelta(hours=1)):
        
        response = client.get('/api/get_mappings')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'scores' in data
        assert data['scores'] == mock_score_mappings
        assert 'refreshed' in data
        assert 'force_refresh_prevented' in data
        assert 'seconds_until_next_refresh' in data


def test_get_mappings_force_refresh(client, mock_score_mappings, mock_sheet_data):
    """Test the get_mappings endpoint with force_refresh=true."""
    with patch('app.score_mappings', {}), \
         patch('app.last_refresh_time', datetime.now() - timedelta(minutes=1)), \
         patch('app.fetch_all_scores_from_sheet', return_value=mock_score_mappings):
        
        response = client.get('/api/get_mappings?force_refresh=true')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['scores'] == mock_score_mappings
        assert data['refreshed'] is True


def test_get_mappings_force_refresh_prevented(client, mock_score_mappings):
    """Test that force_refresh is prevented if called too soon."""
    with patch('app.score_mappings', mock_score_mappings), \
         patch('app.last_refresh_time', datetime.now()), \
         patch('app.MIN_REFRESH_INTERVAL_SECONDS', 30):
        
        response = client.get('/api/get_mappings?force_refresh=true')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['force_refresh_prevented'] is True
        assert data['seconds_until_next_refresh'] > 0


def test_balance_endpoint(client, balance_request_data):
    """Test the balance endpoint."""
    response = client.post(
        '/api/balance',
        data=json.dumps(balance_request_data),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    
    data = response.get_json()
    assert 'teamA' in data
    assert 'teamB' in data
    
    # Check that all players are assigned to teams
    all_players = [player['nickname'] for player in data['teamA'] + data['teamB']]
    assert sorted(all_players) == sorted(list(balance_request_data['users'].keys()))


def test_balance_endpoint_invalid_data(client):
    """Test the balance endpoint with invalid data."""
    # Test with missing 'users' field
    response = client.post(
        '/api/balance',
        data=json.dumps({"randomness": 50}),
        content_type='application/json'
    )
    assert response.status_code == 400
    
    # Test with invalid randomness value
    response = client.post(
        '/api/balance',
        data=json.dumps({
            "users": {"Player1": 10},
            "randomness": 101  # Invalid: should be 0-100
        }),
        content_type='application/json'
    )
    assert response.status_code == 400
    
    # Test with non-integer randomness
    response = client.post(
        '/api/balance',
        data=json.dumps({
            "users": {"Player1": 10},
            "randomness": "not-a-number"
        }),
        content_type='application/json'
    )
    assert response.status_code == 400
