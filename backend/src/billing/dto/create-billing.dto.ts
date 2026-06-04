import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBillingDto {
  @ApiProperty({ example: 'uuid-patient' })
  @IsNotEmpty({ message: 'L\'ID du patient est requis' })
  @IsUUID('all', { message: 'ID patient invalide' })
  patientId: string;

  @ApiProperty({ example: 15000 })
  @IsNotEmpty({ message: 'Le montant est requis' })
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @Min(0, { message: 'Le montant doit être supérieur ou égal à 0' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'uuid-doctor' })
  @IsNotEmpty({ message: 'L\'ID du médecin est requis' })
  @IsUUID('all', { message: 'ID médecin invalide' })
  doctorId: string;

  @ApiProperty({ example: 'General', required: false })
  @IsOptional()
  @IsString()
  specialty?: string;
}
