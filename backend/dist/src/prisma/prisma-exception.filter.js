"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaClientExceptionFilter = class PrismaClientExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        switch (exception.code) {
            case 'P2002': {
                const status = common_1.HttpStatus.CONFLICT;
                const target = exception.meta?.target || [];
                const fields = target.join(', ');
                response.status(status).json({
                    statusCode: status,
                    error: 'Conflict',
                    message: `Une contrainte d'unicité a échoué sur les champs : ${fields || 'inconnus'}.`,
                });
                break;
            }
            case 'P2025': {
                const status = common_1.HttpStatus.NOT_FOUND;
                response.status(status).json({
                    statusCode: status,
                    error: 'Not Found',
                    message: exception.meta?.cause || 'L\'enregistrement demandé est introuvable.',
                });
                break;
            }
            case 'P2003': {
                const status = common_1.HttpStatus.BAD_REQUEST;
                response.status(status).json({
                    statusCode: status,
                    error: 'Bad Request',
                    message: 'Erreur d\'intégrité de la base de données : une relation requise est manquante ou invalide.',
                });
                break;
            }
            default: {
                const status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                response.status(status).json({
                    statusCode: status,
                    error: 'Internal Server Error',
                    message: 'Une erreur interne de base de données s\'est produite.',
                });
                break;
            }
        }
    }
};
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter;
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaClientExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map