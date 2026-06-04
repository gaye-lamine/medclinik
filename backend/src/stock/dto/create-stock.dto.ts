import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockDto {
  @ApiProperty({ example: 'Paracétamol 500mg' })
  @IsNotEmpty({ message: 'Le nom de l\'article est requis' })
  @IsString()
  name: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty({ message: 'La quantité est requise' })
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(0, { message: 'La quantité ne peut pas être négative' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 'boîtes' })
  @IsNotEmpty({ message: 'L\'unité est requise' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty({ message: 'Le seuil critique est requis' })
  @IsNumber({}, { message: 'Le seuil critique doit être un nombre' })
  @Min(0, { message: 'Le seuil critique ne peut pas être négatif' })
  @Type(() => Number)
  criticalThreshold: number;

  @ApiProperty({ example: 'Médicaments' })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  @IsString()
  category: string;
}
