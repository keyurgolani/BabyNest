export default () => ({
  // Application
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3000', 10),
  apiPrefix: process.env['API_PREFIX'] || 'api/v1',

  // Database
  database: {
    url: process.env['DATABASE_URL'],
  },

  // Redis
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || undefined,
  },

  // JWT Authentication
  jwt: {
    secret: process.env['JWT_SECRET'] || 'default-secret-change-me',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'default-refresh-secret-change-me',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },

  // Ollama AI
  ollama: {
    baseUrl: process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434',
    model: process.env['OLLAMA_MODEL'] || 'llama3',
    visionModel: process.env['OLLAMA_VISION_MODEL'] || 'gemma3',
  },

  // CORS
  cors: {
    origins: process.env['CORS_ORIGINS'] || 'http://localhost:3000',
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env['THROTTLE_TTL'] || '60', 10),
    limit: parseInt(process.env['THROTTLE_LIMIT'] || '100', 10),
  },
});
