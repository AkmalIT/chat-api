import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../database/abstract.entity';
import { User } from 'src/modules/users/users.entity';

@Entity('oauth-token')
export class OAuthToken extends AbstractEntity {
  @Column()
  accessToken: string;

  @Column()
  refreshToken: string;

  @ManyToOne(() => User, (user) => user.tokens)
  user: User;

  @Column({ default: true })
  isActive: boolean;
}
