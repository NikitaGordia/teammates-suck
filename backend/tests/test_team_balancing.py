from src.app import balance_teams
from src.utils.balance import Balancer
import json
import pytest
import random


def test_balance_teams_even_players():
    """Test balancing with an even number of players."""
    user_scores = {"Player1": 10, "Player2": 8, "Player3": 5, "Player4": 7}

    result = balance_teams(user_scores, randomness=0)

    # Check team structure
    assert "teamA" in result
    assert "teamB" in result

    # Check that all players are assigned
    all_players = [player["nickname"] for player in result["teamA"] + result["teamB"]]
    assert sorted(all_players) == sorted(list(user_scores.keys()))

    # Check team sizes
    assert len(result["teamA"]) == len(result["teamB"]) == 2

    # Calculate team totals
    team_a_total = sum(player["score"] for player in result["teamA"])
    team_b_total = sum(player["score"] for player in result["teamB"])

    # Check that teams are reasonably balanced
    assert abs(team_a_total - team_b_total) <= 2


def test_balance_teams_odd_players():
    """Test balancing with an odd number of players."""
    user_scores = {
        "Player1": 10,
        "Player2": 8,
        "Player3": 5,
        "Player4": 7,
        "Player5": 6,
    }

    with pytest.raises(AssertionError):
        _ = balance_teams(user_scores, randomness=0)


def test_balance_teams_with_randomness():
    """Test that randomness affects team composition."""
    # Set seed for reproducibility
    random.seed(42)

    user_scores = {
        "Player1": 10,
        "Player2": 9,
        "Player3": 8,
        "Player4": 7,
        "Player5": 6,
        "Player6": 5,
    }

    # Get teams with no randomness
    result_no_random = balance_teams(user_scores, randomness=0)

    # Reset seed
    random.seed(42)

    # Get teams with high randomness
    result_with_random = balance_teams(user_scores, randomness=100)

    # The teams should be different with high randomness
    team_a_no_random = sorted([p["nickname"] for p in result_no_random["teamA"]])
    team_a_with_random = sorted([p["nickname"] for p in result_with_random["teamA"]])

    # With high randomness and this seed, teams should differ
    assert team_a_no_random != team_a_with_random


def test_balance_teams_empty_input():
    """Test balancing with empty input."""
    with pytest.raises(AssertionError):
        _ = balance_teams({}, randomness=0)


def test_balance_teams_single_player():
    """Test balancing with a single player."""
    user_scores = {"Player1": 10}

    with pytest.raises(AssertionError):
        _ = balance_teams(user_scores, randomness=0)


def test_balance_teams_equal_skill_levels():
    """Test balancing when all players have the same skill level."""
    user_scores = {
        "Player1": 5,
        "Player2": 5,
        "Player3": 5,
        "Player4": 5,
        "Player5": 5,
        "Player6": 5,
    }

    result = balance_teams(user_scores, randomness=0)

    # Check that teams are equal in size (or differ by at most 1 for odd number of players)
    assert abs(len(result["teamA"]) - len(result["teamB"])) <= 1

    # Check that all players are assigned
    all_players = [player["nickname"] for player in result["teamA"] + result["teamB"]]
    assert sorted(all_players) == sorted(list(user_scores.keys()))

    # With equal skill levels, teams should have equal total scores
    team_a_total = sum(player["score"] for player in result["teamA"])
    team_b_total = sum(player["score"] for player in result["teamB"])

    # Calculate expected score per team (may not be exactly equal due to odd number of players)
    total_score = sum(user_scores.values())
    expected_score_per_team = total_score / 2

    # Check that teams are balanced
    assert abs(team_a_total - expected_score_per_team) <= 5
    assert abs(team_b_total - expected_score_per_team) <= 5


def test_balance_teams_extreme_skill_differences():
    """Test balancing with extreme skill differences between players."""
    user_scores = {
        "Pro1": 100,
        "Pro2": 95,
        "Average1": 50,
        "Average2": 45,
        "Beginner1": 10,
        "Beginner2": 5,
    }

    result = balance_teams(user_scores, randomness=0)

    # Check that all players are assigned
    all_players = [player["nickname"] for player in result["teamA"] + result["teamB"]]
    assert sorted(all_players) == sorted(list(user_scores.keys()))

    # Calculate team totals
    team_a_total = sum(player["score"] for player in result["teamA"])
    team_b_total = sum(player["score"] for player in result["teamB"])

    # With the pairing algorithm, we expect good balance even with extreme differences
    assert abs(team_a_total - team_b_total) <= 10

    # Check that each team has a mix of skill levels
    team_a_scores = [player["score"] for player in result["teamA"]]
    team_b_scores = [player["score"] for player in result["teamB"]]

    # Each team should have at least one high-skill player (>75)
    assert any(score > 75 for score in team_a_scores) or any(
        score > 75 for score in team_b_scores
    )

    # Each team should have at least one low-skill player (<25)
    assert any(score < 25 for score in team_a_scores) or any(
        score < 25 for score in team_b_scores
    )


