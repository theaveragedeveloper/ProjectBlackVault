#!/bin/bash
set -e

echo "Setting up ProjectBlackVault..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required. Please install it from https://www.python.org"
    exit 1
fi

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file."
    echo "IMPORTANT: Open .env and set a strong random SECRET_KEY before using in production."
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created virtual environment."
fi

# Activate and install dependencies
source venv/bin/activate
pip install --quiet -r requirements.txt
echo "Dependencies installed."

# Create uploads directories
mkdir -p app/static/uploads/firearms app/static/uploads/accessories

echo ""
echo "Setup complete!"
echo ""
echo "To start the app:"
echo "  source venv/bin/activate"
echo "  python3 run.py"
echo ""
echo "Then open http://localhost:5000 in your browser."
