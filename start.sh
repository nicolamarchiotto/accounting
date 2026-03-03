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

# Activate the virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Install requirements
if [ -f "$REQUIREMENTS_FILE" ]; then
    echo "Installing Python dependencies from requirements.txt..."
    pip install --upgrade pip
    pip install -r "$REQUIREMENTS_FILE"
else
    echo "No requirements.txt found at $REQUIREMENTS_FILE"
fi

# -----------------------------
# Start Flask backend
# -----------------------------
echo "Starting Flask backend on port $FLASK_PORT..."
cd "$FLASK_APP_DIR"
python app.py &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"

# -----------------------------
# Start React frontend
# -----------------------------
echo "Starting React frontend on port $REACT_PORT..."
cd "../$REACT_APP_DIR"
npm run dev -- --host 0.0.0.0 --port $REACT_PORT &
REACT_PID=$!
echo "React PID: $REACT_PID"

# -----------------------------
# Function to shutdown both apps
# -----------------------------
cleanup() {
    echo ""
    echo "Shutting down apps..."
    kill $FLASK_PID 2>/dev/null || true
    kill $REACT_PID 2>/dev/null || true
    wait $FLASK_PID 2>/dev/null
    wait $REACT_PID 2>/dev/null
    echo "Done!"
    exit 0
}

# Trap CTRL+C and EXIT signals
trap cleanup SIGINT SIGTERM

# Optional: listen for 'q' key to quit
echo "Press 'q' then Enter to quit..."
while true; do
    read -r -n 1 key
    if [[ $key == "q" ]]; then
        cleanup
    fi
done