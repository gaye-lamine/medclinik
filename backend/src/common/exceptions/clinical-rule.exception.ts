import { HttpException, HttpStatus } from '@nestjs/common';

export class ClinicalRuleException extends HttpException {
  constructor(message: string, errorCode = 'CLINICAL_RULE_VIOLATION') {
    super(
      {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        errorCode,
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
