#!/bin/bash

# Check if a search term is provided
if [ -z "$1" ]; then
    echo "Usage: ./search.sh <searchTerm>"
    exit 1
fi

# Make the POST request to the API
curl -X POST http://localhost:3001/api/search \
     -H "Content-Type: application/json" \
     -d "{\"searchTerm\": \"$1\"}" # Ensure the JSON is correctly formatted
