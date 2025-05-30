from datetime import date, timedelta


def get_last_month_date_range(days_shift=0):
    """
    Calculates the start and end dates for the entirety of the previous month.

    Returns:
        tuple: A tuple containing two strings (start_date_str, end_date_str)
               for the last month, formatted as 'YYYY-MM-DD'.
               Example: ('2025-04-01', '2025-04-30') if today is in May 2025.
    """
    today = date.today() + timedelta(days=days_shift)
    # First day of the current month
    first_day_current_month = today.replace(day=1)
    # Last day of the previous month (is first day of current month minus one day)
    end = first_day_current_month - timedelta(days=1)
    # First day of the previous month (is the last day of previous month, with day set to 1)
    start = end.replace(day=1)

    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def date_days_ago(days_ago):
    return (date.today() - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def date_month_ago():
    return date_days_ago(30)
