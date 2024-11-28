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
    const sanitizedContent = content?.trim() || 'No response generated.';

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
      content: sanitizedContent, // Use sanitized content
      sender: 'ai',
      user: user,
      chat: chat,
    });

    try {
      return await this.messageRepository.save(message);
    } catch (error) {
      console.error('Error saving AI message:', error);
      throw new HttpException(
        'Failed to save AI message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserChats(user: User) {
    return this.chatRepository.find({
      where: { user: { id: user.id } },
      relations: { messages: true, user: true },
      order: { messages: { id: 'ASC' } },
    });
  }

  async getChatById(id: string, user: User) {
    const chat = await this.chatRepository.findOne({
      where: {
        id: id,
        user: { id: user.id },
      },
      relations: {
        messages: true,
        user: true,
      },
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });

    if (!chat) {
      throw new ForbiddenException('Chat not found');
    }

    const cleanedMessages = chat.messages.map((message) => {
      const cleanedMessage = new Message();
      Object.assign(cleanedMessage, message);
      cleanedMessage.content = message.content;
      return cleanedMessage;
    });

    chat.messages = cleanedMessages;

    return chat;
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

      const generatedText = response.data.generated_text?.trim() || '';

      if (!generatedText) {
        console.warn('Empty response from AI service');
        return 'I apologize, but I could not generate a meaningful response.';
      }

      return generatedText;
    } catch (error) {
      console.error('AI service error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'AI service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async deleteChat(id: string) {
    const chat = await this.chatRepository.findOne({
      where: { id },
    });

    if (!chat) throw new ForbiddenException('Chat not found');

    const messages = await this.messageRepository.find({
      where: { chat },
    });

    await this.messageRepository.remove(messages);
    await this.chatRepository.delete(chat);
  }
}
