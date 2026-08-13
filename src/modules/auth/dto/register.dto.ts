import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'juan.perez@novabank.es', description: 'Correo electrónico corporativo o personal' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña segura (mínimo 8 caracteres, con mayúsculas, números y símbolos)',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un número o símbolo especial',
  })
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre de pila del titular' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName: string;

  @ApiProperty({ example: 'Pérez Gómez', description: 'Apellidos del titular' })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  lastName: string;

  @ApiProperty({ example: '12345678Z', description: 'Documento Nacional de Identidad o NIE' })
  @IsString()
  @IsNotEmpty({ message: 'El documento nacional de identidad es requerido' })
  nationalId: string;

  @ApiProperty({
    enum: Role,
    default: Role.CLIENTE,
    description: 'Rol en el sistema bancario (Solo los administradores pueden asignar roles especiales)',
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Rol inválido' })
  role?: Role = Role.CLIENTE;
}
