import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'cliente@novabank.es', description: 'Correo electrónico registrado' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña de acceso' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token de refresco JWT para renovar la sesión' })
  @IsString()
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Access Token JWT Bearer' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh Token JWT para renovación de sesión' })
  refreshToken: string;

  @ApiProperty({ description: 'Tiempo de expiración en segundos', example: 86400 })
  expiresIn: number;

  @ApiProperty({ description: 'Datos básicos del usuario' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    role: string;
  };
}
