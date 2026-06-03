import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException, 
  UseGuards,
  Query,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Post('patient/:patientId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    }),
  )
  async uploadFile(
    @Param('patientId') patientId: string,
    @UploadedFile() file: any,
    @Body('consultationId') consultationId?: string,
    @Body('name') customName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new BadRequestException('Patient introuvable.');
    }

    // Determine type (DICOM, JPEG, PDF, etc.)
    const extension = extname(file.originalname).toLowerCase();
    let type = 'AUTRE';
    if (extension === '.dcm') {
      type = 'DICOM';
    } else if (['.jpg', '.jpeg', '.png'].includes(extension)) {
      type = 'JPEG';
    } else if (extension === '.pdf') {
      type = 'PDF';
    }

    const fileUrl = `/uploads/${file.filename}`;

    const newFile = await this.prisma.patientFile.create({
      data: {
        patientId,
        consultationId: consultationId || null,
        name: customName || file.originalname,
        url: fileUrl,
        type,
        size: file.size,
      },
    });

    return newFile;
  }

  @Get('patient/:patientId')
  async getFiles(@Param('patientId') patientId: string) {
    return this.prisma.patientFile.findMany({
      where: { patientId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
