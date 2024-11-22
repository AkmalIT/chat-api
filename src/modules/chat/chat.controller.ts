import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../auth/entity/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createChat(
    @Body() createChatDto: CreateChatDto,
    @GetUser() user: User,
  ) {
    return this.chatService.createChat(createChatDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyChats(@GetUser() user: User) {
    return this.chatService.getUserChats(user);
  }
}
