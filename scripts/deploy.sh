#!/bin/bash

# SILAS Platform Deployment Script
# This script handles the complete deployment process for the SILAS platform

set -e  # Exit on any error

echo "🚀 Starting SILAS Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if command -v pnpm &> /dev/null; then
        pnpm install --frozen-lockfile
    elif command -v yarn &> /dev/null; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
    
    print_success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        supabase db push
        print_success "Database migrations completed"
    else
        print_warning "Supabase CLI not found. Please run migrations manually."
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if command -v pnpm &> /dev/null; then
        pnpm test --passWithNoTests
    elif command -v yarn &> /dev/null; then
        yarn test --passWithNoTests
    else
        npm test -- --passWithNoTests
    fi
    
    print_success "Tests passed"
}

# Build the application
build_app() {
    print_status "Building application..."
    
    if command -v pnpm &> /dev/null; then
        pnpm build
    elif command -v yarn &> /dev/null; then
        yarn build
    else
        npm run build
    fi
    
    print_success "Application built successfully"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if command -v vercel &> /dev/null; then
        if [ "$1" = "production" ]; then
            vercel --prod --yes
        else
            vercel --yes
        fi
        print_success "Deployed to Vercel"
    else
        print_error "Vercel CLI not found. Please install it with: npm i -g vercel"
        exit 1
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    if [ -n "$NEXT_PUBLIC_SITE_URL" ]; then
        # Wait a moment for deployment to be ready
        sleep 10
        
        response=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SITE_URL" || echo "000")
        
        if [ "$response" = "200" ]; then
            print_success "Health check passed - site is responding"
        else
            print_warning "Health check failed - received HTTP $response"
        fi
    else
        print_warning "NEXT_PUBLIC_SITE_URL not set, skipping health check"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    # Add any cleanup tasks here
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    local environment=${1:-"preview"}
    
    print_status "Deploying SILAS Platform to $environment environment"
    
    # Pre-deployment checks
    check_env_vars
    
    # Install and build
    install_dependencies
    
    # Run migrations (only for production)
    if [ "$environment" = "production" ]; then
        run_migrations
    fi
    
    # Run tests
    run_tests
    
    # Build application
    build_app
    
    # Deploy
    deploy_vercel "$environment"
    
    # Post-deployment checks
    health_check
    
    # Cleanup
    cleanup
    
    print_success "🎉 SILAS Platform deployment completed successfully!"
    
    if [ -n "$NEXT_PUBLIC_SITE_URL" ]; then
        echo ""
        echo "🌐 Your application is available at: $NEXT_PUBLIC_SITE_URL"
    fi
}

# Handle script arguments
case "$1" in
    "production"|"prod")
        main "production"
        ;;
    "preview"|"staging")
        main "preview"
        ;;
    "help"|"-h"|"--help")
        echo "SILAS Platform Deployment Script"
        echo ""
        echo "Usage: $0 [environment]"
        echo ""
        echo "Environments:"
        echo "  production, prod    Deploy to production"
        echo "  preview, staging    Deploy to preview/staging (default)"
        echo "  help, -h, --help    Show this help message"
        echo ""
        echo "Required environment variables:"
        echo "  NEXT_PUBLIC_SUPABASE_URL"
        echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
        echo "  SUPABASE_SERVICE_ROLE_KEY"
        echo ""
        echo "Optional environment variables:"
        echo "  NEXT_PUBLIC_SITE_URL"
        echo "  NEXT_PUBLIC_GA_ID"
        echo "  GOOGLE_SITE_VERIFICATION"
        ;;
    *)
        main "preview"
        ;;
esac
