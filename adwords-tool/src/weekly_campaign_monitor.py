#!/usr/bin/env python3
"""
Weekly Campaign Monitor for Google Ads PMax Campaigns

This script:
1. Checks existing campaigns for performance
2. Discovers new labels that don't have campaigns yet
3. Identifies empty campaigns (no impressions/conversions)
4. Automatically creates new campaigns for new labels
5. Optionally pauses empty campaigns

Usage:
    python weekly_campaign_monitor.py --customer 1234567890 --label-index 0 --prefix "PMax Feed"
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import time

# Add the src directory to Python path
sys.path.append(str(Path(__file__).parent))

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# Import functions from label_campaigns.py
from label_campaigns import (
    discover_labels, 
    _create_pmax_campaign, 
    _create_pmax_asset_group,
    add_listing_group_for_label,
    _add_campaign_criteria
)

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Weekly Campaign Monitor for PMax Campaigns")
    parser.add_argument("--customer", required=True, help="Target customer id (linked account)")
    parser.add_argument("--label-index", type=int, default=0, help="Which custom_label index to use (0..4)")
    parser.add_argument("--prefix", default="PMax Feed", help="Campaign name prefix to monitor")
    parser.add_argument("--daily-budget", type=float, default=5.0, help="Daily budget for new campaigns")
    parser.add_argument("--target-roas", type=float, default=None, help="Optional target ROAS for new campaigns")
    parser.add_argument("--merchant-id", default="", help="Override Merchant Center ID (optional)")
    parser.add_argument("--target-languages", type=str, default="it", help="Target languages (comma-separated)")
    parser.add_argument("--target-countries", type=str, default="IT", help="Target countries (comma-separated)")
    parser.add_argument("--feed-label", type=str, default="nl", help="Feed label for shopping setting")
    parser.add_argument("--min-impressions", type=int, default=100, help="Minimum impressions to consider campaign active")
    parser.add_argument("--min-conversions", type=int, default=0, help="Minimum conversions to consider campaign active")
    parser.add_argument("--days-back", type=int, default=7, help="Number of days to look back for performance data")
    parser.add_argument("--auto-pause-empty", action="store_true", help="Automatically pause empty campaigns")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--apply", action="store_true", help="Apply changes (default: false)")
    
    return parser.parse_args()

def get_existing_campaigns(client: GoogleAdsClient, customer_id: str, prefix: str) -> Dict[str, str]:
    """Get existing campaigns with the specified prefix."""
    ga = client.get_service("GoogleAdsService")
    query = f"""
        SELECT 
            campaign.id,
            campaign.name,
            campaign.status
        FROM campaign 
        WHERE campaign.name LIKE '{prefix}%'
        AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
    """
    
    campaigns = {}
    for row in ga.search(customer_id=customer_id, query=query):
        campaigns[row.campaign.name] = {
            'id': row.campaign.id,
            'status': row.campaign.status.name,
            'resource_name': f"customers/{customer_id}/campaigns/{row.campaign.id}"
        }
    
    return campaigns

def get_campaign_performance(client: GoogleAdsClient, customer_id: str, campaign_ids: List[str], days_back: int) -> Dict[str, Dict]:
    """Get performance data for campaigns in the last N days."""
    if not campaign_ids:
        return {}
    
    ga = client.get_service("GoogleAdsService")
    
    # For multiple campaigns, we need to use IN operator instead of OR
    if len(campaign_ids) == 1:
        query = f"""
            SELECT 
                campaign.id,
                metrics.impressions,
                metrics.conversions,
                metrics.cost_micros
            FROM campaign 
            WHERE campaign.id = {campaign_ids[0]}
            AND segments.date DURING LAST_{days_back}_DAYS
        """
    else:
        # Use IN operator for multiple campaign IDs
        campaign_ids_str = ",".join(campaign_ids)
        query = f"""
            SELECT 
                campaign.id,
                metrics.impressions,
                metrics.conversions,
                metrics.cost_micros
            FROM campaign 
            WHERE campaign.id IN ({campaign_ids_str})
            AND segments.date DURING LAST_{days_back}_DAYS
        """
    
    performance = {}
    for row in ga.search(customer_id=customer_id, query=query):
        campaign_id = str(row.campaign.id)
        performance[campaign_id] = {
            'impressions': int(row.metrics.impressions),
            'conversions': int(row.metrics.conversions),
            'cost_micros': int(row.metrics.cost_micros)
        }
    
    return performance

def identify_empty_campaigns(campaigns: Dict[str, Dict], performance: Dict[str, Dict], 
                           min_impressions: int, min_conversions: int) -> List[str]:
    """Identify campaigns that are considered empty based on performance criteria."""
    empty_campaigns = []
    
    for name, campaign_info in campaigns.items():
        campaign_id = campaign_info['id']
        perf = performance.get(campaign_id, {})
        
        impressions = perf.get('impressions', 0)
        conversions = perf.get('conversions', 0)
        
        if impressions < min_impressions and conversions < min_conversions:
            empty_campaigns.append(name)
            print(f"  [EMPTY] {name}: {impressions} impressions, {conversions} conversions")
    
    return empty_campaigns

def get_campaign_labels(client: GoogleAdsClient, customer_id: str, campaign_ids: List[str], label_index: int) -> Dict[str, str]:
    """Get the label value for each campaign based on asset group listing group filters."""
    if not campaign_ids:
        return {}
    
    ga = client.get_service("GoogleAdsService")
    
    # For multiple campaigns, we need to use IN operator instead of OR
    if len(campaign_ids) == 1:
        query = f"""
            SELECT 
                campaign.id,
                asset_group_listing_group_filter.case_value.product_custom_attribute.value
            FROM asset_group_listing_group_filter 
            WHERE campaign.id = {campaign_ids[0]}
            AND asset_group_listing_group_filter.case_value.product_custom_attribute.index = {label_index}
            AND asset_group_listing_group_filter.type = 'UNIT_INCLUDED'
        """
    else:
        # Use IN operator for multiple campaign IDs
        campaign_ids_str = ",".join(campaign_ids)
        query = f"""
            SELECT 
                campaign.id,
                asset_group_listing_group_filter.case_value.product_custom_attribute.value
            FROM asset_group_listing_group_filter 
            WHERE campaign.id IN ({campaign_ids_str})
            AND asset_group_listing_group_filter.case_value.product_custom_attribute.index = {label_index}
            AND asset_group_listing_group_filter.type = 'UNIT_INCLUDED'
        """
    
    campaign_labels = {}
    for row in ga.search(customer_id=customer_id, query=query):
        campaign_id = str(row.campaign.id)
        label_value = row.asset_group_listing_group_filter.case_value.product_custom_attribute.value
        campaign_labels[campaign_id] = label_value
    
    return campaign_labels

def find_new_labels(existing_labels: set, all_labels: Dict[str, int]) -> Dict[str, int]:
    """Find labels that don't have campaigns yet."""
    new_labels = {}
    for label, impressions in all_labels.items():
        if label not in existing_labels:
            new_labels[label] = impressions
    
    return new_labels

