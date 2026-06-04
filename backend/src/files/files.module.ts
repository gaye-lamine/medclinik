import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FilesController],
})
export class FilesModule {}
