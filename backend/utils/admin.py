#!/usr/bin/env python3
"""
Script to manage admins in the database.
This script can add a new admin or remove an existing admin.

For adding an admin:
    - Accepts a single admin-secret parameter in the format "admin:password"
    - Hashes the password with SHA256 and salt
    - Adds the admin to the database
    - Admin names must be unique (will reject if name already exists)

For removing an admin:
    - Accepts an admin name
    - Removes the admin from the database

Usage:
    python admin.py add "admin:password"
    python admin.py remove "admin"

Environment Variables:
    DB_PATH: Path to the SQLite database file
"""

import hashlib
import secrets
import typer

from . import db


def generate_salt():
    """
    Generate a random salt for password hashing.

    Returns:
        str: A random salt string
    """
    return secrets.token_hex(16)  # 32 character (16 byte) hex string


def hash_password_with_salt(password, salt=None):
    """
    Hash a password with SHA256 and a salt.

    Args:
        password (str): The password to hash
        salt (str, optional): The salt to use. If None, a new salt is generated.

    Returns:
        tuple: (hashed_password, salt)
    """
    if salt is None:
        salt = generate_salt()

    # Combine password and salt
    salted_password = password + salt

    # Hash the salted password
    hashed = hashlib.sha256(salted_password.encode()).hexdigest()

    # Return the hash and salt
    return hashed, salt


def add_admin_with_salted_password(name, password):
    """
    Add a new admin with a salted password hash directly using the db module.

    Args:
        name (str): Admin name
        password (str): Admin password (will be hashed with salt)

    Returns:
        int: ID of the newly created admin
    """
    # Generate hash and salt
    password_hash, salt = hash_password_with_salt(password)

    # Store the hash and salt together (format: hash:salt)
    combined_hash = f"{password_hash}:{salt}"

    try:
        # Add the admin directly using the db module
        admin_id = db.add_admin(name, combined_hash)
        return admin_id
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")


def remove_admin_by_name(name):
    """
    Remove an admin by name.

    Args:
        name (str): Admin name to remove

    Returns:
        bool: True if admin was removed, False if admin was not found
    """
    try:
        # Remove the admin directly using the db module
        success = db.remove_admin_by_name(name)
        return success
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")


app = typer.Typer(help="Manage admins in the database")


@app.command()
def add(
    admin_secret: str = typer.Argument(
        ..., help="Admin secret in format 'admin:password'"
    ),
):
    """Add a new admin to the database."""

    # Validate and parse admin secret
    if not admin_secret or ":" not in admin_secret:
        typer.echo("Error: Admin secret must be in format 'admin:password'")
        raise typer.Exit(code=1)

    # Split the admin secret into name and password
    name, password = admin_secret.split(":", 1)

    # Validate inputs
    if not name:
        typer.echo("Error: Admin name cannot be empty")
        raise typer.Exit(code=1)

    if not password:
        typer.echo("Error: Admin password cannot be empty")
        raise typer.Exit(code=1)

    try:
        # Add the admin
        admin_id = add_admin_with_salted_password(name, password)
        typer.echo(f"Admin '{name}' added successfully with ID: {admin_id}")
    except ValueError as e:
        # This is raised when admin already exists
        typer.echo(f"Error: {e}")
        raise typer.Exit(code=1)
    except Exception as e:
        typer.echo(f"Error: {e}")
        raise typer.Exit(code=1)


@app.command()
def remove(name: str = typer.Argument(..., help="Admin name to remove")):
    """Remove an existing admin from the database."""

    # Validate inputs
    if not name:
        typer.echo("Error: Admin name cannot be empty")
        raise typer.Exit(code=1)

    try:
        # Remove the admin
        success = remove_admin_by_name(name)
        if success:
            typer.echo(f"Admin '{name}' removed successfully")
        else:
            typer.echo(f"Admin '{name}' not found")
            raise typer.Exit(code=1)
    except Exception as e:
        typer.echo(f"Error: {e}")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
