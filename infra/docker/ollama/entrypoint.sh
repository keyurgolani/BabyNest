#!/bin/bash
# BabyNest Ollama Entrypoint Script
# Automatically downloads the configured model on startup

set -e

# Default model if not specified
MODEL=${OLLAMA_MODEL:-llama3.2:1b}

echo "🤖 Starting Ollama server..."

# Start Ollama server in the background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama server to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Ollama server failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

echo "✅ Ollama server is ready!"

# Check if model is already downloaded
echo "🔍 Checking for model: $MODEL"
if ollama list | grep -q "^$MODEL"; then
    echo "✅ Model $MODEL is already available"
else
    echo "📥 Downloading model: $MODEL (this may take a while on first run)..."
    ollama pull "$MODEL"
    echo "✅ Model $MODEL downloaded successfully!"
fi

# Show available models
echo "📋 Available models:"
ollama list

echo "🚀 BabyNest AI is ready! Using model: $MODEL"

# Keep the container running by waiting for the Ollama process
wait $OLLAMA_PID
