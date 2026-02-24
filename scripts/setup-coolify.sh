#!/bin/bash
# Home Hub Coolify Setup Script
# This script creates the Coolify project and configures the app automatically

COOLIFY_URL="${COOLIFY_URL:-http://192.168.85.202:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN}"

if [ -z "$COOLIFY_TOKEN" ]; then
  echo "Error: COOLIFY_TOKEN not set"
  exit 1
fi

PROJECT_NAME="Home Hub"

echo "=== Home Hub Coolify Setup ==="
echo "Coolify: $COOLIFY_URL"

# Create project
echo "Creating project..."
PROJECT_RESPONSE=$(curl -s -X POST "$COOLIFY_URL/api/v1/projects" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$PROJECT_NAME\", \"description\": \"Home dashboard\"}")

PROJECT_UUID=$(echo "$PROJECT_RESPONSE" | jq -r '.uuid // empty')

if [ -z "$PROJECT_UUID" ]; then
  echo "Failed to create project"
  echo "$PROJECT_RESPONSE"
  exit 1
fi

echo "Project created: $PROJECT_UUID"

# Get or create production environment
ENV_RESPONSE=$(curl -s -X GET "$COOLIFY_URL/api/v1/projects/$PROJECT_UUID/environments" \
  -H "Authorization: Bearer $COOLIFY_TOKEN")

ENV_UUID=$(echo "$ENV_RESPONSE" | jq -r '.[0].uuid // empty')

if [ -z "$ENV_UUID" ]; then
  ENV_RESPONSE=$(curl -s -X POST "$COOLIFY_URL/api/v1/projects/$PROJECT_UUID/environments" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "production"}')
  ENV_UUID=$(echo "$ENV_RESPONSE" | jq -r '.uuid // empty')
fi

echo "Environment: $ENV_UUID"

# Create application
echo "Creating application..."
APP_RESPONSE=$(curl -s -X POST "$COOLIFY_URL/api/v1/projects/$PROJECT_UUID/environments/$ENV_UUID/applications" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"home-hub\",
    \"gitRepository\": \"YOUR_GITHUB_REPO\",
    \"gitBranch\": \"main\",
    \"buildPack\": \"nixpacks\",
    \"port\": 3000,
    \"instaceType\": \"standalone\"
  }")

APP_UUID=$(echo "$APP_RESPONSE" | jq -r '.uuid // empty')

if [ -z "$APP_UUID" ]; then
  echo "Failed to create application"
  echo "$APP_RESPONSE"
  exit 1
fi

echo "Application created: $APP_UUID"

# Set environment variables
echo "Setting environment variables..."

ENV_VARS=(
  "DATABASE_URL=file:./dev.db"
  "OLLAMA_BASE_URL=http://192.168.85.50:11434"
  "OLLAMA_MODEL=qwen3:14b"
  "UNRAID_URL=https://192.168.85.199"
  "UNRAID_API_KEY=YOUR_UNRAID_API_KEY"
  "OPENWEATHERMAP_API_KEY=YOUR_OPENWEATHERMAP_KEY"
  "APPLE_REMINDERS_WEBHOOK="
  "FOOTBALL_DATA_API_KEY=YOUR_FOOTBALL_DATA_KEY"
)

for VAR in "${ENV_VARS[@]}"; do
  KEY="${VAR%%=*}"
  VALUE="${VAR#*=}"
  
  curl -s -X POST "$COOLIFY_URL/api/v1/projects/$PROJECT_UUID/environments/$ENV_UUID/applications/$APP_UUID/environment" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"$KEY\", \"value\": \"$VALUE\", \"isBuildTime\": false, \"isPreview\": false}" \
    > /dev/null
done

echo "Environment variables set"

# Get the public URL
echo ""
echo "=== Setup Complete ==="
echo "Project: $PROJECT_NAME"
echo "App UUID: $APP_UUID"
echo ""
echo "Next steps:"
echo "1. Update the GitHub repository in Coolify UI"
echo "2. Set your API keys"
echo "3. Deploy!"
