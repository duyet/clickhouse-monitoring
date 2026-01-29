#!/bin/bash
#
# ClickHouse Monitor Auth Setup Script
#
# This script helps configure authentication for ClickHouse Monitor.
# It sets up the database, generates secrets, and guides OAuth configuration.
#
# Usage: ./scripts/setup-auth.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "  $1"
}

# Check if .env.local exists
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    print_info "Created $ENV_FILE"
fi

# Main setup
print_header "ClickHouse Monitor Auth Setup"

echo "This script will help you configure authentication for ClickHouse Monitor."
echo "You can skip any step by pressing Enter."
echo ""

# Step 1: Database Configuration
print_header "Step 1: Database Configuration"

# Check if DATABASE_URL is already set
if grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
    current_db=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2-)
    print_info "DATABASE_URL already configured: $current_db"
    echo ""
    read -p "Do you want to change it? (y/N): " change_db
    if [[ ! "$change_db" =~ ^[Yy]$ ]]; then
        print_success "Keeping existing database configuration"
        db_configured=true
    fi
fi

if [ -z "$db_configured" ]; then
    echo "Choose database type:"
    echo "  1) SQLite (recommended for getting started)"
    echo "  2) PostgreSQL (recommended for production)"
    echo "  3) Skip (configure manually later)"
    echo ""
    read -p "Enter choice [1]: " db_choice

    case $db_choice in
        2)
            echo ""
            read -p "Enter PostgreSQL URL (e.g., postgres://user:pass@host:5432/db): " pg_url
            if [ -n "$pg_url" ]; then
                # Remove existing DATABASE_URL if present
                if grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
                    sed -i.bak '/^DATABASE_URL=/d' "$ENV_FILE" && rm -f "$ENV_FILE.bak"
                fi
                echo "DATABASE_URL=$pg_url" >> "$ENV_FILE"
                print_success "PostgreSQL database configured"
            else
                print_warning "No URL provided, skipping database configuration"
            fi
            ;;
        3)
            print_info "Skipping database configuration"
            ;;
        *)
            # Default to SQLite
            mkdir -p data
            # Remove existing DATABASE_URL if present
            if grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
                sed -i.bak '/^DATABASE_URL=/d' "$ENV_FILE" && rm -f "$ENV_FILE.bak"
            fi
            echo "DATABASE_URL=file:./data/auth.db" >> "$ENV_FILE"
            print_success "SQLite database configured at ./data/auth.db"
            ;;
    esac
fi

# Step 2: Auth Secret
print_header "Step 2: Auth Secret"

if grep -q "^AUTH_SECRET=" "$ENV_FILE" 2>/dev/null; then
    print_success "AUTH_SECRET already configured"
else
    echo "Generating secure AUTH_SECRET..."

    # Generate secret using openssl or fallback
    if command -v openssl &> /dev/null; then
        secret=$(openssl rand -base64 32)
    else
        # Fallback to /dev/urandom
        secret=$(head -c 32 /dev/urandom | base64)
    fi

    echo "AUTH_SECRET=$secret" >> "$ENV_FILE"
    print_success "AUTH_SECRET generated and saved"
fi

# Step 3: Deployment Mode
print_header "Step 3: Deployment Mode"

if grep -q "^DEPLOYMENT_MODE=" "$ENV_FILE" 2>/dev/null; then
    current_mode=$(grep "^DEPLOYMENT_MODE=" "$ENV_FILE" | cut -d'=' -f2-)
    print_info "DEPLOYMENT_MODE already set: $current_mode"
else
    echo "Choose deployment mode:"
    echo "  1) self-hosted (optional authentication, shared hosts)"
    echo "  2) cloud (required authentication, per-org hosts)"
    echo ""
    read -p "Enter choice [1]: " mode_choice

    case $mode_choice in
        2)
            echo "DEPLOYMENT_MODE=cloud" >> "$ENV_FILE"
            print_success "Deployment mode set to: cloud"
            ;;
        *)
            echo "DEPLOYMENT_MODE=self-hosted" >> "$ENV_FILE"
            print_success "Deployment mode set to: self-hosted"
            ;;
    esac
fi

# Step 4: OAuth Providers
print_header "Step 4: OAuth Providers"

echo "Configure OAuth providers for authentication."
echo "You'll need to create OAuth apps in GitHub and/or Google."
echo ""

