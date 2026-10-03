import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

// Tách riêng để main.ts và test e2e dùng chung cấu hình.
export function setupApp(app: INestApplication, corsOrigin: string) {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',') });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Vibespot API')
      .setDescription('Tìm quán cà phê làm việc, bãi xe, trạm sạc ở TP.HCM')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, doc);
}
