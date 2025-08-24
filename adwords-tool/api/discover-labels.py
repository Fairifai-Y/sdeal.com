#!/usr/bin/env python3
"""
Vercel serverless function for discover-labels endpoint
"""
import os
import sys
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

def load_env_vars():
    """Load environment variables for Vercel deployment"""
    if os.environ.get('VERCEL'):
        # Running on Vercel - environment variables are already set
        print("Running on Vercel - using environment variables")
        return True
    else:
        # Running locally - load from .env file
        print("Running locally - loading from .env file")
        project_root = Path(__file__).resolve().parents[2]
        env_file = project_root / ".env"
        
        if env_file.exists():
            env_vars = {}
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and ':' in line:
                        key, value = line.split(':', 1)
                        env_vars[key.strip()] = value.strip()
            
            for key, value in env_vars.items():
                os.environ[key] = value
            return True
        else:
            print(f"❌ .env file not found at: {env_file}")
            return False

def handler(request, context):
    """Vercel serverless function handler"""
    try:
        # Parse request
        if request.method != 'POST':
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': False, 'error': 'Method not allowed'})
            }
        
        # Parse JSON body
        try:
            data = json.loads(request.body) if hasattr(request, 'body') else json.loads(request.get('body', '{}'))
        except:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': False, 'error': 'Invalid JSON'})
            }
        
        print(f"Received data: {data}")  # Debug log
        
        customer_id = data.get('customer_id')
        label_index = data.get('label_index', 0)
        
        if not customer_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': False, 'error': 'Customer ID is required'})
            }
        
        # Load environment variables
        load_env_vars()
        
        try:
            # Use the client_utils to create Google Ads client
            from src.client_utils import load_env_and_create_client
            
            # Create Google Ads client
            client = load_env_and_create_client()
            ga_service = client.get_service("GoogleAdsService")
            
            # Build GAQL query for label discovery
            query = f"""
            SELECT 
                ad_group_criterion.custom_label_{label_index},
                metrics.impressions
            FROM ad_group_criterion 
            WHERE 
                ad_group_criterion.custom_label_{label_index} IS NOT NULL
                AND ad_group_criterion.custom_label_{label_index} != ''
            ORDER BY metrics.impressions DESC
            """
            
            print(f"Running GAQL query: {query}")
            
            # Execute query
            response = ga_service.search(customer_id=customer_id, query=query)
            
            # Process results
            labels = {}
            for row in response:
                label = getattr(row.ad_group_criterion, f'custom_label_{label_index}')
                impressions = row.metrics.impressions
                if label:
                    labels[label] = labels.get(label, 0) + impressions
            
            # Format output
            output_lines = []
            for label, impressions in sorted(labels.items(), key=lambda x: x[1], reverse=True):
                output_lines.append(f"'{label}': {impressions} impressions")
            
            output = "\n".join(output_lines)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': True,
                    'output': output,
                    'command': f'GAQL query for customer {customer_id}, label_index {label_index}',
                    'demo_mode': False
                })
            }
            
        except Exception as api_error:
            print(f"Google Ads API error: {api_error}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': False, 
                    'error': f'Google Ads API error: {str(api_error)}'
                })
            }
        
    except Exception as e:
        print(f"Exception: {e}")  # Debug log
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }
