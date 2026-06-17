# BabyNest 🍼

A self-hosted, open-source baby tracking application designed for privacy-conscious parents.

[![CI](https://github.com/keyurgolani/BabyNest/actions/workflows/ci.yml/badge.svg)](https://github.com/keyurgolani/BabyNest/actions/workflows/ci.yml)
[![Docker Publish](https://github.com/keyurgolani/BabyNest/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/keyurgolani/BabyNest/actions/workflows/docker-publish.yml)
[![Release](https://github.com/keyurgolani/BabyNest/actions/workflows/release.yml/badge.svg)](https://github.com/keyurgolani/BabyNest/actions/workflows/release.yml)

<p align="center">
  <img src="docs/screenshots/03-dashboard.png" alt="Dashboard with AI health summary" width="30%" />
  <img src="docs/screenshots/02-quick-log.png" alt="One-tap quick log" width="30%" />
  <img src="docs/screenshots/04-tracking.png" alt="Activity timeline" width="30%" />
</p>

<p align="center"><strong>📸 <a href="SHOWCASE.md">See the full visual showcase »</a></strong> — dashboard & AI insights, one-tap logging, milestones, and medical reports.</p>

## Features

- 📱 **Mobile-first PWA** with native mobile app support (iOS & Android)
- 🔒 **Self-hosted** for complete data privacy
- 🤖 **Local AI-powered insights** via Ollama
- 🔄 **Offline-first** with automatic sync
- 📊 **Comprehensive tracking**: feeding, sleep, diapers, growth, milestones, health
- 🌙 **Dark mode** for nighttime use
- 👆 **One-handed operation** optimized
- 👨‍👩‍👧 **Multi-caregiver support** with handoff notes
- 📈 **Growth charts** and developmental milestone tracking
- 💊 **Health records** including vaccinations and medications
- 🔔 **Smart reminders** for feeding, medications, and appointments

## Tech Stack

| Component          | Technology                        |
| ------------------ | --------------------------------- |
| **API**            | NestJS, Prisma, PostgreSQL, Redis |
| **Web**            | Next.js 15, React 19, TailwindCSS |
| **Mobile**         | Expo, React Native, NativeWind    |
| **AI**             | Ollama (local LLM)                |
| **Infrastructure** | Docker, Kubernetes (Helm)         |
| **Monorepo**       | Turborepo                         |

## Project Structure

```
babynest/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── mobile/       # Expo/React Native mobile app
│   └── web/          # Next.js web frontend
├── packages/
│   ├── tsconfig/     # Shared TypeScript configurations
│   ├── eslint-config/# Shared ESLint configurations
│   ├── types/        # Shared TypeScript interfaces
│   └── validators/   # Shared Zod validation schemas
├── infra/
│   ├── docker/       # Docker Compose deployment
│   └── helm/         # Kubernetes Helm charts
└── turbo.json        # Turborepo configuration
```

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.5.0
- Docker & Docker Compose (for containerized deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/keyurgolani/BabyNest.git
cd BabyNest

# Install dependencies
npm install

# Run development servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Docker Deployment

#### Development (with hot-reload)

```bash
# Copy environment file
cp infra/docker/.env.example infra/docker/.env

# Start development stack with watch mode
npm run docker:dev

# Or start without watch
npm run docker:dev:up

# View logs
npm run docker:dev:logs

# Stop services
npm run docker:dev:down
```

#### Production

```bash
# Copy and configure environment
cp infra/docker/.env.example infra/docker/.env
# Edit infra/docker/.env with production settings

# Pull and start production images
npm run docker:prod:pull
npm run docker:prod

# With AI (Ollama)
npm run docker:prod:ai

# View logs
npm run docker:prod:logs

# Stop services
npm run docker:prod:down
```

### Using Pre-built Docker Images

Images are available from both GitHub Container Registry and Docker Hub:

```bash
# GitHub Container Registry
docker pull ghcr.io/keyurgolani/babynest-api:latest
docker pull ghcr.io/keyurgolani/babynest-web:latest

# Docker Hub
docker pull keyurgolani/babynest-api:latest
docker pull keyurgolani/babynest-web:latest
```

### Kubernetes with Helm

```bash
cd infra/helm
helm dependency update
helm install babynest . -f values.yaml
```

See [infra/helm/README.md](infra/helm/README.md) for detailed Kubernetes deployment instructions.

## Mobile App

### Android APK

Pre-built Android APKs are available in [GitHub Releases](https://github.com/keyurgolani/BabyNest/releases).

### Building from Source

```bash
cd apps/mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Build Android APK locally
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

## Environment Variables

### API Configuration

| Variable          | Description                  | Default                  |
| ----------------- | ---------------------------- | ------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string | Required                 |
| `REDIS_HOST`      | Redis host                   | `localhost`              |
| `JWT_SECRET`      | JWT signing secret           | Required                 |
| `OLLAMA_BASE_URL` | Ollama API URL               | `http://localhost:11434` |

### Web Configuration

| Variable              | Description  | Default                        |
| --------------------- | ------------ | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3000/api/v1` |

See `infra/docker/.env.example` for all configuration options.

## API Documentation

The API provides RESTful endpoints for all tracking features:

- `/api/v1/auth` - Authentication (register, login, refresh)
- `/api/v1/babies` - Baby profiles management
- `/api/v1/feeding` - Feeding logs (breast, bottle, solid)
- `/api/v1/sleep` - Sleep tracking
- `/api/v1/diaper` - Diaper changes
- `/api/v1/growth` - Growth measurements
- `/api/v1/milestones` - Developmental milestones
- `/api/v1/health` - Health records, vaccinations
- `/api/v1/reminders` - Scheduled reminders
- `/api/v1/insights` - AI-powered insights
- `/api/v1/dashboard` - Dashboard summaries

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Keyur Golani** - [GitHub](https://github.com/keyurgolani)
