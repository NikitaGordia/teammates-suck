import pytest
from app import app, balance_teams, fetch_all_scores_from_sheet
from flask import Flask


def test_app_exists():
    """Test that the Flask app exists."""
    assert app is not None
    assert isinstance(app, Flask)


def test_app_config():
    """Test the app configuration."""
    assert app.config['TESTING'] is True


def test_index_route(client):
    """Test the index route."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Team Balancer Backend is running!" in response.data


def test_hello_route(client):
    """Test the hello route."""
    response = client.get('/api/hello')
    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == "Hello from Team Balancer Backend!"


def test_balance_teams_function():
    """Test the balance_teams function directly."""
    # Test with even number of players
    user_scores = {
        "Player1": 10,
        "Player2": 8,
        "Player3": 5,
        "Player4": 7
    }
    
    result = balance_teams(user_scores, randomness=0)
    
    # Check that we have two teams
    assert 'teamA' in result
    assert 'teamB' in result
    
    # Check that all players are assigned to teams
    all_players = [player['nickname'] for player in result['teamA'] + result['teamB']]
    assert sorted(all_players) == sorted(list(user_scores.keys()))
    
    # Check that teams are balanced in size
    assert len(result['teamA']) == len(result['teamB']) == 2
    
    # Check that teams are sorted by score
    assert result['teamA'][0]['score'] >= result['teamA'][1]['score']
    assert result['teamB'][0]['score'] >= result['teamB'][1]['score']
    
    # Test with odd number of players
    user_scores = {
        "Player1": 10,
        "Player2": 8,
        "Player3": 5,
        "Player4": 7,
        "Player5": 6
    }
    
    result = balance_teams(user_scores, randomness=0)
    
    # Check that all players are assigned
    all_players = [player['nickname'] for player in result['teamA'] + result['teamB']]
    assert sorted(all_players) == sorted(list(user_scores.keys()))
    
    # Check that one team has one more player
    assert abs(len(result['teamA']) - len(result['teamB'])) == 1
    assert len(result['teamA']) + len(result['teamB']) == 5
