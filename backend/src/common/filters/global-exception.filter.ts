import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Une erreur interne inattendue s\'est produite sur le serveur.';
    let validationErrors: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resPayload: any = exception.getResponse();

      if (typeof resPayload === 'object' && resPayload !== null) {
        // Custom domain exceptions we defined
        if (resPayload.errorCode) {
          errorCode = resPayload.errorCode;
          message = resPayload.message || message;
        } 
        // ValidationPipe defaults (Array of validation errors)
        else if (resPayload.message && Array.isArray(resPayload.message)) {
          errorCode = 'VALIDATION_FAILED';
          message = 'La validation des données d\'entrée a échoué.';
          validationErrors = resPayload.message;
        } 
        // Standard NestJS exceptions
        else {
          message = resPayload.message || exception.message;
          errorCode = this.mapNestExceptionToErrorCode(exception.constructor.name);
        }
      } else {
        message = exception.message;
        errorCode = this.mapNestExceptionToErrorCode(exception.constructor.name);
      }
    } 
    // Prisma client errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.warn(`Prisma Error [${exception.code}]: ${exception.message}`);
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          errorCode = 'DATABASE_UNIQUE_CONSTRAINT';
          const target = (exception.meta?.target as string[]) || [];
          const fields = target.join(', ');
          message = `Un enregistrement avec cette valeur existe déjà (champs en conflit : ${fields || 'inconnus'}).`;
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          errorCode = 'RECORD_NOT_FOUND';
          message = (exception.meta?.cause as string) || 'L\'enregistrement demandé est introuvable.';
          break;
        }
        case 'P2003': {
          statusCode = HttpStatus.BAD_REQUEST;
          errorCode = 'DATABASE_RELATION_VIOLATION';
          message = 'L\'opération viole une contrainte d\'intégrité référentielle en base de données.';
          break;
        }
        default: {
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          errorCode = 'DATABASE_ERROR';
          message = `Erreur de persistance de données (${exception.code}).`;
          break;
        }
      }
    } 
    // Unhandled application errors
    else {
      this.logger.error(`Exception non gérée interceptée: ${exception.message || exception}`, exception.stack);
      // In production, keep messages generic. In dev, we could log details.
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      validationErrors,
    });
  }

  private mapNestExceptionToErrorCode(exceptionClassName: string): string {
    const map: Record<string, string> = {
      BadRequestException: 'BAD_REQUEST',
      UnauthorizedException: 'UNAUTHORIZED',
      NotFoundException: 'RECORD_NOT_FOUND',
      ForbiddenException: 'FORBIDDEN',
      NotAcceptableException: 'NOT_ACCEPTABLE',
      RequestTimeoutException: 'REQUEST_TIMEOUT',
      ConflictException: 'CONFLICT',
      GoneException: 'GONE',
      HttpVersionNotSupportedException: 'HTTP_VERSION_NOT_SUPPORTED',
      PayloadTooLargeException: 'PAYLOAD_TOO_LARGE',
      UnsupportedMediaTypeException: 'UNSUPPORTED_MEDIA_TYPE',
      UnprocessableEntityException: 'UNPROCESSABLE_ENTITY',
      InternalServerErrorException: 'INTERNAL_SERVER_ERROR',
      NotImplementedException: 'NOT_IMPLEMENTED',
      BadGatewayException: 'BAD_GATEWAY',
      ServiceUnavailableException: 'SERVICE_UNAVAILABLE',
      GatewayTimeoutException: 'GATEWAY_TIMEOUT',
    };

    return map[exceptionClassName] || 'INTERNAL_SERVER_ERROR';
  }
}
