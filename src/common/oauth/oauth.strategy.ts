import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OAuthService } from './oauth.service';
import { env } from '../config';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(GoogleStrategy, 'google') {
  constructor(
    private readonly oauthService: OAuthService,
  ) {
    super({
      clientID: env.GOOGLE_CLIENT_ID, 
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/oauth/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, displayName, emails, photos } = profile;
    const user = {
      googleId: id,
      name: displayName,
      email: emails[0].value,
      avatarUrl: photos[0].value,
      accessToken,
      refreshToken,
    };

    return user;
  }
}
