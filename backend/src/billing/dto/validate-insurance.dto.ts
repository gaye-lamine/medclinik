import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateInsuranceDto {
  @ApiProperty({ example: 'AXA Assurances' })
  @IsNotEmpty({ message: 'Le nom de la mutuelle est requis' })
  @IsString()
  mutuelleName: string;

  @ApiProperty({ example: 80 })
  @IsNotEmpty({ message: 'Le taux de couverture est requis' })
  @IsNumber({}, { message: 'Le taux de couverture doit être un nombre' })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  coverageShare: number;
}
