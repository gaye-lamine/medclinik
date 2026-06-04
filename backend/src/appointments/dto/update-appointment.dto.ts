import { IsOptional, IsString, IsISO8601, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiProperty({ example: '2026-06-15T11:00:00Z', required: false })
  @IsOptional()
  @IsISO8601({}, { message: 'Format de date et heure invalide (ISO 8601)' })
  dateTime?: string;

  @ApiProperty({ example: 'COMPLETED', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], { message: 'Statut du rendez-vous invalide' })
  status?: string;

  @ApiProperty({ example: 'Pédiatrie', required: false })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({ example: 'Notes modifiées', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
