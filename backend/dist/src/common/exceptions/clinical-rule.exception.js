"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalRuleException = void 0;
const common_1 = require("@nestjs/common");
class ClinicalRuleException extends common_1.HttpException {
    constructor(message, errorCode = 'CLINICAL_RULE_VIOLATION') {
        super({
            success: false,
            statusCode: common_1.HttpStatus.FORBIDDEN,
            errorCode,
            message,
        }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ClinicalRuleException = ClinicalRuleException;
//# sourceMappingURL=clinical-rule.exception.js.map