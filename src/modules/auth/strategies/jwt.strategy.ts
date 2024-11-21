import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ignoreExpiration: false, 
      secretOrKey: process.env.JWT_SECRET, 
    });
  }

  async validate(payload: { userId: string; email: string }) {
    const user = await this.authService.validateUser(payload.userId); 
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user; 
  }
}
