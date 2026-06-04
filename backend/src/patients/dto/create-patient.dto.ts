import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Moussa' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Traoré' })
  @IsNotEmpty({ message: 'Le nom de famille est requis' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1980-05-15' })
  @IsNotEmpty({ message: 'La date de naissance est requise' })
  @IsISO8601({}, { message: 'Format de date invalide (AAAA-MM-JJ)' })
  dateOfBirth: string;

  @ApiProperty({ example: 'M' })
  @IsNotEmpty({ message: 'Le genre est requis' })
  @IsString()
  gender: string;

  @ApiProperty({ example: '+221771234567' })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Dakar, Plateau', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'IPM Senelec', required: false })
  @IsOptional()
  @IsString()
  mutuelleName?: string;

  @ApiProperty({ example: 80, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'La part de couverture doit être un nombre' })
  @Min(0, { message: 'La part de couverture doit être supérieure ou égale à 0' })
  @Max(100, { message: 'La part de couverture doit être inférieure ou égale à 100' })
  @Type(() => Number)
  insuranceCoverageShare?: number;
}
