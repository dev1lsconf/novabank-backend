import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AccountType, AccountStatus } from '../../../common/enums/account-type.enum';

export class CreateAccountDto {
  @ApiPropertyOptional({ description: 'ID del usuario titular (Si es omitido, se usa el usuario autenticado)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: AccountType, default: AccountType.CHECKING, description: 'Tipo de cuenta bancaria' })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR', description: 'Divisa ISO de la cuenta' })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';
}

export class ChangeAccountStatusDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.FROZEN, description: 'Nuevo estado de la cuenta' })
  @IsEnum(AccountStatus)
  status: AccountStatus;
}
