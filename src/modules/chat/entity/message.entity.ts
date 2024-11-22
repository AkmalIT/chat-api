import { AbstractEntity } from 'src/common/database/abstract.entity';
import { User } from 'src/modules/auth/entity/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Chat } from './chat.entity';

@Entity()
export class Message extends AbstractEntity {
  @Column()
  content: string;

  @Column()
  sender: 'user' | 'ai';

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;
}
