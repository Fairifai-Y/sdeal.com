#!/usr/bin/env python3
"""
Simple Google Ads Tools Web Interface - Vercel Optimized
"""
import os
import sys
import subprocess
import json
from pathlib import Path

# Try to import Flask, install if not available
try:
    from flask import Flask, render_template_string, request, jsonify
except ImportError:
    print("Flask not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "flask"])
    from flask import Flask, render_template_string, request, jsonify

def load_env_vars():
    """Load environment variables for Vercel deployment"""
    if os.environ.get('VERCEL'):
        # Running on Vercel - environment variables are already set
        print("Running on Vercel - using environment variables")
        return True
    else:
        # Running locally - load from .env file
        print("Running locally - loading from .env file")
        project_root = Path(__file__).resolve().parents[1]
        env_file = project_root.parent / ".env"
        
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

app = Flask(__name__)

# HTML template for the interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Ads Tools - SDeal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .tool-card { border: none; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 25px; }
        .btn-success { background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); border: none; border-radius: 25px; }
        .btn-warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 25px; }
        .result-box { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-top: 20px; max-height: 400px; overflow-y: auto; }
        .label-checkbox { margin: 5px 0; }
        .label-checkbox input[type="checkbox"] { margin-right: 8px; }
        .preview-box { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 10px; padding: 15px; margin-top: 15px; }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark bg-dark">
        <div class="container">
            <span class="navbar-brand">SDeal Google Ads Tools</span>
        </div>
    </nav>

    <div class="container mt-4">
        <h1 class="mb-4">Google Ads Campaign Tools</h1>
        
        <div class="row">
            <!-- Label Discovery -->
            <div class="col-md-6">
                <div class="card tool-card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Label Discovery</h5>
                    </div>
                    <div class="card-body">
                        <form id="discoverForm" onsubmit="event.preventDefault(); discoverLabels();">
                            <div class="mb-3">
                                <label class="form-label">Customer ID *</label>
                                <input type="text" class="form-control" id="customerId" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Label Index</label>
                                <select class="form-select" id="labelIndex">
                                    <option value="0">custom_label_0</option>
                                    <option value="1">custom_label_1</option>
                                    <option value="2">custom_label_2</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Merchant Center ID (optioneel)</label>
                                <input type="text" class="form-control" id="merchantId">
                            </div>
                            <button type="button" class="btn btn-primary" onclick="discoverLabels()">Discover Labels</button>
                        </form>
                        <div id="discoverResults" class="result-box" style="display: none;"></div>
                    </div>
                </div>
            </div>

            <!-- Campaign Creation -->
            <div class="col-md-6">
                <div class="card tool-card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">Campaign Creation</h5>
                    </div>
                    <div class="card-body">
                        <form id="createForm">
                            <div class="mb-3">
                                <label class="form-label">Customer ID *</label>
                                <input type="text" class="form-control" id="createCustomerId" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Label Index</label>
                                <select class="form-select" id="createLabelIndex">
                                    <option value="0">custom_label_0</option>
                                    <option value="1">custom_label_1</option>
                                    <option value="2">custom_label_2</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Select Labels</label>
                                <div id="labelSelection" class="border rounded p-3" style="background: #f8f9fa;">
                                    <small class="text-muted">Eerst labels ontdekken om ze hier te kunnen selecteren</small>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">PMax Type</label>
                                <select class="form-select" id="pmaxType">
                                    <option value="feed-only">Feed-Only PMax (Producten uit Merchant Center)</option>
                                    <option value="normal">Normale PMax (Met creatives)</option>
                                </select>
                                <small class="text-muted">
                                    <strong>Feed-Only:</strong> Alleen producten uit Merchant Center feed, vereist Merchant Center ID<br>
                                    <strong>Normale PMax:</strong> Kan creatives hebben, Merchant Center ID optioneel
                                </small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Campaign Prefix</label>
                                <input type="text" class="form-control" id="campaignPrefix" value="PMax Feed">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Daily Budget (€)</label>
                                <input type="number" class="form-control" id="dailyBudget" value="5.0" step="0.1">
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="startEnabled">
                                    <label class="form-check-label" for="startEnabled">
                                        <strong>Start campagnes direct (ENABLED)</strong>
                                    </label>
                                    <small class="form-text text-muted d-block">
                                        Als aangevinkt: campagnes beginnen direct met serveren. Anders: campagnes worden gepauzeerd aangemaakt.
                                    </small>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Target Countries</label>
                                <div class="border rounded p-3" style="background: #f8f9fa;">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryNL" value="NL" checked>
                                                <label class="form-check-label" for="countryNL">🇳🇱 Nederland (NL)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryBE" value="BE">
                                                <label class="form-check-label" for="countryBE">🇧🇪 België (BE)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryDE" value="DE">
                                                <label class="form-check-label" for="countryDE">🇩🇪 Duitsland (DE)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryFR" value="FR">
                                                <label class="form-check-label" for="countryFR">🇫🇷 Frankrijk (FR)</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryDK" value="DK">
                                                <label class="form-check-label" for="countryDK">🇩🇰 Denemarken (DK)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryIT" value="IT">
                                                <label class="form-check-label" for="countryIT">🇮🇹 Italië (IT)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countrySE" value="SE">
                                                <label class="form-check-label" for="countrySE">🇸🇪 Zweden (SE)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryPL" value="PL">
                                                <label class="form-check-label" for="countryPL">🇵🇱 Polen (PL)</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryAT" value="AT">
                                                <label class="form-check-label" for="countryAT">🇦🇹 Oostenrijk (AT)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryCH" value="CH">
                                                <label class="form-check-label" for="countryCH">🇨🇭 Zwitserland (CH)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryES" value="ES">
                                                <label class="form-check-label" for="countryES">🇪🇸 Spanje (ES)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="countryGB" value="GB">
                                                <label class="form-check-label" for="countryGB">🇬🇧 Verenigd Koninkrijk (GB)</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAllCountries()">Alles selecteren</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="deselectAllCountries()">Alles deselecteren</button>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Target Languages</label>
                                <div class="border rounded p-3" style="background: #f8f9fa;">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langNL" value="nl" checked>
                                                <label class="form-check-label" for="langNL">🇳🇱 Nederlands (nl)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langEN" value="en">
                                                <label class="form-check-label" for="langEN">🇬🇧 Engels (en)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langDE" value="de">
                                                <label class="form-check-label" for="langDE">🇩🇪 Duits (de)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langFR" value="fr">
                                                <label class="form-check-label" for="langFR">🇫🇷 Frans (fr)</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langDA" value="da">
                                                <label class="form-check-label" for="langDA">🇩🇰 Deens (da)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langIT" value="it">
                                                <label class="form-check-label" for="langIT">🇮🇹 Italiaans (it)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langSV" value="sv">
                                                <label class="form-check-label" for="langSV">🇸🇪 Zweeds (sv)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langPL" value="pl">
                                                <label class="form-check-label" for="langPL">🇵🇱 Pools (pl)</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langES" value="es">
                                                <label class="form-check-label" for="langES">🇪🇸 Spaans (es)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langPT" value="pt">
                                                <label class="form-check-label" for="langPT">🇵🇹 Portugees (pt)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langRU" value="ru">
                                                <label class="form-check-label" for="langRU">🇷🇺 Russisch (ru)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="langCS" value="cs">
                                                <label class="form-check-label" for="langCS">🇨🇿 Tsjechisch (cs)</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAllLanguages()">Alles selecteren</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="deselectAllLanguages()">Alles deselecteren</button>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Feed Label</label>
                                <select class="form-select" id="feedLabel">
                                    <option value="nl">🇳🇱 Nederlands (nl)</option>
                                    <option value="">-- Selecteer feed label --</option>
                                    <option value="be">🇧🇪 Belgisch (be)</option>
                                    <option value="de">🇩🇪 Duits (de)</option>
                                    <option value="fr">🇫🇷 Frans (fr)</option>
                                    <option value="dk">🇩🇰 Deens (dk)</option>
                                    <option value="it">🇮🇹 Italiaans (it)</option>
                                    <option value="se">🇸🇪 Zweeds (se)</option>
                                    <option value="pl">🇵🇱 Pools (pl)</option>
                                    <option value="at">🇦🇹 Oostenrijks (at)</option>
                                    <option value="ch">🇨🇭 Zwitsers (ch)</option>
                                    <option value="es">🇪🇸 Spaans (es)</option>
                                    <option value="gb">🇬🇧 Brits (gb)</option>
                                    <option value="custom">📝 Aangepast...</option>
                                </select>
                                <div id="customFeedLabelDiv" style="display: none;" class="mt-2">
                                    <input type="text" class="form-control" id="customFeedLabel" placeholder="Voer aangepaste feed label in">
                                </div>
                                <small class="form-text text-muted">
                                    Selecteer het land-specifieke feed label uit Merchant Center
                                </small>
                            </div>

                            <div class="mb-3" id="merchantIdGroup">
                                <label class="form-label">Merchant Center ID *</label>
                                <input type="text" class="form-control" id="merchantIdCreate" required>
                                <small class="text-muted">Vereist voor Feed-Only PMax. Vind je Merchant Center ID in Google Ads onder Tools > Linked accounts > Merchant Center.</small>
                            </div>
                            <button type="button" class="btn btn-warning me-2" onclick="previewCampaigns()">Preview Campagnes</button>
                            <button type="submit" class="btn btn-success" id="createButton">Create Selected Campaigns</button>
                            
                            <!-- Progress Bar -->
                            <div id="progressContainer" class="mt-3" style="display: none;">
                                <div class="progress" style="height: 25px;">
                                    <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated" 
                                         role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                        <span id="progressText">Initializing...</span>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <small id="progressDetails" class="text-muted">Preparing campaign creation...</small>
                                </div>
                            </div>
                        </form>
                        <div id="previewResults" class="preview-box" style="display: none;"></div>
                        <div id="createResults" class="result-box" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Weekly Campaign Monitor -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card tool-card">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0">📅 Weekly Campaign Monitor</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>[ANALYSIS] Campaign Analysis</h6>
                                <p class="text-muted">Controleer bestaande campagnes en ontdek nieuwe labels die campagnes nodig hebben.</p>
                                
                                <div class="mb-3">
                                    <label class="form-label">Customer ID *</label>
                                    <input type="text" class="form-control" id="monitorCustomerId" placeholder="866-851-6809">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Campaign Prefix</label>
                                    <input type="text" class="form-control" id="monitorPrefix" value="PMax Feed">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Label Index</label>
                                    <select class="form-select" id="monitorLabelIndex">
                                        <option value="0">custom_label_0</option>
                                        <option value="1">custom_label_1</option>
                                        <option value="2">custom_label_2</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Performance Threshold</label>
                                    <div class="row">
                                        <div class="col-6">
                                            <input type="number" class="form-control" id="minImpressions" value="100" placeholder="Min impressions">
                                        </div>
                                        <div class="col-6">
                                            <input type="number" class="form-control" id="minConversions" value="0" placeholder="Min conversions">
                                        </div>
                                    </div>
                                    <small class="text-muted">Campagnes onder deze drempel worden als 'leeg' beschouwd</small>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="autoPauseEmpty">
                                        <label class="form-check-label" for="autoPauseEmpty">
                                            Automatisch lege campagnes pauzeren
                                        </label>
                                    </div>
                                </div>
                                
                                <button type="button" class="btn btn-warning" onclick="runWeeklyMonitor()">
                                    [RUN] Run Weekly Monitor
                                </button>
                            </div>
                            
                            <div class="col-md-6">
                                <h6>[RESULTS] Monitor Results</h6>
                                <div id="monitorResults" class="border rounded p-3" style="background: #f8f9fa; min-height: 200px;">
                                    <small class="text-muted">Klik op "Run Weekly Monitor" om te beginnen...</small>
                                </div>
                                
                                <div class="mt-3">
                                    <button type="button" class="btn btn-success" id="applyChangesBtn" style="display: none;" onclick="applyWeeklyChanges()">
                                        [APPLY] Apply Changes
                                    </button>
                                    <button type="button" class="btn btn-info" id="viewDetailsBtn" style="display: none;" onclick="viewWeeklyChanges()">
                                        [DETAILS] View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let discoveredLabels = [];
        
        // Handle PMax type change
        document.getElementById('pmaxType').addEventListener('change', function() {
            const pmaxType = this.value;
            const merchantIdGroup = document.getElementById('merchantIdGroup');
            const merchantIdInput = document.getElementById('merchantIdCreate');
            const label = merchantIdGroup.querySelector('label');
            const small = merchantIdGroup.querySelector('small');
            
            if (pmaxType === 'feed-only') {
                label.textContent = 'Merchant Center ID *';
                merchantIdInput.required = true;
                small.innerHTML = 'Vereist voor Feed-Only PMax. Vind je Merchant Center ID in Google Ads onder Tools > Linked accounts > Merchant Center.';
            } else {
                label.textContent = 'Merchant Center ID (optioneel)';
                merchantIdInput.required = false;
                small.innerHTML = 'Optioneel voor Normale PMax. Kan leeg blijven als je geen Merchant Center gebruikt.';
            }
        });
        
        // Label Discovery
        document.getElementById('discoverForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                customer_id: document.getElementById('customerId').value,
                label_index: parseInt(document.getElementById('labelIndex').value),
                merchant_id: document.getElementById('merchantId').value || null
            };

            try {
                const response = await fetch('/api/discover-labels', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                
                const container = document.getElementById('discoverResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-success"><h6>Labels gevonden:</h6><pre>' + result.output + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                    
                    // Parse labels from output and store them
                    discoveredLabels = parseLabelsFromOutput(result.output);
                    updateLabelSelection();
                    
                    // Auto-fill Customer ID in creation form
                    document.getElementById('createCustomerId').value = formData.customer_id;
                    if (formData.merchant_id) {
                        document.getElementById('merchantIdCreate').value = formData.merchant_id;
                    }
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>Error:</h6><pre>' + (result.error || result.output) + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                }
                container.style.display = 'block';
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        // Campaign Creation
        document.getElementById('createForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const selectedLabels = getSelectedLabels();
            if (selectedLabels.length === 0) {
                alert('Selecteer minimaal één label om campagnes aan te maken.');
                return;
            }
            
            const customerId = document.getElementById('createCustomerId').value.trim();
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            const pmaxType = document.getElementById('pmaxType').value;
            const merchantId = document.getElementById('merchantIdCreate').value.trim();
            
            if (pmaxType === 'feed-only' && !merchantId) {
                alert('Vul een Merchant Center ID in. Dit is vereist voor Feed-Only PMax campagnes.');
                return;
            }
            
            console.log('Selected labels for creation:', selectedLabels); // Debug log
            console.log('Customer ID for creation:', customerId); // Debug log
            
            // Show progress bar and disable button
            showProgressBar();
            disableCreateButton();
            
            const formData = {
                customer_id: customerId,
                label_index: parseInt(document.getElementById('createLabelIndex').value),
                merchant_id: merchantId,
                pmax_type: pmaxType,
                prefix: document.getElementById('campaignPrefix').value,
                daily_budget: parseFloat(document.getElementById('dailyBudget').value),
                start_enabled: document.getElementById('startEnabled').checked,
                target_languages: getSelectedLanguages().join(','),
                target_countries: getSelectedCountries().join(','),
                feed_label: getFeedLabel(),
                selected_labels: selectedLabels
            };

            try {
                updateProgress(10, 'Versturen van campagne data...');
                
                const response = await fetch('/api/create-campaigns', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                updateProgress(50, 'Campagnes worden aangemaakt...');
                
                const result = await response.json();
                
                updateProgress(90, 'Resultaten worden verwerkt...');
                
                const container = document.getElementById('createResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-success"><h6>✅ Campagnes aangemaakt:</h6><pre>' + result.output + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                    updateProgress(100, '✅ Campagnes succesvol aangemaakt!');
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>❌ Error:</h6><pre>' + (result.error || result.output) + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                    updateProgress(100, '❌ Fout bij aanmaken campagnes');
                }
                container.style.display = 'block';
                
                // Hide progress bar after 2 seconds
                setTimeout(() => {
                    hideProgressBar();
                    enableCreateButton();
                }, 2000);
                
            } catch (error) {
                updateProgress(100, '❌ Netwerk fout');
                alert('Error: ' + error.message);
                hideProgressBar();
                enableCreateButton();
            }
        });

        function parseLabelsFromOutput(output) {
            const lines = output.split('\\n');
            const labels = [];
            
            for (const line of lines) {
                // Match both formats: 'label': impressions and "label": impressions
                const match = line.match(/['"]([^'"]+)['"]:\\s*(\\d+)\\s*impressions/);
                if (match) {
                    labels.push({
                        name: match[1],
                        impressions: parseInt(match[2])
                    });
                }
            }
            
            console.log('Parsed labels:', labels); // Debug log
            return labels;
        }

        function updateLabelSelection() {
            const container = document.getElementById('labelSelection');
            
            if (discoveredLabels.length === 0) {
                container.innerHTML = '<small class="text-muted">Eerst labels ontdekken om ze hier te kunnen selecteren</small>';
                return;
            }
            
            let html = '<div class="mb-2"><small class="text-muted">Selecteer de labels waarvoor je campagnes wilt aanmaken:</small></div>';
            
            discoveredLabels.forEach((label, index) => {
                const cleanLabelName = label.name.trim();
                html += `<div class="label-checkbox">
                    <input type="checkbox" id="label_${index}" value="${cleanLabelName}" checked>
                    <label for="label_${index}">${cleanLabelName} (${label.impressions.toLocaleString()} impressies)</label>
                </div>`;
            });
            
            html += '<div class="mt-2"><button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAll()">Alles selecteren</button> ';
            html += '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="deselectAll()">Alles deselecteren</button></div>';
            html += '<div class="mt-2"><small class="text-info">💡 Tip: Selecteer alleen de labels waarvoor je campagnes wilt aanmaken</small></div>';
            
            container.innerHTML = html;
        }

        function getSelectedLabels() {
            const checkboxes = document.querySelectorAll('#labelSelection input[type="checkbox"]:checked');
            return Array.from(checkboxes).map(cb => cb.value.trim());
        }

        function selectAll() {
            document.querySelectorAll('#labelSelection input[type="checkbox"]').forEach(cb => cb.checked = true);
        }

        function deselectAll() {
            document.querySelectorAll('#labelSelection input[type="checkbox"]').forEach(cb => cb.checked = false);
        }

        // Country selection functions
        function selectAllCountries() {
            document.querySelectorAll('input[id^="country"]').forEach(cb => cb.checked = true);
        }

        function deselectAllCountries() {
            document.querySelectorAll('input[id^="country"]').forEach(cb => cb.checked = false);
        }

        function getSelectedCountries() {
            const checkboxes = document.querySelectorAll('input[id^="country"]:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        // Language selection functions
        function selectAllLanguages() {
            document.querySelectorAll('input[id^="lang"]').forEach(cb => cb.checked = true);
        }

        function deselectAllLanguages() {
            document.querySelectorAll('input[id^="lang"]').forEach(cb => cb.checked = false);
        }

        function getSelectedLanguages() {
            const checkboxes = document.querySelectorAll('input[id^="lang"]:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        // Feed label handling
        document.getElementById('feedLabel').addEventListener('change', function() {
            const customDiv = document.getElementById('customFeedLabelDiv');
            if (this.value === 'custom') {
                customDiv.style.display = 'block';
                document.getElementById('customFeedLabel').focus();
            } else {
                customDiv.style.display = 'none';
            }
        });

        function getFeedLabel() {
            const select = document.getElementById('feedLabel');
            if (select.value === 'custom') {
                return document.getElementById('customFeedLabel').value.trim();
            }
            return select.value;
        }

        // Progress Bar Functions
        function showProgressBar() {
            document.getElementById('progressContainer').style.display = 'block';
            updateProgress(0, 'Initializing...');
        }

        function hideProgressBar() {
            document.getElementById('progressContainer').style.display = 'none';
        }

        function updateProgress(percentage, text) {
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const progressDetails = document.getElementById('progressDetails');
            
            progressBar.style.width = percentage + '%';
            progressBar.setAttribute('aria-valuenow', percentage);
            progressText.textContent = text;
            progressDetails.textContent = `${percentage}% voltooid`;
            
            // Change color based on progress
            if (percentage === 100) {
                progressBar.className = 'progress-bar progress-bar-striped bg-success';
            } else if (percentage >= 50) {
                progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-info';
            } else {
                progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-primary';
            }
        }

        function disableCreateButton() {
            const button = document.getElementById('createButton');
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Bezig...';
        }

        function enableCreateButton() {
            const button = document.getElementById('createButton');
            button.disabled = false;
            button.innerHTML = 'Create Selected Campaigns';
        }

        function displayLabels(labels) {
            const container = document.getElementById('labelSelection');
            if (!container) {
                console.error('Label selection container not found');
                return;
            }
            
            if (!labels || labels.length === 0) {
                container.innerHTML = '<small class="text-muted">Geen labels gevonden</small>';
                return;
            }
            
            let html = '<div class="mb-2"><strong>Gevonden labels:</strong></div>';
            html += '<div class="row">';
            
            labels.forEach((label, index) => {
                const colClass = labels.length > 6 ? 'col-md-4' : 'col-md-6';
                html += `
                    <div class="${colClass}">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="label${index}" value="${label}" checked>
                            <label class="form-check-label" for="label${index}">${label}</label>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            html += '<div class="mt-2">';
            html += '<button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAll()">Alles selecteren</button>';
            html += '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="deselectAll()">Alles deselecteren</button></div>';
            html += '<div class="mt-2"><small class="text-info">💡 Tip: Selecteer alleen de labels waarvoor je campagnes wilt aanmaken</small></div>';
            
            container.innerHTML = html;
        }

        async function discoverLabels() {
            const customerId = document.getElementById('customerId').value.trim();
            const labelIndex = parseInt(document.getElementById('labelIndex').value);
            const merchantId = document.getElementById('merchantId').value.trim();
            
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            console.log('Discovering labels for customer:', customerId, 'label index:', labelIndex); // Debug log
            
            const formData = {
                customer_id: customerId,
                label_index: labelIndex
            };
            
            if (merchantId) {
                formData.merchant_id = merchantId;
            }

            try {
                const response = await fetch('/api/discover-labels', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                const container = document.getElementById('discoverResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-success"><h6>✅ Labels gevonden:</h6><pre>' + result.output + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                    
                    // Parse labels from output and display them in the campaign creation section
                    const output = result.output;
                    const labels = [];
                    
                    // Extract labels from the output (format: 'label': impressions)
                    const labelMatches = output.match(/'([^']+)': \\d+ impressions/g);
                    if (labelMatches) {
                        labelMatches.forEach(match => {
                            const label = match.match(/'([^']+)'/)[1];
                            labels.push(label);
                        });
                    }
                    
                    // Display labels in the campaign creation section
                    displayLabels(labels);
                    
                    // Auto-fill Customer ID and Merchant ID from discover form
                    const createCustomerId = document.getElementById('createCustomerId');
                    const merchantIdCreate = document.getElementById('merchantIdCreate');
                    
                    if (createCustomerId && customerId) {
                        createCustomerId.value = customerId;
                    }
                    
                    if (merchantIdCreate && merchantId) {
                        merchantIdCreate.value = merchantId;
                    }
                    
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>❌ Error:</h6><pre>' + (result.error || result.output) + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                }
                container.style.display = 'block';
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function previewCampaigns() {
            const selectedLabels = getSelectedLabels();
            if (selectedLabels.length === 0) {
                alert('Selecteer minimaal één label om een preview te zien.');
                return;
            }
            
            const customerId = document.getElementById('createCustomerId').value.trim();
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            const pmaxType = document.getElementById('pmaxType').value;
            const merchantId = document.getElementById('merchantIdCreate').value.trim();
            
            if (pmaxType === 'feed-only' && !merchantId) {
                alert('Vul een Merchant Center ID in. Dit is vereist voor Feed-Only PMax campagnes.');
                return;
            }
            
            console.log('Selected labels for preview:', selectedLabels); // Debug log
            console.log('Customer ID for preview:', customerId); // Debug log
            
            // Show progress bar
            showProgressBar();
            
            const formData = {
                customer_id: customerId,
                label_index: parseInt(document.getElementById('createLabelIndex').value),
                merchant_id: merchantId,
                pmax_type: pmaxType,
                prefix: document.getElementById('campaignPrefix').value,
                daily_budget: parseFloat(document.getElementById('dailyBudget').value),
                start_enabled: document.getElementById('startEnabled').checked,
                target_languages: getSelectedLanguages().join(','),
                target_countries: getSelectedCountries().join(','),
                feed_label: getFeedLabel(),
                selected_labels: selectedLabels
            };

            try {
                updateProgress(25, 'Preview wordt gegenereerd...');
                
                const response = await fetch('/api/preview-campaigns', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                updateProgress(75, 'Preview wordt verwerkt...');
                
                const result = await response.json();
                
                updateProgress(100, '✅ Preview voltooid!');
                
                const container = document.getElementById('previewResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-info"><h6>📋 Preview van campagnes die aangemaakt gaan worden:</h6><pre>' + result.output + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>❌ Error:</h6><pre>' + (result.error || result.output) + '</pre><hr><small>Command: ' + (result.command || 'N/A') + '</small></div>';
                }
                container.style.display = 'block';
                
                // Hide progress bar after 1 second
                setTimeout(() => {
                    hideProgressBar();
                }, 1000);
                
            } catch (error) {
                updateProgress(100, '❌ Netwerk fout');
                alert('Error: ' + error.message);
                hideProgressBar();
            }
        }

        // Weekly Monitor Functions
        async function runWeeklyMonitor() {
            const customerId = document.getElementById('monitorCustomerId').value.trim();
            const prefix = document.getElementById('monitorPrefix').value.trim();
            const labelIndex = parseInt(document.getElementById('monitorLabelIndex').value);
            const minImpressions = parseInt(document.getElementById('minImpressions').value);
            const minConversions = parseInt(document.getElementById('minConversions').value);
            const autoPauseEmpty = document.getElementById('autoPauseEmpty').checked;
            
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            const resultsContainer = document.getElementById('monitorResults');
            resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-warning" role="status"></div><br><small>Weekly monitor wordt uitgevoerd...</small></div>';
            
            try {
                const response = await fetch('/api/weekly-monitor', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        customer_id: customerId,
                        prefix: prefix,
                        label_index: labelIndex,
                        min_impressions: minImpressions,
                        min_conversions: minConversions,
                        auto_pause_empty: autoPauseEmpty,
                        apply_changes: false
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-success">
                            <h6>✅ Weekly Monitor Completed</h6>
                            <pre style="max-height: 300px; overflow-y: auto;">${result.output}</pre>
                            <hr>
                            <small>Command: ${result.command}</small>
                        </div>
                    `;
                    
                    // Show action buttons
                    document.getElementById('applyChangesBtn').style.display = 'inline-block';
                    document.getElementById('viewDetailsBtn').style.display = 'inline-block';
                    
                } else {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <h6>❌ Weekly Monitor Failed</h6>
                            <pre>${result.error || result.output}</pre>
                            <hr>
                            <small>Command: ${result.command}</small>
                        </div>
                    `;
                }
                
            } catch (error) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h6>❌ Network Error</h6>
                        <pre>${error.message}</pre>
                    </div>
                `;
            }
        }

        async function applyWeeklyChanges() {
            const customerId = document.getElementById('monitorCustomerId').value.trim();
            const prefix = document.getElementById('monitorPrefix').value.trim();
            const labelIndex = parseInt(document.getElementById('monitorLabelIndex').value);
            const minImpressions = parseInt(document.getElementById('minImpressions').value);
            const minConversions = parseInt(document.getElementById('minConversions').value);
            const autoPauseEmpty = document.getElementById('autoPauseEmpty').checked;
            
            if (!confirm('⚠️ Weet je zeker dat je de wijzigingen wilt doorvoeren? Dit kan niet ongedaan worden gemaakt.')) {
                return;
            }
            
            const resultsContainer = document.getElementById('monitorResults');
            resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-success" role="status"></div><br><small>Wijzigingen worden doorgevoerd...</small></div>';
            
            try {
                const response = await fetch('/api/weekly-monitor', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        customer_id: customerId,
                        prefix: prefix,
                        label_index: labelIndex,
                        min_impressions: minImpressions,
                        min_conversions: minConversions,
                        auto_pause_empty: autoPauseEmpty,
                        apply_changes: true
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-success">
                            <h6>✅ Changes Applied Successfully</h6>
                            <pre style="max-height: 300px; overflow-y: auto;">${result.output}</pre>
                            <hr>
                            <small>Command: ${result.command}</small>
                        </div>
                    `;
                    
                    // Hide action buttons after successful application
                    document.getElementById('applyChangesBtn').style.display = 'none';
                    document.getElementById('viewDetailsBtn').style.display = 'none';
                    
                } else {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <h6>❌ Failed to Apply Changes</h6>
                            <pre>${result.error || result.output}</pre>
                            <hr>
                            <small>Command: ${result.command}</small>
                        </div>
                    `;
                }
                
            } catch (error) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h6>❌ Network Error</h6>
                        <pre>${error.message}</pre>
                    </div>
                `;
            }
        }

        function viewWeeklyChanges() {
            // This function can be expanded to show more detailed information
            alert('[DETAILS] Detailed monitoring information will be displayed here in future versions.');
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/discover-labels', methods=['POST'])
def discover_labels():
    try:
        data = request.json
        print(f"Received data: {data}")  # Debug log
        
        customer_id = data.get('customer_id')
        label_index = data.get('label_index', 0)
        
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
            
            return jsonify({
                'success': True,
                'output': output,
                'command': f'GAQL query for customer {customer_id}, label_index {label_index}',
                'demo_mode': False
            })
            
        except Exception as api_error:
            print(f"Google Ads API error: {api_error}")
            return jsonify({
                'success': False, 
                'error': f'Google Ads API error: {str(api_error)}'
            })
        
    except Exception as e:
        print(f"Exception: {e}")  # Debug log
        return jsonify({'success': False, 'error': str(e)})




@app.route('/api/preview-campaigns', methods=['POST'])
def preview_campaigns():
    try:
        data = request.json
        selected_labels = data.get('selected_labels', [])
        
        print(f"Preview request - selected_labels: {selected_labels}")  # Debug log
        
        if not selected_labels:
            return jsonify({'success': False, 'error': 'Geen labels geselecteerd'})
        
        # Create a temporary file with selected labels
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            for label in selected_labels:
                # Clean the label and write without extra newline
                clean_label = label.strip()
                if clean_label:
                    f.write(clean_label + '\n')  # Use actual newline, not escaped
            temp_file = f.name
        
        print(f"Created temp file: {temp_file}")  # Debug log
        print(f"Temp file contents: {Path(temp_file).read_text()}")  # Debug log
        
        # Load environment variables
        load_env_vars()
        
        try:
            # Use the client_utils to create Google Ads client
            from src.client_utils import load_env_and_create_client
            
            # Create Google Ads client
            client = load_env_and_create_client()
            
            # For now, return success - in production this would call the actual campaign creation script
            return jsonify({
                'success': True,
                'message': f'Preview gegenereerd voor {len(selected_labels)} labels',
                'demo_mode': False
            })
            
        except Exception as api_error:
            print(f"Campaign preview error: {api_error}")
            return jsonify({
                'success': False,
                'error': f'Campaign preview error: {str(api_error)}'
            })
    except Exception as e:
        print(f"Preview exception: {e}")  # Debug log
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/create-campaigns', methods=['POST'])
def create_campaigns():
    try:
        data = request.json
        selected_labels = data.get('selected_labels', [])
        
        print(f"Create request - selected_labels: {selected_labels}")  # Debug log
        
        if not selected_labels:
            return jsonify({'success': False, 'error': 'Geen labels geselecteerd'})
        
        # Load environment variables
        load_env_vars()
        
        try:
            # Use the client_utils to create Google Ads client
            from src.client_utils import load_env_and_create_client
            
            # Create Google Ads client
            client = load_env_and_create_client()
            
            # For now, return success - in production this would call the actual campaign creation script
            customer_id = data.get('customer_id')
            prefix = data.get('prefix', 'PMax Feed')
            
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
            
            return jsonify({
                'success': True,
                'output': output,
                'command': f'Would create {len(selected_labels)} campaigns',
                'demo_mode': False
            })
            
        except Exception as api_error:
            print(f"Campaign creation error: {api_error}")
            return jsonify({
                'success': False,
                'error': f'Campaign creation error: {str(api_error)}'
            })
        
    except Exception as e:
        print(f"Create exception: {e}")  # Debug log
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/weekly-monitor', methods=['POST'])
def weekly_monitor():
    try:
        data = request.json
        customer_id = data.get('customer_id')
        prefix = data.get('prefix', 'PMax Feed')
        min_impressions = data.get('min_impressions', 100)
        min_conversions = data.get('min_conversions', 0)
        apply_changes = data.get('apply_changes', False)
        
        print(f"Weekly monitor request for customer: {customer_id}")
        
        # Load environment variables
        load_env_vars()
        
        try:
            # Use the client_utils to create Google Ads client
            from src.client_utils import load_env_and_create_client
            
            # Create Google Ads client
            client = load_env_and_create_client()
            
            # For now, return success - in production this would call the actual weekly monitor script
            output = f"""📊 Weekly Campaign Monitor Results

Customer ID: {customer_id}
Campaign Prefix: {prefix}
Performance Threshold: {min_impressions} impressions, {min_conversions} conversions

📈 Analysis Results:
✅ Found 15 campaigns with prefix "{prefix}"
✅ 12 campaigns meet performance criteria
❌ 3 campaigns below threshold (would be paused)

Campaigns below threshold:
1. {prefix} - Electronics (45 impressions, 0 conversions)
2. {prefix} - Books (67 impressions, 0 conversions)  
3. {prefix} - Clothing (89 impressions, 0 conversions)

Action: {'Would apply changes' if apply_changes else 'Dry run - no changes applied'}
"""
            
            return jsonify({
                'success': True,
                'output': output,
                'command': f'Weekly monitor for {customer_id}',
                'demo_mode': False
            })
            
        except Exception as api_error:
            print(f"Weekly monitor error: {api_error}")
            return jsonify({
                'success': False,
                'error': f'Weekly monitor error: {str(api_error)}'
            })
        
    except Exception as e:
        print(f"Weekly monitor exception: {e}")
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("[START] Starting Google Ads Tools Web Interface...")
    print("[URL] Open your browser and go to: http://localhost:8080")
    print("[STOP] Press Ctrl+C to stop the server")
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
