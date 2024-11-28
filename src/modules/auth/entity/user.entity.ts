import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Chat } from 'src/modules/chat/entity/chat.entity';
import { Message } from 'src/modules/chat/entity/message.entity';
import { Column, Entity, OneToMany } from 'typeorm';

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

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => Chat, (chat) => chat.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  chats: Chat[];
}
