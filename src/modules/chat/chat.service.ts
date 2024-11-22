import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import axios from 'axios';
import { User } from '../auth/entity/user.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Chat } from './entity/chat.entity';
import { Message } from './entity/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createChat(createChatDto: CreateChatDto, user: User) {
    const chat = this.chatRepository.create({
      title: createChatDto.name,
      user: user,
      messages: [],
    });
    return await this.chatRepository.save(chat);
  }

  async sendMessage(
    chatId: string,
    createMessageDto: CreateMessageDto,
    user: User,
  ) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: { user: true },
    });

    if (!chat) {
      throw new ForbiddenException('Chat not found');
    }

    if (chat.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to send messages to this chat',
      );
    }

    const message = this.messageRepository.create({
      content: createMessageDto.content,
      sender: 'user',
      user: user,
      chat: chat,
    });

    return await this.messageRepository.save(message);
  }

  async sendAIMessage(chatId: string, content: string, user: User) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: { user: true },
    });

    if (!chat) {
      throw new ForbiddenException('Chat not found');
    }

    if (chat.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to send messages to this chat',
      );
    }

    const message = this.messageRepository.create({
      content: content,
      sender: 'ai',
      user: user,
      chat: chat,
    });

    return await this.messageRepository.save(message);
  }

  async getUserChats(user: User) {
    return this.chatRepository.find({
      where: { user: { id: user.id } },
      relations: { messages: true, user: true },
      order: { messages: { id: 'ASC' } },
    });
  }

  async getResponseFromAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post('http://localhost:5000/generate', {
        prompt: prompt,
        max_length: 100,
      });

      if (response.status !== 200) {
        throw new HttpException(
          'AI service error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data.generated_text;
    } catch (error) {
      throw new HttpException(
        'AI service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
