#!/bin/bash

# Logo download script for Home Hub sports widget
# Downloads team logos from various sources

LOGO_BASE="/home/jpwolf00/.openclaw/workspace/home-hub/public/logos"

# Function to download and validate logo
download_logo() {
    local url="$1"
    local output="$2"
    local league="$3"
    
    echo "Downloading $output..."
    
    # Download the file
    curl -sL "$url" -o "$LOGO_BASE/$league/$output"
    
    # Check if download succeeded
    if [ -f "$LOGO_BASE/$league/$output" ]; then
        # Check file size
        local size=$(stat -f%z "$LOGO_BASE/$league/$output" 2>/dev/null || stat -c%s "$LOGO_BASE/$league/$output" 2>/dev/null)
        if [ "$size" -gt 1000 ]; then
            echo "  ✓ Downloaded ($size bytes)"
            return 0
        else
            echo "  ✗ File too small, removing"
            rm "$LOGO_BASE/$league/$output"
            return 1
        fi
    else
        echo "  ✗ Download failed"
        return 1
    fi
}

echo "Starting logo downloads..."
