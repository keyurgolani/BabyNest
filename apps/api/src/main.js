"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    // Get configuration values
    const port = configService.get('PORT', 3000);
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    const corsOrigins = configService.get('CORS_ORIGINS', '');
    // Set global prefix
    app.setGlobalPrefix(apiPrefix);
    // Enable CORS
    app.enableCors({
        origin: corsOrigins.split(',').map((origin) => origin.trim()),
        credentials: true,
    });
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    // Swagger documentation
    const config = new swagger_1.DocumentBuilder()
        .setTitle('BabyNest API')
        .setDescription('BabyNest - Self-hosted baby tracking application API. ' +
        'Track feeding, sleep, diapers, growth, milestones, health, and activities.')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.listen(port);
    console.log(`🍼 BabyNest API is running on: http://localhost:${port}/${apiPrefix}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map