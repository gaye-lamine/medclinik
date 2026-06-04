import { HttpException } from '@nestjs/common';
export declare class FinancialException extends HttpException {
    constructor(message: string, errorCode?: string);
}
