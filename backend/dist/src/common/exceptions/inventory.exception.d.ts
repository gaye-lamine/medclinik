import { HttpException } from '@nestjs/common';
export declare class InventoryException extends HttpException {
    constructor(message: string, errorCode?: string);
}
