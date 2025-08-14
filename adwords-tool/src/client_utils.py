"""Utility functions for creating Google Ads client from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

def load_env_and_create_client():
    """
    Load environment variables from .env and create Google Ads client.
    
    Returns:
        GoogleAdsClient: Configured Google Ads client
        
    Raises:
        ValueError: If required environment variables are missing
        GoogleAdsException: If client creation fails
    """
    # Load .env from project root (two levels up from src)
    project_root = Path(__file__).resolve().parents[1]
    # .env is in the parent directory (SDeal root)
    env_file = project_root.parent / ".env"
    
    # Load .env file manually since it uses : instead of =
    env_vars = {}
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and ':' in line:
                    key, value = line.split(':', 1)
                    env_vars[key.strip()] = value.strip()
    
    # Set environment variables
    for key, value in env_vars.items():
        os.environ[key] = value
    
    # Get environment variables
    developer_token = os.getenv("developer_token")
    client_id = os.getenv("client_id")
    client_secret = os.getenv("client_secret")
    refresh_token = os.getenv("refresh_token")
    login_customer_id = os.getenv("login_customer_id")
    use_proto_plus = os.getenv("use_proto_plus", "true").lower() == "true"
    
    # Validate required fields
    required_fields = {
        "developer_token": developer_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "login_customer_id": login_customer_id
    }
    
    missing_fields = [k for k, v in required_fields.items() if not v]
    if missing_fields:
        raise ValueError(f"Missing required environment variables: {missing_fields}")
    
    # Create config dictionary
    config_dict = {
        "developer_token": developer_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "login_customer_id": login_customer_id,
        "use_proto_plus": use_proto_plus
    }
    
    # Create and return client
    return GoogleAdsClient.load_from_dict(config_dict)

def get_project_root():
    """Get the project root directory (where .env is located)."""
    return Path(__file__).resolve().parents[1]
