import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

// Tách riêng để main.ts và test e2e dùng chung cấu hình.
export function setupApp(app: INestApplication, corsOrigin: string, trustProxy = 0) {
  // Sau proxy, req.ip mặc định là IP của proxy => cả người dùng chung một hạn mức throttler.
  // Chỉ bật khi thật sự có proxy, vì nếu không client có thể giả header X-Forwarded-For.
  if (trustProxy > 0) app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);

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
