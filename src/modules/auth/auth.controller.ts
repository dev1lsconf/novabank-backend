import { Controller, Post, Body, Req, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, AuthResponseDto, RefreshTokenDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Autenticación y Seguridad')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo cliente bancario',
    description: 'Crea un nuevo usuario en la plataforma y le asigna automáticamente una cuenta corriente con un IBAN válido.',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Conflicto: Correo electrónico o documento de identidad ya registrado' })
  async register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResponseDto> {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.get('user-agent');
    return this.authService.register(dto, ip, ua);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión (Obtener Token Bearer)',
    description: 'Valida credenciales bancarias y retorna el JWT de acceso y el refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta suspendida' })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.get('user-agent');
    return this.authService.login(dto, ip, ua);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar Access Token con Refresh Token',
    description: 'Genera un nuevo token de acceso sin necesidad de reintroducir las credenciales.',
  })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Consultar perfil del usuario autenticado',
    description: 'Retorna los datos del usuario actual verificando el token Bearer.',
  })
  @ApiResponse({ status: 200, description: 'Perfil obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'Token no válido' })
  async getProfile(@CurrentUser() user: any) {
    return {
      statusCode: 200,
      user,
    };
  }
}
