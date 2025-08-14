"""Test script to check API version and connection."""

import os
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient

def main():
    # Load .env from parent directory
    project_root = Path(__file__).resolve().parent
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

    # Create client
    config_dict = {
        "developer_token": os.getenv("developer_token"),
        "client_id": os.getenv("client_id"),
        "client_secret": os.getenv("client_secret"),
        "refresh_token": os.getenv("refresh_token"),
        "login_customer_id": os.getenv("login_customer_id"),
        "use_proto_plus": True
    }
    
    client = GoogleAdsClient.load_from_dict(config_dict)
    
    # Test connection with a simple query
    customer_id = "5059126003"
    ga_service = client.get_service("GoogleAdsService")
    
    # Try a simple query
    query = "SELECT customer.id FROM customer LIMIT 1"
    
    try:
        response = ga_service.search(customer_id=customer_id, query=query)
        print("✅ Connection successful!")
        for row in response:
            print(f"Customer ID: {row.customer.id}")
            break
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"Error type: {type(e)}")

if __name__ == "__main__":
    main()
