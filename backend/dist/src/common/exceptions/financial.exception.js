"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialException = void 0;
const common_1 = require("@nestjs/common");
class FinancialException extends common_1.HttpException {
    constructor(message, errorCode = 'FINANCIAL_ERROR') {
        super({
            success: false,
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            errorCode,
            message,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.FinancialException = FinancialException;
//# sourceMappingURL=financial.exception.js.map