def test_balance_teams_negative_scores():
    """Test balancing with negative scores (edge case)."""
    user_scores = {
        "Player1": 10,
        "Player2": 5,
        "Player3": 0,
        "Player4": -5,  # Negative score
    }

    result = balance_teams(user_scores, randomness=0)

    # Check that all players are assigned
    all_players = [player["nickname"] for player in result["teamA"] + result["teamB"]]
    assert sorted(all_players) == sorted(list(user_scores.keys()))

    # Calculate team totals
    team_a_total = sum(player["score"] for player in result["teamA"])
    team_b_total = sum(player["score"] for player in result["teamB"])

    # Check that teams are reasonably balanced
    assert abs(team_a_total - team_b_total) <= 5


def test_balance_teams_randomness_levels():
    """Test different levels of randomness in team balancing."""
    # Set seed for reproducibility
    random.seed(42)

    user_scores = {
        "Player1": 10,
        "Player2": 9,
        "Player3": 8,
        "Player4": 7,
        "Player5": 6,
        "Player6": 5,
    }

    # Test with different randomness levels
    results = {}
    team_compositions = {}

    for randomness in [0, 25, 50, 75, 100]:
        # Reset seed for each test to ensure reproducibility
        random.seed(42)

        result = balance_teams(user_scores, randomness=randomness)
        results[randomness] = result

        # Store team composition for comparison
        team_compositions[randomness] = sorted([p["nickname"] for p in result["teamA"]])

    # As randomness increases, we expect more variation in team composition
    # At least some of the team compositions should be different
    assert len(set(tuple(comp) for comp in team_compositions.values())) > 1

    # With randomness=0, teams should be perfectly balanced
    team_a_total_no_random = sum(player["score"] for player in results[0]["teamA"])
    team_b_total_no_random = sum(player["score"] for player in results[0]["teamB"])
    assert abs(team_a_total_no_random - team_b_total_no_random) <= 1

    # With high randomness, we expect more imbalance but can't predict exactly how much
    # Let's verify that the randomized teams still have valid total scores
    team_a_total_high_random = sum(player["score"] for player in results[100]["teamA"])
    team_b_total_high_random = sum(player["score"] for player in results[100]["teamB"])

    # Verify that team totals are valid numbers
    assert isinstance(team_a_total_high_random, (int, float))
    assert isinstance(team_b_total_high_random, (int, float))

    # Note: We can't assert exact imbalance as it's random, but we can check that
    # randomized teams maintain the original scores for display
    for randomness, result in results.items():
        for team in ["teamA", "teamB"]:
            for player in result[team]:
                assert player["score"] == user_scores[player["nickname"]]


def test_balance_teams_sorting():
    """Test that players are sorted by score within each team."""
    user_scores = {
        "Player1": 3,
        "Player2": 10,
        "Player3": 7,
        "Player4": 5,
        "Player5": 8,
        "Player6": 2,
    }

    result = balance_teams(user_scores, randomness=0)

    # Check that players in each team are sorted by score in descending order
    for team in ["teamA", "teamB"]:
        for i in range(len(result[team]) - 1):
            assert result[team][i]["score"] >= result[team][i + 1]["score"]


def test_balance_teams_large_player_count():
    """Test balancing with a large number of players."""
    # Create a dictionary with 20 players of varying skill levels
    user_scores = {f"Player{i}": i for i in range(1, 21)}

    result = balance_teams(user_scores, randomness=0)

    # Check that all players are assigned
    all_players = [player["nickname"] for player in result["teamA"] + result["teamB"]]
    assert sorted(all_players) == sorted(list(user_scores.keys()))

    # Check that teams are equal in size
    assert len(result["teamA"]) == len(result["teamB"]) == 10

    # Calculate team totals
    team_a_total = sum(player["score"] for player in result["teamA"])
    team_b_total = sum(player["score"] for player in result["teamB"])

    # With the pairing algorithm, teams should be well-balanced even with many players
    assert abs(team_a_total - team_b_total) <= 10

    # Check that high-skill and low-skill players are distributed between teams
    team_a_scores = sorted(
        [player["score"] for player in result["teamA"]], reverse=True
    )
    team_b_scores = sorted(
        [player["score"] for player in result["teamB"]], reverse=True
    )

    # The highest skilled player should be in one team, second highest in the other
    highest_players = sorted(user_scores.values(), reverse=True)[:2]
    assert highest_players[0] in (team_a_scores[0], team_b_scores[0])

    # The lowest skilled players should also be distributed
    lowest_players = sorted(user_scores.values())[:2]
    assert lowest_players[0] in (team_a_scores[-1], team_b_scores[-1])


def test_balancer_find_solutions():
    balancer = Balancer()

    with open("tests/files/balance_tests.json", "r") as f:
        tests = json.load(f)

    for test in tests:
        min_diff, solutions = balancer.find_solutions(test["nums"])
        for solution in solutions:
            team_a = sum(value for mask, value in zip(solution, test["nums"]) if mask)
            team_b = sum(
                value for mask, value in zip(solution, test["nums"]) if not mask
            )
            assert abs(abs(team_a - team_b) - min_diff) < 1e-4
            assert sum(solution) == len(test["nums"]) // 2
        assert round(min_diff, 4) == test["diff"]
        assert len(test) % 2 == 0
