import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayBillingDto {
  @ApiProperty({ example: 'CASH' })
  @IsNotEmpty({ message: 'La méthode de paiement est requise' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: 'TX-12345', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
