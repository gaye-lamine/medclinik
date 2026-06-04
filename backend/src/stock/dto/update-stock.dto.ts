import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(0, { message: 'La quantité ne peut pas être négative' })
  @Type(() => Number)
  quantity?: number;

  @ApiProperty({ example: 15, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Le seuil critique doit être un nombre' })
  @Min(0, { message: 'Le seuil critique ne peut pas être négatif' })
  @Type(() => Number)
  criticalThreshold?: number;
}
