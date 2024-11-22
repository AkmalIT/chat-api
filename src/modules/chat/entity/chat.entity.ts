import { AbstractEntity } from 'src/common/database/abstract.entity';
import { User } from 'src/modules/auth/entity/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Message } from './message.entity';

@Entity('chat')
export class Chat extends AbstractEntity {
  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.chats, { eager: true })
  user: User;

  @OneToMany(() => Message, (message) => message.chat, { cascade: true })
  messages: Message[];
}
