import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import 'dotenv/config';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
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

  // Configurer Swagger
  const config = new DocumentBuilder()
    .setTitle('MedClinik API')
    .setDescription('Documentation de l\'API MedClinik')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3006;
  await app.listen(port, '0.0.0.0');
  console.log(`Application MedClinik lancée sur le port : ${port}`);
}
bootstrap();
