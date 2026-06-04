import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteConsultationDto {
  @ApiProperty({ example: 'Paludisme simple', required: false })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({ example: 'Reposer pendant 3 jours, boire beaucoup d\'eau.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
