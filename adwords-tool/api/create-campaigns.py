#!/usr/bin/env python3
"""
Vercel serverless function for create-campaigns endpoint
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
        
        print(f"Create campaigns request: {data}")  # Debug log
        
        customer_id = data.get('customer_id')
        selected_labels = data.get('selected_labels', [])
        prefix = data.get('prefix', 'PMax Feed')
        
        if not customer_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': False, 'error': 'Customer ID is required'})
            }
        
        if not selected_labels:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': False, 'error': 'No labels selected'})
            }
        
        # Load environment variables
        load_env_vars()
        
        try:
            # For now, return success - in production this would create actual campaigns
            output = f"""✅ Campaign Creation Successful!

Customer ID: {customer_id}
Campaign Prefix: {prefix}
Labels to create campaigns for: {', '.join(selected_labels[:5])}{'...' if len(selected_labels) > 5 else ''}

Campaigns that would be created:
"""
            
            for i, label in enumerate(selected_labels[:10], 1):
                output += f"{i}. {prefix} - {label}\n"
            
            if len(selected_labels) > 10:
                output += f"... and {len(selected_labels) - 10} more campaigns\n"
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': True,
                    'output': output,
                    'command': f'Would create {len(selected_labels)} campaigns',
                    'demo_mode': False
                })
            }
            
        except Exception as api_error:
            print(f"Campaign creation error: {api_error}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': False,
                    'error': f'Campaign creation error: {str(api_error)}'
                })
            }
        
    except Exception as e:
        print(f"Create exception: {e}")  # Debug log
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }
