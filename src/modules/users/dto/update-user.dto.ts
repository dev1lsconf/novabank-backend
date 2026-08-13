import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserStatus } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alejandro', description: 'Nombre' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Navarro', description: 'Apellidos' })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class ChangeUserStatusDto {
  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.BLOCKED, description: 'Nuevo estado de usuario' })
  @IsEnum(UserStatus)
  status: UserStatus;
}
