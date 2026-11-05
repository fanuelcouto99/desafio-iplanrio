import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from './auth-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const publicKey = Buffer.from(
      config.getOrThrow<string>('JWT_PUBLIC_KEY_B64'),
      'base64',
    ).toString('utf8');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: publicKey,
      algorithms: ['RS256'],
      issuer: 'corridas-teste',
      ignoreExpiration: false,
    });
  }

  validate(payload: { sub?: string; role?: string }): AuthUser {
    if (
      !payload.sub ||
      (payload.role !== 'passageiro' && payload.role !== 'motorista')
    ) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
