import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { OAuthToken } from 'src/common/oauth/oauth-token.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => OAuthToken, (token) => token.user)
  tokens: OAuthToken[];
}