def create_campaign_for_label(client: GoogleAdsClient, customer_id: str, label: str, 
                            args: argparse.Namespace, timestamp: str) -> Optional[str]:
    """Create a new campaign for a specific label."""
    try:
        # Create campaign name
        safe_label = label.replace(" ", "_")[:40]
        campaign_name = f"{args.prefix} - {safe_label} - {timestamp}"
        
        print(f"  [CREATE] Creating campaign: {campaign_name}")
        
        if args.dry_run:
            print(f"    [DRY-RUN] Would create campaign: {campaign_name}")
            return None
        
        # Create campaign
        campaign_rn = _create_pmax_campaign(
            client=client,
            customer_id=customer_id,
            campaign_name=campaign_name,
            daily_budget_micros=int(round(args.daily_budget * 1_000_000)),
            campaign_target_roas=args.target_roas,
            is_feed_only=True,
            merchant_id=args.merchant_id,
            target_languages=args.target_languages,
            target_countries=args.target_countries,
            feed_label=args.feed_label,
        )
        
        # Create asset group
        asset_group_name = f"{campaign_name} - Asset Group"
        ag_rn = _create_pmax_asset_group(
            client=client,
            customer_id=customer_id,
            campaign_rn=campaign_rn,
            asset_group_name=asset_group_name,
            label_index=args.label_index,
            label_value=label,
            is_feed_only=True,
            merchant_id=args.merchant_id,
            target_languages=args.target_languages,
            target_countries=args.target_countries,
        )
        
        # Add listing group filter
        add_listing_group_for_label(client, customer_id, ag_rn, label, args.label_index)
        
        print(f"    [SUCCESS] Created campaign: {campaign_name}")
        return campaign_rn
        
    except Exception as e:
        print(f"    [ERROR] Failed to create campaign for {label}: {e}")
        return None

def pause_empty_campaign(client: GoogleAdsClient, customer_id: str, campaign_rn: str) -> bool:
    """Pause an empty campaign."""
    try:
        campaign_svc = client.get_service("CampaignService")
        op = client.get_type("CampaignOperation")
        campaign = op.update
        campaign.resource_name = campaign_rn
        campaign.status = client.enums.CampaignStatusEnum.PAUSED
        op.update_mask.CopyFrom(client.get_type("FieldMask")(paths=["status"]))
        
        result = campaign_svc.mutate_campaigns(customer_id=customer_id, operations=[op])
        print(f"    [PAUSED] Campaign paused: {campaign_rn}")
        return True
        
    except Exception as e:
        print(f"    [ERROR] Failed to pause campaign: {e}")
        return False

