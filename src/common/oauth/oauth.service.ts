import { Injectable } from '@nestjs/common';
import { OAuthToken } from './oauth-token.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/users.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(OAuthToken)
    private oauthTokenRepository: Repository<OAuthToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createOAuthToken(
    user: any,
    accessToken: string,
    refreshToken: string,
  ): Promise<OAuthToken> {
    const token = new OAuthToken();
    token.accessToken = accessToken;
    token.refreshToken = refreshToken;
    token.user = user;

    return this.oauthTokenRepository.save(token);
  }

  async getOAuthToken(user: User): Promise<OAuthToken | undefined> {
    return this.oauthTokenRepository.findOne({
      where: { user: user, isActive: true },
    });
  }

  async revokeToken(tokenId): Promise<void> {
    const token = await this.oauthTokenRepository.findOne(tokenId);
    if (token) {
      token.isActive = false;
      await this.oauthTokenRepository.save(token);
    }
  }
}
