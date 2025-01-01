#!/bin/bash

# Print colorful messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Web Speech-to-Text Application...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first:"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first:"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Start with web-only profile by default
PROFILE="web-only"

# Check for --full flag
if [ "$1" == "--full" ]; then
    PROFILE="full"
    echo -e "${BLUE}Starting with full HIPAA-compliant local processing...${NC}"
else
    echo -e "${BLUE}Starting with web-only mode (browser-based processing)...${NC}"
    echo -e "${BLUE}To enable HIPAA-compliant local processing, restart with: ./start.sh --full${NC}"
fi

# Pull the latest changes
echo -e "${BLUE}Pulling latest changes...${NC}"
docker compose pull

# Start the services
echo -e "${BLUE}Starting services...${NC}"
docker compose --profile $PROFILE up --build

# Print success message
echo -e "${GREEN}Services are starting up!${NC}"
echo -e "${GREEN}Once everything is ready, visit: http://localhost:3000${NC}"
