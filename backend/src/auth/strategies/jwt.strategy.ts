import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Validate token payload structure
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token structure');
    }

    // Extract company information
    const companyId = payload.companyId || payload['https://api.example.com/companyId'] || 'sukut-construction-llc';
    
    // Return user context for request
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: companyId,
      role: payload.role || payload['https://api.example.com/role'] || 'member',
      permissions: payload.permissions || [],
    };
  }
}