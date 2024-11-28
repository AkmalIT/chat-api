import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { env } from 'src/common/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      accessType: 'offline',
      prompt: 'consent',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Profile:', profile);

    try {
      const { id, emails, displayName } = profile;
      const {
        accessToken: generatedAccessToken,
        refreshToken: generatedRefreshToken,
      } = await this.authService.googleLogin({
        googleId: id,
        email: emails[0].value,
        name: displayName,
      });

      console.log('Generated Access Token:', generatedAccessToken);
      console.log('Generated Refresh Token:', generatedRefreshToken);

      done(null, {
        accessToken: generatedAccessToken,
        refreshToken: generatedRefreshToken,
      });
    } catch (err) {
      console.error('Validation error:', err);
      done(err, null);
    }
  }
}
