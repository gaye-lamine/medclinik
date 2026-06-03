import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: ['http://localhost:3005', 'http://127.0.0.1:3005'],
    credentials: true,
  });

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files
  app.use('/uploads', express.static(uploadsDir));

  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`Application MedClinik lancée sur le port : ${port}`);
}
bootstrap();
