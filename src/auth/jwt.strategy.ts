import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secretKey = process.env.AUTH_SECRET;

    if (!secretKey) {
      throw new Error('AUTH_SECRET belum didefinisikan di file .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  validate(payload: JwtPayload): {
    userId: number;
    email: string;
    role: string;
  } {
    return { userId: payload.userId, email: payload.email, role: payload.role };
  }
}
