import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiProperty({ example: 3000, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant versé doit être un nombre' })
  @Min(0, { message: 'Le montant versé doit être supérieur ou égal à 0' })
  @Type(() => Number)
  amountPaid?: number;
}
