#!/bin/bash
set -e

# -----------------------------
# Configuration
# -----------------------------
FLASK_APP_DIR="./backend"
FLASK_PORT=5000
VENV_DIR="$FLASK_APP_DIR/venv"
REQUIREMENTS_FILE="$FLASK_APP_DIR/requirements.txt"

REACT_APP_DIR="./frontend"
REACT_PORT=5173

# -----------------------------
# Setup Python virtual environment
# -----------------------------
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Install requirements
if [ -f "$REQUIREMENTS_FILE" ]; then
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r "$REQUIREMENTS_FILE"
fi

# -----------------------------
# Free ports (IMPORTANT FIX)
# -----------------------------
echo "Checking ports..."

sudo fuser -k ${FLASK_PORT}/tcp 2>/dev/null || true
sudo fuser -k ${REACT_PORT}/tcp 2>/dev/null || true

sleep 1

# -----------------------------
# Start Flask backend
# -----------------------------
echo "Starting Flask backend on port $FLASK_PORT..."
cd "$FLASK_APP_DIR"

python app.py &
FLASK_PID=$!

sleep 2

if ! kill -0 "$FLASK_PID" 2>/dev/null; then
    echo "ERROR: Flask failed to start"
    exit 1
fi

echo "Flask PID: $FLASK_PID"

# -----------------------------
# Start React frontend
# -----------------------------
echo "Starting React frontend on port $REACT_PORT..."
cd "../$REACT_APP_DIR"

npm run dev -- --host 0.0.0.0 --port $REACT_PORT &
REACT_PID=$!

sleep 2

if ! kill -0 "$REACT_PID" 2>/dev/null; then
    echo "ERROR: React failed to start"
    exit 1
fi

echo "React PID: $REACT_PID"

# -----------------------------
# Cleanup handler
# -----------------------------
cleanup() {
    echo ""
    echo "Shutting down..."

    kill "$FLASK_PID" 2>/dev/null || true
    kill "$REACT_PID" 2>/dev/null || true

    wait "$FLASK_PID" 2>/dev/null || true
    wait "$REACT_PID" 2>/dev/null || true

    echo "Stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# -----------------------------
# Keep alive
# -----------------------------
echo "Press 'q' then Enter to quit..."

while true; do
    read -r -n 1 key
    if [[ "$key" == "q" ]]; then
        cleanup
    fi
done