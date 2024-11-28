import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
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
    console.log('Creating chat with dto:', createChatDto); 
    return this.chatService.createChat(createChatDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyChats(@GetUser() user: User) {
    console.log('Getting chats for user:', user.id); 
    return this.chatService.getUserChats(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getChatById(@Param('id') id: string, @GetUser() user: User) {
    return this.chatService.getChatById(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteChat(@Param('id') id: string){
      return this.chatService.deleteChat(id)
  }
}
