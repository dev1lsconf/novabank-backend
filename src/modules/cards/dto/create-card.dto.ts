import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';
import { CardType, CardStatus } from '../../../common/enums/entry-type.enum';

export class CreateCardDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria a la que se asocia la tarjeta (UUID)' })
  @IsUUID('4')
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ enum: CardType, default: CardType.DEBIT, description: 'Tipo de tarjeta bancaria' })
  @IsEnum(CardType)
  cardType: CardType;

  @ApiPropertyOptional({ description: 'Límite diario de gasto en euros', default: 1000, example: 1500 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(50)
  dailyLimitEur?: number = 1000;
}

export class UpdateCardLimitDto {
  @ApiProperty({ description: 'Nuevo límite diario en euros', example: 2000, minimum: 50 })
  @IsInt()
  @IsPositive()
  @Min(50)
  dailyLimitEur: number;
}