def main() -> None:
    """Main function for weekly campaign monitoring."""
    args = parse_args()
    
    # Load configuration
    cfg = os.getenv("GOOGLE_ADS_CONFIGURATION_FILE")
    if not cfg:
        cfg = str(Path(__file__).parent.parent / "config" / "google-ads.yaml")
    
    print(f"Config path = {cfg}")
    
    # Initialize client
    client = GoogleAdsClient.load_from_storage(cfg)
    customer_id = args.customer
    
    print(f"\n[WEEKLY MONITOR] Weekly Campaign Monitor for Customer {customer_id}")
    print(f"[DATE] Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[LABEL] Label Index: {args.label_index}")
    print(f"[THRESHOLD] Performance Threshold: {args.min_impressions} impressions, {args.min_conversions} conversions")
    print(f"[DAYS] Looking back: {args.days_back} days")
    print(f"[DRY RUN] Dry Run: {args.dry_run}")
    print(f"[APPLY] Apply Changes: {args.apply}")
    
    try:
        # 1. Get existing campaigns
        print(f"\n[STEP 1] Getting existing campaigns with prefix '{args.prefix}'...")
        existing_campaigns = get_existing_campaigns(client, customer_id, args.prefix)
        print(f"  Found {len(existing_campaigns)} existing campaigns")
        
        # 2. Get performance data
        print(f"\n[STEP 2] Getting campaign performance data...")
        campaign_ids = [campaign['id'] for campaign in existing_campaigns.values()]
        performance = get_campaign_performance(client, customer_id, campaign_ids, args.days_back)
        print(f"  Got performance data for {len(performance)} campaigns")
        
        # 3. Identify empty campaigns
        print(f"\n[STEP 3] Identifying empty campaigns...")
        empty_campaigns = identify_empty_campaigns(
            existing_campaigns, performance, args.min_impressions, args.min_conversions
        )
        print(f"  Found {len(empty_campaigns)} empty campaigns")
        
        # 4. Get labels for existing campaigns
        print(f"\n[STEP 4] Getting labels for existing campaigns...")
        campaign_labels = get_campaign_labels(client, customer_id, campaign_ids, args.label_index)
        existing_labels = set(campaign_labels.values())
        print(f"  Found {len(existing_labels)} existing labels")
        
        # 5. Discover all available labels
        print(f"\n[STEP 5] Discovering all available labels...")
        all_labels = discover_labels(client, customer_id, args.label_index)
        print(f"  Found {len(all_labels)} total labels")
        
        # 6. Find new labels that need campaigns
        print(f"\n[STEP 6] Finding new labels that need campaigns...")
        new_labels = find_new_labels(existing_labels, all_labels)
        print(f"  Found {len(new_labels)} new labels that need campaigns")
        
        if new_labels:
            print(f"\n[LABELS] New labels to create campaigns for:")
            for label, impressions in sorted(new_labels.items(), key=lambda x: x[1], reverse=True):
                print(f"  - {label}: {impressions} impressions")
        
        # 7. Create campaigns for new labels
        if new_labels and args.apply and not args.dry_run:
            print(f"\n[STEP 7] Creating campaigns for new labels...")
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            
            created_campaigns = []
            for label, impressions in sorted(new_labels.items(), key=lambda x: x[1], reverse=True):
                campaign_rn = create_campaign_for_label(client, customer_id, label, args, timestamp)
                if campaign_rn:
                    created_campaigns.append(campaign_rn)
                time.sleep(1)  # Small delay to avoid rate limiting
            
            print(f"  Created {len(created_campaigns)} new campaigns")
        
        # 8. Handle empty campaigns
        if empty_campaigns and args.auto_pause_empty and args.apply and not args.dry_run:
            print(f"\n[STEP 8] Handling empty campaigns...")
            paused_count = 0
            for campaign_name in empty_campaigns:
                campaign_rn = existing_campaigns[campaign_name]['resource_name']
                if pause_empty_campaign(client, customer_id, campaign_rn):
                    paused_count += 1
                time.sleep(1)  # Small delay to avoid rate limiting
            
            print(f"  Paused {len(empty_campaigns)} empty campaigns")
        
        # Summary
        print(f"\n[SUMMARY] Summary:")
        print(f"  - Existing campaigns: {len(existing_campaigns)}")
        print(f"  - Empty campaigns: {len(empty_campaigns)}")
        print(f"  - New labels found: {len(new_labels)}")
        if args.apply and not args.dry_run:
            print(f"  - Campaigns created: {len(new_labels) if new_labels else 0}")
            if args.auto_pause_empty:
                print(f"  - Campaigns paused: {len(empty_campaigns) if empty_campaigns else 0}")
        
        print(f"\n[SUCCESS] Weekly campaign monitoring completed!")
        
    except GoogleAdsException as ex:
        print(f"\n[ERROR] Google Ads API error: {ex}")
        for error in ex.failure.errors:
            print(f"  Error: {error.message}")
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    print(f"    Field: {field_path_element.field_name}")
        return 1
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
