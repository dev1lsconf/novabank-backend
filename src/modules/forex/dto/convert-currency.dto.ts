import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Length } from 'class-validator';

export class ConvertCurrencyDto {
  @ApiProperty({ description: 'Código ISO de la divisa de origen', example: 'EUR' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  from: string;

  @ApiProperty({ description: 'Código ISO de la divisa de destino', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  to: string;

  @ApiProperty({ description: 'Importe en la divisa de origen a convertir', example: 250.00, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  amount: number;
}
