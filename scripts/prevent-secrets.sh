#!/bin/bash
# Pre-commit hook to prevent committing secrets

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Patterns to detect secrets
PATTERNS=(
    "mongodb\+srv://"
    "mongodb://.*:.*@"
    "postgresql://.*:.*@"
    "mysql://.*:.*@"
    "password\s*=\s*['\"][^'\"]+['\"]"
    "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "secret[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "private[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "-----BEGIN.*PRIVATE KEY-----"
    "sk_live_[0-9a-zA-Z]{32,}"
    "sk_test_[0-9a-zA-Z]{32,}"
    "AKIA[0-9A-Z]{16}"
)

# Files to check
FILES=$(git diff --cached --name-only --diff-filter=ACM)

FOUND_SECRET=0

for FILE in $FILES; do
    # Skip if file is in node_modules or build
    if [[ "$FILE" == *"node_modules"* ]] || [[ "$FILE" == *"build"* ]]; then
        continue
    fi
    
    # Skip .env files (should be in .gitignore but check anyway)
    if [[ "$FILE" == *".env"* ]] && [[ "$FILE" != *".env.example"* ]]; then
        echo -e "${RED}❌ ERROR: Attempting to commit .env file: $FILE${NC}"
        echo -e "${YELLOW}   .env files should never be committed!${NC}"
        FOUND_SECRET=1
        continue
    fi
    
    # Check file content for secret patterns
    for PATTERN in "${PATTERNS[@]}"; do
        if git diff --cached "$FILE" | grep -iE "$PATTERN" > /dev/null; then
            echo -e "${RED}❌ ERROR: Potential secret detected in $FILE${NC}"
            echo -e "${YELLOW}   Pattern matched: $PATTERN${NC}"
            echo -e "${YELLOW}   Please remove secrets before committing.${NC}"
            FOUND_SECRET=1
        fi
    done
done

if [ $FOUND_SECRET -eq 1 ]; then
    echo -e "\n${RED}Commit blocked: Secrets detected!${NC}"
    echo -e "${YELLOW}If this is a false positive, use --no-verify to bypass (not recommended)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ No secrets detected${NC}"
exit 0

