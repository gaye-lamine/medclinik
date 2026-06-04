import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        const fields = target.join(', ');
        response.status(status).json({
          statusCode: status,
          error: 'Conflict',
          message: `Une contrainte d'unicité a échoué sur les champs : ${fields || 'inconnus'}.`,
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          error: 'Not Found',
          message: (exception.meta?.cause as string) || 'L\'enregistrement demandé est introuvable.',
        });
        break;
      }
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          error: 'Bad Request',
          message: 'Erreur d\'intégrité de la base de données : une relation requise est manquante ou invalide.',
        });
        break;
      }
      default: {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(status).json({
          statusCode: status,
          error: 'Internal Server Error',
          message: 'Une erreur interne de base de données s\'est produite.',
        });
        break;
      }
    }
  }
}
