"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryException = void 0;
const common_1 = require("@nestjs/common");
class InventoryException extends common_1.HttpException {
    constructor(message, errorCode = 'INVENTORY_ERROR') {
        super({
            success: false,
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            errorCode,
            message,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InventoryException = InventoryException;
//# sourceMappingURL=inventory.exception.js.map