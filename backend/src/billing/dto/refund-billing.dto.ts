import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundBillingDto {
  @ApiProperty({ example: 'Erreur d\'encaissement / Demande du patient' })
  @IsNotEmpty({ message: 'La raison de l\'annulation ou du remboursement est requise' })
  @IsString()
  reason: string;
}
