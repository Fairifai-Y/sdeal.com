# Remove Secrets from Git History

## Option 1: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove all .env files from history
git filter-repo --invert-paths --path-glob '*.env' --path-glob 'server/.env' --path-glob '**/.env*'

# Remove MongoDB connection strings from all files
git filter-repo --replace-text <(echo 'mongodb+srv://==>mongodb+srv://REMOVED')
```

## Option 2: Using BFG Repo-Cleaner

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env files
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files server/.env

# Remove MongoDB connection strings
java -jar bfg.jar --replace-text passwords.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Option 3: Manual cleanup (for small repos)

```bash
# Create a new orphan branch
git checkout --orphan new-main

# Add all files except .env
git add .
git commit -m "Initial commit (secrets removed)"

# Delete old main branch
git branch -D main

# Rename new branch to main
git branch -m main

# Force push (WARNING: This rewrites history!)
git push -f origin main
```

## After cleanup:

1. **Force push to GitHub:**
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

2. **Notify all collaborators** - They need to re-clone the repository

3. **Rotate all exposed credentials** - Change passwords, API keys, etc.

4. **Enable branch protection** - Prevent force pushes to main branch

