import { HttpException } from '@nestjs/common';
export declare class ClinicalRuleException extends HttpException {
    constructor(message: string, errorCode?: string);
}
