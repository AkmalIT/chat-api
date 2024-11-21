import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Entity, Column } from 'typeorm';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  refreshToken: string;
}
