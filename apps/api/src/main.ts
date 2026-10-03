import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';
import { setupApp } from './setup-app.js';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));

const config = app.get<ConfigService<Env, true>>(ConfigService);
setupApp(app, config.get('CORS_ORIGIN'));

const port = config.get('PORT');
await app.listen(port);
app.get(Logger).log(`API running on http://localhost:${port}/api (docs: /docs)`);
