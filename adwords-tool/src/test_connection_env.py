"""Quick connectivity test for Google Ads API using environment variables from .env.

Run:
  py -m pip install --user google-ads python-dotenv
  py -m src.test_connection_env
"""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

def main() -> None:
    # Doelaccount (zonder streepjes in GAQL-call)
    customer_id = "5059126003"

    # 1) Projectroot (= map boven /src) en .env laden
    project_root = Path(__file__).resolve().parents[1]
    # .env is in the parent directory (SDeal root)
    env_file = project_root.parent / ".env"
    
    # Load .env file manually since it uses : instead of =
    env_vars = {}
    if env_file.exists():
        print(f"Loading .env from: {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and ':' in line:
                    key, value = line.split(':', 1)
                    env_vars[key.strip()] = value.strip()
                    print(f"Loaded: {key.strip()} = {value.strip()[:10]}...")
    else:
        print(f"❌ .env file not found at: {env_file}")
    
    # Set environment variables
    for key, value in env_vars.items():
        os.environ[key] = value

    # 2) Environment variables ophalen
    developer_token = os.getenv("developer_token")
    client_id = os.getenv("client_id")
    client_secret = os.getenv("client_secret")
    refresh_token = os.getenv("refresh_token")
    login_customer_id = os.getenv("login_customer_id")
    use_proto_plus = os.getenv("use_proto_plus", "true").lower() == "true"

    print("Environment variables loaded:")
    print(f"- developer_token: {'*' * 10}{developer_token[-4:] if developer_token else 'None'}")
    print(f"- client_id: {client_id[:20] + '...' + client_id[-10:] if client_id else 'None'}")
    print(f"- client_secret: {'*' * 10}{client_secret[-4:] if client_secret else 'None'}")
    print(f"- refresh_token: {'*' * 10}{refresh_token[-4:] if refresh_token else 'None'}")
    print(f"- login_customer_id: {login_customer_id}")
    print(f"- use_proto_plus: {use_proto_plus}")

    # 3) Client maken met environment variables
    config_dict = {
        "developer_token": developer_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "login_customer_id": login_customer_id,
        "use_proto_plus": use_proto_plus
    }

    # Check if all required fields are present
    missing_fields = [k for k, v in config_dict.items() if not v and k != "use_proto_plus"]
    if missing_fields:
        print(f"❌ Missing required environment variables: {missing_fields}")
        return

    try:
        client = GoogleAdsClient.load_from_dict(config_dict)
        print("✅ Google Ads client created successfully")
        print(f"Effective login_customer_id = {getattr(client, 'login_customer_id', None)}")

        # 4) Simpele GAQL-rooktest
        ga_service = client.get_service("GoogleAdsService")
        query = (
            "SELECT customer.id, customer.descriptive_name, customer.currency_code, "
            "customer.time_zone FROM customer LIMIT 1"
        )

        response = ga_service.search(customer_id=customer_id, query=query)
        print("✅ Connectie geslaagd. Voorbeeldresultaat:")
        for row in response:
            cust = row.customer
            print(
                {
                    "id": cust.id,
                    "name": cust.descriptive_name,
                    "currency": cust.currency_code,
                    "time_zone": cust.time_zone,
                }
            )
            break

    except GoogleAdsException as exc:
        print("❌ Google Ads API error:", exc.error.code().name)
        for e in exc.failure.errors:
            print("-", e.error_code, e.message)
    except Exception as exc:
        print("❌ Onverwachte fout:", str(exc))

if __name__ == "__main__":
    main()
