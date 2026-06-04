import { HttpException, HttpStatus } from '@nestjs/common';

export class InventoryException extends HttpException {
  constructor(message: string, errorCode = 'INVENTORY_ERROR') {
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
