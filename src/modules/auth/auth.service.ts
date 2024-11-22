import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { env } from 'src/common/config';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private generateTokens(payload: { userId: string; email: string }) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m', secret: env.JWT_SECRET });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d', secret: env.JWT_SECRET });
    return { accessToken, refreshToken };
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });
    return await this.userRepository.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return { accessToken, refreshToken };
  }

  async googleLogin(profile: {
    googleId: string;
    email: string;
    name: string;
  }) {
    let user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      user = this.userRepository.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
      });
      await this.userRepository.save(user);
    }

    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    user.refreshToken = newRefreshToken;
    await this.userRepository.save(user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  public verifyTokens(token: string) {
    const payload = this.jwtService.verify(token, { secret: env.JWT_SECRET });
    return payload;
  }
}
