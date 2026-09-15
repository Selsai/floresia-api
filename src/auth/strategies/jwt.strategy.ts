import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'floresia_dev_secret_a_changer_plus_tard',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
  }) {
    console.log('JWT VALIDATE =>', payload);

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}