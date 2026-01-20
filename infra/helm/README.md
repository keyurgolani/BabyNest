# BabyNest Helm Chart

A Helm chart for deploying BabyNest - a self-hosted, privacy-focused baby tracking application.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure (for persistence)

## Installing the Chart

### Add Dependencies

First, add the Bitnami repository for PostgreSQL and Redis dependencies:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### Update Dependencies

```bash
cd infra/helm
helm dependency update
```

### Install

To install the chart with the release name `babynest`:

```bash
helm install babynest ./infra/helm \
  --set secrets.jwt.secret="your-jwt-secret" \
  --set secrets.jwt.refreshSecret="your-refresh-secret" \
  --set postgresql.auth.password="your-db-password"
```

### Install with Custom Values

```bash
helm install babynest ./infra/helm -f my-values.yaml
```

## Uninstalling the Chart

```bash
helm uninstall babynest
```

## Configuration

### API Configuration

| Parameter                     | Description             | Default                    |
| ----------------------------- | ----------------------- | -------------------------- |
| `api.replicaCount`            | Number of API replicas  | `1`                        |
| `api.image.repository`        | API image repository    | `babynest/api`             |
| `api.image.tag`               | API image tag           | `""` (uses appVersion)     |
| `api.service.type`            | Kubernetes service type | `ClusterIP`                |
| `api.service.port`            | Service port            | `3000`                     |
| `api.ingress.enabled`         | Enable ingress          | `false`                    |
| `api.ingress.hosts`           | Ingress hosts           | `[{host: babynest.local}]` |
| `api.resources.limits.cpu`    | CPU limit               | `500m`                     |
| `api.resources.limits.memory` | Memory limit            | `512Mi`                    |
| `api.autoscaling.enabled`     | Enable HPA              | `false`                    |

### PostgreSQL Configuration

| Parameter                             | Description       | Default    |
| ------------------------------------- | ----------------- | ---------- |
| `postgresql.enabled`                  | Deploy PostgreSQL | `true`     |
| `postgresql.auth.username`            | Database username | `babynest` |
| `postgresql.auth.password`            | Database password | `""`       |
| `postgresql.auth.database`            | Database name     | `babynest` |
| `postgresql.primary.persistence.size` | PVC size          | `10Gi`     |

### Redis Configuration

| Parameter                       | Description        | Default      |
| ------------------------------- | ------------------ | ------------ |
| `redis.enabled`                 | Deploy Redis       | `true`       |
| `redis.architecture`            | Redis architecture | `standalone` |
| `redis.auth.enabled`            | Enable Redis auth  | `false`      |
| `redis.master.persistence.size` | PVC size           | `2Gi`        |

### Ollama Configuration (AI)

| Parameter                        | Description         | Default         |
| -------------------------------- | ------------------- | --------------- |
| `ollama.enabled`                 | Deploy Ollama       | `false`         |
| `ollama.image.repository`        | Ollama image        | `ollama/ollama` |
| `ollama.model`                   | AI model to use     | `llama3`        |
| `ollama.persistence.size`        | PVC size for models | `50Gi`          |
| `ollama.resources.limits.memory` | Memory limit        | `8Gi`           |

### Secrets Configuration

| Parameter                     | Description          | Default               |
| ----------------------------- | -------------------- | --------------------- |
| `secrets.jwt.secret`          | JWT signing secret   | `""` (auto-generated) |
| `secrets.jwt.refreshSecret`   | JWT refresh secret   | `""` (auto-generated) |
| `secrets.jwt.existingSecret`  | Use existing secret  | `""`                  |
| `secrets.jwtExpiresIn`        | Access token expiry  | `15m`                 |
| `secrets.jwtRefreshExpiresIn` | Refresh token expiry | `7d`                  |

## Examples

### Production Deployment with Ingress

```yaml
# production-values.yaml
api:
  replicaCount: 3
  ingress:
    enabled: true
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
      - host: babynest.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: babynest-tls
        hosts:
          - babynest.example.com
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10

postgresql:
  auth:
    password: 'secure-password-here'
  primary:
    persistence:
      size: 50Gi

redis:
  auth:
    enabled: true
    password: 'redis-password-here'

ollama:
  enabled: true
  resources:
    limits:
      nvidia.com/gpu: 1

secrets:
  jwt:
    secret: 'production-jwt-secret'
    refreshSecret: 'production-refresh-secret'
```

### Using External Database

```yaml
# external-db-values.yaml
postgresql:
  enabled: false
  external:
    host: my-postgres.example.com
    port: 5432
    database: babynest
    username: babynest
    existingSecret: my-postgres-secret
    existingSecretPasswordKey: password

redis:
  enabled: false
  external:
    host: my-redis.example.com
    port: 6379
    existingSecret: my-redis-secret
    existingSecretPasswordKey: password
```

### Minimal Development Setup

```yaml
# dev-values.yaml
api:
  replicaCount: 1
  resources:
    limits:
      cpu: 200m
      memory: 256Mi

postgresql:
  auth:
    password: 'dev-password'
  primary:
    persistence:
      size: 1Gi

redis:
  master:
    persistence:
      size: 500Mi

ollama:
  enabled: false
```

## Upgrading

### To upgrade an existing release:

```bash
helm upgrade babynest ./infra/helm -f my-values.yaml
```

### Database Migrations

Database migrations are automatically run when the API container starts. Ensure you have a backup before upgrading.

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -l app.kubernetes.io/name=babynest
```

### View Logs

```bash
kubectl logs -f -l app.kubernetes.io/name=babynest,app.kubernetes.io/component=api
```

### Check Database Connection

```bash
kubectl exec -it <api-pod> -- wget -qO- http://localhost:3000/api/v1/health/ready
```

## License

This chart is licensed under the MIT License.
