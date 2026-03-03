#!/bin/bash

set -e

APP_NAME="frontend"

echo "Checking Node installation..."

if command -v node >/dev/null 2>&1; then
    echo "Node is already installed: $(node -v)"
else
    echo "Node not found. Installing via NVM..."

    # Install NVM (non-interactive)
    export NVM_DIR="$HOME/.nvm"
    if [ ! -d "$NVM_DIR" ]; then
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi

    # Load NVM
    source "$NVM_DIR/nvm.sh"

    # Install latest LTS
    nvm install --lts
    nvm use --lts

    echo "Node installed: $(node -v)"
fi

echo "Creating React project..."

# Create project (non-interactive)
npm create vite@latest $APP_NAME -- --template react

cd $APP_NAME

echo "Installing dependencies..."
npm install --no-audit --no-fund

echo "Starting development server..."
npm run dev