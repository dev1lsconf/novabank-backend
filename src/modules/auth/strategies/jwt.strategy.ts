import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JsonDbService } from '../../../infra/database/json-db.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly db: JsonDbService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'novabank_ultra_secure_jwt_secret_key_2026_xyz987',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.db.findUserById(payload.sub);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('El usuario no existe o se encuentra inactivo/bloqueado.');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nationalId: user.nationalId,
      role: user.role,
      status: user.status,
    };
  }
}
