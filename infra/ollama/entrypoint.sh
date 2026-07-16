#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait for Ollama to start
echo "Waiting for Ollama to start..."
until curl -s http://localhost:11434/api/tags > /dev/null; do
  sleep 2
done

# Pull the specified model
echo "Pulling llama3.1:8b-instruct-q4_K_M..."
ollama pull llama3.1:8b-instruct-q4_K_M

# Keep the container running
wait
