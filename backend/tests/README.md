# Backend Tests

This directory contains tests for the Team Balancer backend using pytest.

## Test Structure

- `conftest.py` - Contains shared fixtures and test configuration
- `test_app.py` - Tests for basic application functionality
- `test_api_endpoints.py` - Tests for API endpoints
- `test_team_balancing.py` - Comprehensive tests for the team balancing algorithm, including:
  - Basic team balancing with even and odd numbers of players
  - Teams with equal skill levels
  - Teams with extreme skill differences
  - Edge cases (empty input, single player, negative scores)
  - Randomness feature testing
  - Sorting of players within teams
  - Large player counts
- `test_google_sheets.py` - Tests for Google Sheets integration

## Running Tests

The backend uses pytest for testing. To run all tests:

```bash
# Activate the virtual environment
source .venv/bin/activate

# Run all tests
python -m pytest

# Run tests with verbose output
python -m pytest -v

# Run a specific test file
python -m pytest tests/test_app.py

# Run a specific test
python -m pytest tests/test_app.py::test_app_exists
```

## Test Coverage

To check test coverage, install pytest-cov:

```bash
pip install pytest-cov
```

Then run:

```bash
python -m pytest --cov=app tests/
```

For a detailed HTML coverage report:

```bash
python -m pytest --cov=app --cov-report=html tests/
```

This will create a `htmlcov` directory with an HTML report.

## Adding New Tests

When adding new tests:

1. Follow the naming convention: test files should be named `test_*.py`
2. Test functions should be named `test_*`
3. Use fixtures from `conftest.py` where appropriate
4. Mock external dependencies (like Google Sheets API) to avoid actual API calls during testing
