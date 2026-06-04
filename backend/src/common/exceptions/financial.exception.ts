import { HttpException, HttpStatus } from '@nestjs/common';

export class FinancialException extends HttpException {
  constructor(message: string, errorCode = 'FINANCIAL_ERROR') {
    super(
      {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode,
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
