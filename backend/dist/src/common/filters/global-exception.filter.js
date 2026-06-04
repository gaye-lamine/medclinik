"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = 'INTERNAL_SERVER_ERROR';
        let message = 'Une erreur interne inattendue s\'est produite sur le serveur.';
        let validationErrors = null;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const resPayload = exception.getResponse();
            if (typeof resPayload === 'object' && resPayload !== null) {
                if (resPayload.errorCode) {
                    errorCode = resPayload.errorCode;
                    message = resPayload.message || message;
                }
                else if (resPayload.message && Array.isArray(resPayload.message)) {
                    errorCode = 'VALIDATION_FAILED';
                    message = 'La validation des données d\'entrée a échoué.';
                    validationErrors = resPayload.message;
                }
                else {
                    message = resPayload.message || exception.message;
                    errorCode = this.mapNestExceptionToErrorCode(exception.constructor.name);
                }
            }
            else {
                message = exception.message;
                errorCode = this.mapNestExceptionToErrorCode(exception.constructor.name);
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            this.logger.warn(`Prisma Error [${exception.code}]: ${exception.message}`);
            switch (exception.code) {
                case 'P2002': {
                    statusCode = common_1.HttpStatus.CONFLICT;
                    errorCode = 'DATABASE_UNIQUE_CONSTRAINT';
                    const target = exception.meta?.target || [];
                    const fields = target.join(', ');
                    message = `Un enregistrement avec cette valeur existe déjà (champs en conflit : ${fields || 'inconnus'}).`;
                    break;
                }
                case 'P2025': {
                    statusCode = common_1.HttpStatus.NOT_FOUND;
                    errorCode = 'RECORD_NOT_FOUND';
                    message = exception.meta?.cause || 'L\'enregistrement demandé est introuvable.';
                    break;
                }
                case 'P2003': {
                    statusCode = common_1.HttpStatus.BAD_REQUEST;
                    errorCode = 'DATABASE_RELATION_VIOLATION';
                    message = 'L\'opération viole une contrainte d\'intégrité référentielle en base de données.';
                    break;
                }
                default: {
                    statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                    errorCode = 'DATABASE_ERROR';
                    message = `Erreur de persistance de données (${exception.code}).`;
                    break;
                }
            }
        }
        else {
            this.logger.error(`Exception non gérée interceptée: ${exception.message || exception}`, exception.stack);
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
    mapNestExceptionToErrorCode(exceptionClassName) {
        const map = {
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
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map