import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import 'dotenv/config';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Préfixe global /api pour tous les endpoints REST
  // Le webhook Wave, les fichiers statiques (/uploads) et Socket.io
  // ne passent pas par ce préfixe car ils sont gérés séparément.
  app.setGlobalPrefix('api', {
    exclude: ['/uploads/(.*)'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files
  app.use('/uploads', express.static(uploadsDir));

  // Configurer Swagger (accessible sur /api/docs grâce au global prefix)
  const config = new DocumentBuilder()
    .setTitle('MedClinik API')
    .setDescription('Documentation de l\'API MedClinik')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3006;
  await app.listen(port, '0.0.0.0');
  console.log(`Application MedClinik lancée sur le port : ${port}`);
}
bootstrap();
