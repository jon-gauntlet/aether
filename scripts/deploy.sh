#!/bin/bash
# Aether WebSocket System Deployment Script
# 

set -e  # Exit on error

# Configuration
DEPLOY_ENV=${1:-production}
DEPLOY_USER=${2:-websocket}
DEPLOY_PATH="/opt/aether/websocket"
LOG_PATH="/var/log/websocket"
SSL_PATH="/etc/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Python version
    python3 --version >/dev/null 2>&1 || error "Python 3 is required"
    
    # Check Poetry
    poetry --version >/dev/null 2>&1 || error "Poetry is required"
    
    # Check SSL certificates
    if [ ! -f "${SSL_PATH}/certs/websocket.crt" ]; then
        error "SSL certificate not found at ${SSL_PATH}/certs/websocket.crt"
    fi
    
    if [ ! -f "${SSL_PATH}/private/websocket.key" ]; then
        error "SSL key not found at ${SSL_PATH}/private/websocket.key"
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    # Create deploy directory
    sudo mkdir -p ${DEPLOY_PATH}
    sudo chown ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_PATH}
    
    # Create log directory
    sudo mkdir -p ${LOG_PATH}
    sudo chown ${DEPLOY_USER}:${DEPLOY_USER} ${LOG_PATH}
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # System packages
    sudo apt-get update
    sudo apt-get install -y \
        python3-dev \
        build-essential \
        nginx \
        supervisor
    
    # Python dependencies
    poetry install --no-dev
}

# Configure services
configure_services() {
    log "Configuring services..."
    
    # Nginx configuration
    sudo cp config/nginx/websocket.conf /etc/nginx/sites-available/
    sudo ln -sf /etc/nginx/sites-available/websocket.conf /etc/nginx/sites-enabled/
    
    # Supervisor configuration
    sudo cp config/supervisor/websocket.conf /etc/supervisor/conf.d/
    
    # Reload services
    sudo systemctl reload nginx
    sudo supervisorctl reread
    sudo supervisorctl update
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Copy application files
    rsync -av --exclude '.git' \
        --exclude 'tests' \
        --exclude '.env' \
        --exclude '__pycache__' \
        . ${DEPLOY_PATH}
    
    # Set permissions
    sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_PATH}
    
    # Create environment file
    if [ ! -f "${DEPLOY_PATH}/.env" ]; then
        warn "Environment file not found, creating from template"
        cp config/env.template ${DEPLOY_PATH}/.env
    fi
}

# Run database migrations
run_migrations() {
    log "Running migrations..."
    cd ${DEPLOY_PATH}
    poetry run python manage.py migrate
}

# Start application
start_application() {
    log "Starting application..."
    sudo supervisorctl restart websocket
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if service is running
    if ! sudo supervisorctl status websocket | grep -q RUNNING; then
        error "Service not running"
    fi
    
    # Check if port is listening
    if ! netstat -tuln | grep -q ":8000"; then
        error "Service not listening on port 8000"
    fi
    
    # Check SSL
    if ! curl -k https://localhost:8000/health | grep -q "ok"; then
        error "Health check failed"
    fi
    
    log "Deployment verified successfully"
}

# Main deployment flow
main() {
    log "Starting deployment to ${DEPLOY_ENV}..."
    
    check_prerequisites
    setup_directories
    install_dependencies
    configure_services
    deploy_application
    run_migrations
    start_application
    verify_deployment
    
    log "Deployment completed successfully"
}

# Run main function
main 