# GitHub OAuth
echo -e "${YELLOW}GitHub OAuth:${NC}"
echo "  Create an OAuth App at: https://github.com/settings/developers"
echo "  Homepage URL: http://localhost:3000 (or your production URL)"
echo "  Callback URL: http://localhost:3000/api/auth/callback/github"
echo ""

if grep -q "^AUTH_GITHUB_ID=" "$ENV_FILE" 2>/dev/null; then
    print_success "GitHub OAuth already configured"
else
    read -p "Enter GitHub Client ID (or press Enter to skip): " github_id
    if [ -n "$github_id" ]; then
        read -p "Enter GitHub Client Secret: " github_secret
        if [ -n "$github_secret" ]; then
            echo "AUTH_GITHUB_ID=$github_id" >> "$ENV_FILE"
            echo "AUTH_GITHUB_SECRET=$github_secret" >> "$ENV_FILE"
            print_success "GitHub OAuth configured"
        else
            print_warning "No secret provided, skipping GitHub OAuth"
        fi
    else
        print_info "Skipping GitHub OAuth"
    fi
fi

echo ""

# Google OAuth
echo -e "${YELLOW}Google OAuth:${NC}"
echo "  Create credentials at: https://console.cloud.google.com/apis/credentials"
echo "  Authorized redirect URI: http://localhost:3000/api/auth/callback/google"
echo ""

if grep -q "^AUTH_GOOGLE_ID=" "$ENV_FILE" 2>/dev/null; then
    print_success "Google OAuth already configured"
else
    read -p "Enter Google Client ID (or press Enter to skip): " google_id
    if [ -n "$google_id" ]; then
        read -p "Enter Google Client Secret: " google_secret
        if [ -n "$google_secret" ]; then
            echo "AUTH_GOOGLE_ID=$google_id" >> "$ENV_FILE"
            echo "AUTH_GOOGLE_SECRET=$google_secret" >> "$ENV_FILE"
            print_success "Google OAuth configured"
        else
            print_warning "No secret provided, skipping Google OAuth"
        fi
    else
        print_info "Skipping Google OAuth"
    fi
fi

# Step 5: Base URL (for production)
print_header "Step 5: Application URL"

if grep -q "^BETTER_AUTH_URL=" "$ENV_FILE" 2>/dev/null; then
    current_url=$(grep "^BETTER_AUTH_URL=" "$ENV_FILE" | cut -d'=' -f2-)
    print_info "Application URL already set: $current_url"
else
    echo "For production, set your application URL."
    echo "Leave blank for localhost development."
    echo ""
    read -p "Enter production URL (e.g., https://clickhouse.example.com): " app_url
    if [ -n "$app_url" ]; then
        echo "BETTER_AUTH_URL=$app_url" >> "$ENV_FILE"
        echo "NEXT_PUBLIC_APP_URL=$app_url" >> "$ENV_FILE"
        print_success "Application URL configured"
    else
        print_info "Using default localhost URL for development"
    fi
fi

# Summary
print_header "Setup Complete!"

echo "Your authentication configuration has been saved to $ENV_FILE"
echo ""
echo "Configuration summary:"

# Show what's configured
if grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
    db_type=$(grep "^DATABASE_URL=" "$ENV_FILE" | grep -q "postgres" && echo "PostgreSQL" || echo "SQLite")
    print_success "Database: $db_type"
else
    print_warning "Database: Not configured"
fi

if grep -q "^AUTH_SECRET=" "$ENV_FILE" 2>/dev/null; then
    print_success "Auth Secret: Configured"
else
    print_warning "Auth Secret: Not configured"
fi

if grep -q "^AUTH_GITHUB_ID=" "$ENV_FILE" 2>/dev/null; then
    print_success "GitHub OAuth: Configured"
else
    print_info "GitHub OAuth: Not configured"
fi

if grep -q "^AUTH_GOOGLE_ID=" "$ENV_FILE" 2>/dev/null; then
    print_success "Google OAuth: Configured"
else
    print_info "Google OAuth: Not configured"
fi

echo ""
echo "Next steps:"
echo "  1. Review your .env.local file"
echo "  2. Run 'bun run dev' to start the development server"
echo "  3. Visit http://localhost:3000/auth/login to test authentication"
echo ""
echo "For more information, see the documentation at:"
echo "  https://github.com/duyet/clickhouse-monitor"
echo ""
