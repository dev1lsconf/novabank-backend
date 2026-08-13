import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { JsonDbService } from '../../infra/database/json-db.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, AuthResponseDto, RefreshTokenDto } from './dto/login.dto';
import { IbanUtil } from '../../common/utils/iban.util';
import { Role } from '../../common/enums/role.enum';
import { AccountType } from '../../common/enums/account-type.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: JsonDbService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // 1. Verificar unicidad de email y documento nacional
    const existingByEmail = await this.db.findUserByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico.');
    }

    const existingByNationalId = await this.db.findUserByNationalId(dto.nationalId);
    if (existingByNationalId) {
      throw new ConflictException('Ya existe un usuario registrado con este documento de identidad.');
    }

    // 2. Hash de contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Crear usuario
    const newUser = await this.db.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      nationalId: dto.nationalId,
      role: dto.role || Role.CLIENTE,
      status: 'ACTIVE',
    });

    // 4. Crear cuenta corriente bancaria inicial para el cliente
    const iban = IbanUtil.generateSpanishIban();
    await this.db.createAccount({
      userId: newUser.id,
      accountNumber: iban,
      accountType: AccountType.CHECKING,
      currency: 'EUR',
      balanceCents: 0,
      lockedBalanceCents: 0,
      status: 'ACTIVE',
    });

    // 5. Auditoría
    await this.auditService.log({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      resource: 'User',
      resourceId: newUser.id,
      ipAddress,
      userAgent,
      metadata: { email: newUser.email, role: newUser.role },
    });

    return this.generateTokens(newUser);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.db.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales de acceso incorrectas.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.auditService.log({
        action: 'FAILED_LOGIN_ATTEMPT',
        resource: 'Auth',
        ipAddress,
        userAgent,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Credenciales de acceso incorrectas.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Su cuenta bancaria se encuentra bloqueada o suspendida.');
    }

    await this.auditService.log({
      userId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      resource: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const refreshSecret =
        this.configService.get<string>('jwt.refreshSecret') || 'novabank_refresh_secret_key_2026_abc123';
      const payload = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });

      const user = await this.db.findUserById(payload.sub);

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Sesión no válida o expirada.');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn') || '1d',
        },
      );

      return {
        accessToken: newAccessToken,
        expiresIn: 86400,
      };
    } catch {
      throw new UnauthorizedException('El Refresh Token proporcionado es inválido o ha expirado.');
    }
  }

  private generateTokens(user: { id: string; email: string; firstName: string; lastName: string; nationalId: string; role: string }): AuthResponseDto {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret') || 'novabank_refresh_secret_key_2026_abc123',
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nationalId: user.nationalId,
        role: user.role,
      },
    };
  }
}
