# BabyNest Infrastructure

This directory contains all infrastructure-related code and configurations for deploying BabyNest.

## Directory Structure

```
infra/
├── docker/                 # Docker Compose deployment
│   ├── docker-compose.yml  # Main compose configuration
│   ├── docker-compose.dev.yml  # Development overrides
│   ├── .env.example        # Environment template
│   ├── api/                # API Dockerfiles
│   ├── web/                # Web Dockerfiles
│   └── ollama/             # Ollama AI Dockerfiles
└── helm/                   # Kubernetes Helm chart
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
```

## Deployment Options

### Docker Compose (Recommended for Self-Hosting)

Best for single-server deployments and development.

```bash
cd infra/docker
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

See [docker/README.md](docker/README.md) for detailed instructions.

### Kubernetes with Helm

Best for production deployments requiring high availability and scalability.

```bash
cd infra/helm
helm dependency update
helm install babynest . -f my-values.yaml
```

See [helm/README.md](helm/README.md) for detailed instructions.

## Quick Comparison

| Feature               | Docker Compose    | Kubernetes/Helm        |
| --------------------- | ----------------- | ---------------------- |
| Complexity            | Low               | High                   |
| Scalability           | Single server     | Multi-node cluster     |
| High Availability     | Manual            | Built-in               |
| Resource Requirements | 2GB+ RAM          | Kubernetes cluster     |
| Best For              | Self-hosting, Dev | Production, Enterprise |

## Requirements

### Docker Compose

- Docker Engine 20.10+
- Docker Compose v2.0+
- 2GB RAM minimum (4GB+ with Ollama AI)

### Kubernetes

- Kubernetes 1.23+
- Helm 3.8+
- PV provisioner support
