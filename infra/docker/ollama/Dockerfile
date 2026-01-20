# BabyNest Ollama Dockerfile
# Custom Ollama image with automatic model download

FROM ollama/ollama:latest

# Install curl for healthcheck and entrypoint script
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY entrypoint.sh /ollama-entrypoint.sh
RUN chmod +x /ollama-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/ollama-entrypoint.sh"]
