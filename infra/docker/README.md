# BabyNest Docker Deployment

This guide explains how to deploy BabyNest using Docker Compose.

## Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.22+ (for watch feature)
- At least 2GB RAM (4GB+ recommended if using Ollama AI)

## Quick Start

### Development Mode (with Hot Reload)

Development mode uses local builds with Docker Compose Watch for automatic hot-reloading when you edit source files.

```bash
# From project root
npm run docker:dev

# Or directly with docker compose
cd infra/docker
docker compose -f docker-compose.dev.yml watch
```

This will:

- Build images from local source code
- Start all services (API, Web, PostgreSQL, Redis, Ollama)
- Watch for file changes and automatically sync/rebuild

### Production Mode (with Published Images)

Production mode pulls pre-built images from container registries.

```bash
# 1. Copy and configure environment
cp infra/docker/.env.example infra/docker/.env

# 2. Edit .env with your settings
# - Set REGISTRY_OWNER to your GitHub username
# - Change JWT secrets and database passwords

# 3. Start services
npm run docker:prod

# Or with AI (Ollama)
npm run docker:prod:ai
```

## Available Commands

### Development

| Command                    | Description                                  |
| -------------------------- | -------------------------------------------- |
| `npm run docker:dev`       | Start dev stack with watch mode (hot reload) |
| `npm run docker:dev:up`    | Start dev stack in background                |
| `npm run docker:dev:down`  | Stop dev stack                               |
| `npm run docker:dev:logs`  | View dev stack logs                          |
| `npm run docker:dev:build` | Rebuild dev images                           |

### Production

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `npm run docker:prod`      | Start production stack                |
| `npm run docker:prod:ai`   | Start production stack with Ollama AI |
| `npm run docker:prod:down` | Stop production stack                 |
| `npm run docker:prod:logs` | View production logs                  |
| `npm run docker:prod:pull` | Pull latest images                    |

## Architecture

### Development Stack (`docker-compose.dev.yml`)

- **Local builds** from source code
- **Docker Compose Watch** for hot-reloading
- **Debug ports** exposed (9229 for Node.js debugging)
- **Ollama AI** enabled by default
- Separate volumes to avoid conflicts with production

### Production Stack (`docker-compose.yml`)

- **Published images** from GHCR/Docker Hub
- **Optimized multi-stage builds**
- **Health checks** on all services
- **Ollama AI** optional (use `--profile ai`)

## Container Registry

Images are published to both:

- **GitHub Container Registry**: `ghcr.io/<owner>/babynest-api`, `ghcr.io/<owner>/babynest-web`
- **Docker Hub**: `<username>/babynest-api`, `<username>/babynest-web`

### Publishing Images

Images are automatically published on:

- Release creation
- Push to main branch (with relevant file changes)
- Manual workflow dispatch

To enable Docker Hub publishing, add these secrets to your repository:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Directory Structure

```
infra/docker/
├── docker-compose.yml      # Production compose (uses published images)
├── docker-compose.dev.yml  # Development compose (local builds + watch)
├── .env.example            # Environment template
├── .dockerignore           # Docker build exclusions
├── README.md               # This file
├── api/
│   ├── Dockerfile          # Production API image (multi-stage)
│   ├── Dockerfile.dev      # Development API image (hot reload)
│   └── docker-entrypoint.sh
├── web/
│   ├── Dockerfile          # Production Web image (multi-stage)
│   └── Dockerfile.dev      # Development Web image (hot reload)
└── ollama/
    ├── Dockerfile          # Ollama with auto model download
    └── entrypoint.sh
```

## Environment Variables

See `.env.example` for all available configuration options.

### Key Variables

| Variable            | Description         | Default               |
| ------------------- | ------------------- | --------------------- |
| `REGISTRY`          | Container registry  | `ghcr.io`             |
| `REGISTRY_OWNER`    | GitHub username/org | Required for prod     |
| `API_VERSION`       | API image tag       | `latest`              |
| `WEB_VERSION`       | Web image tag       | `latest`              |
| `POSTGRES_PASSWORD` | Database password   | `babynest`            |
| `JWT_SECRET`        | JWT signing secret  | Change in production! |
| `OLLAMA_MODEL`      | AI model to use     | `llama3.2:1b`         |

## Troubleshooting

### Watch mode not detecting changes

Ensure you're using Docker Compose v2.22+:

```bash
docker compose version
```

### Database connection issues

Check if PostgreSQL is healthy:

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs postgres
```

### Permission denied errors

On Linux, you may need to add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

### Images not found (production)

Make sure you've set `REGISTRY_OWNER` in your `.env` file and the images have been published.
