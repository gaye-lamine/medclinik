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
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

const ALLOWED_EXTENSIONS = ['.pdf', '.dcm', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/dicom',
  'image/jpeg',
  'image/png',
];

/** Vérification des Magic Bytes (signatures binaires réelles du fichier) */
function verifyMagicBytes(filePath: string, extension: string): boolean {
  try {
    const buffer = Buffer.alloc(132);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 132, 0);
    fs.closeSync(fd);

    if (extension === '.pdf') {
      // %PDF (0x25 0x50 0x44 0x46)
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }
    if (extension === '.jpg' || extension === '.jpeg') {
      // 0xFF 0xD8 0xFF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (extension === '.png') {
      // 0x89 0x50 0x4E 0x47 (\x89PNG)
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    if (extension === '.dcm') {
      // En-tête officiel DICOM : signature "DICM" aux octets 128-131
      const dicm = buffer.subarray(128, 132).toString('ascii');
      return dicm === 'DICM';
    }
    return false;
  } catch {
    return false;
  }
}

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Post('patient/:patientId')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        // Suppression stricte du fallback application/octet-stream
        const mimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
        const extValid = ALLOWED_EXTENSIONS.includes(ext);

        if (!extValid || !mimeValid) {
          return cb(
            new BadRequestException(
              `Format de fichier non autorisé (${ext}). Formats acceptés : PDF, JPEG, PNG, DICOM (.dcm).`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Téléverser une pièce jointe au dossier patient' })
  @ApiResponse({ status: 201, description: 'Fichier téléversé avec succès' })
  @ApiResponse({ status: 400, description: 'Format ou taille de fichier non autorisé' })
  async uploadFile(
    @Param('patientId') patientId: string,
    @UploadedFile() file: any,
    @Body('consultationId') consultationId?: string,
    @Body('name') customName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    const extension = extname(file.originalname).toLowerCase();

    // ── Vérification stricte de la signature binaire (Magic Bytes) ────────
    if (!verifyMagicBytes(file.path, extension)) {
      // Supprimer immédiatement le fichier malveillant/frelaté du disque local
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw new BadRequestException(
        `Le contenu binaire du fichier ne correspond pas à l'extension déclarée (${extension}). Téléversement bloqué.`,
      );
    }

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      // Nettoyer le fichier si patient introuvable
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw new BadRequestException('Patient introuvable.');
    }

    // Determine type (DICOM, JPEG, PDF, etc.)
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
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Lister les pièces jointes d\'un patient' })
  @ApiResponse({ status: 200, description: 'Fichiers récupérés' })
  async getFiles(@Param('patientId') patientId: string) {
    return this.prisma.patientFile.findMany({
      where: { patientId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
