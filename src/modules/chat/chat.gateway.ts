import { ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/entity/user.entity';
import { ChatService } from './chat.service';

interface MessagePayload {
  chatId: string;
  message: string;
}

interface ChatPayload {
  chatId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/socket.io',
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private users: Map<string, User> = new Map();
  private readonly heartbeatInterval = 30000;
  private heartbeatTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private setupHeartbeat(client: Socket) {
    const timeout = setTimeout(() => {
      this.logger.warn(`Client ${client.id} heartbeat timeout - disconnecting`);
      client.disconnect();
    }, this.heartbeatInterval * 2);

    this.heartbeatTimeouts.set(client.id, timeout);

    client.on('heartbeat', () => {
      const existingTimeout = this.heartbeatTimeouts.get(client.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      this.heartbeatTimeouts.set(
        client.id,
        setTimeout(() => {
          this.logger.warn(
            `Client ${client.id} heartbeat timeout - disconnecting`,
          );
          client.disconnect();
        }, this.heartbeatInterval * 2),
      );

      client.emit('heartbeat-ack');
    });
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);
      const token = client.handshake.query.token as string;

      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = await this.authService.verifyTokens(token);

      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new WsException('User not found');
      }

      this.users.set(client.id, user);
      this.setupHeartbeat(client);

      client.emit('connected', {
        message: 'Successfully connected',
        heartbeatInterval: this.heartbeatInterval,
      });

      this.logger.log(`Client connected: ${client.id}, User: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}:`,
        error.stack,
      );
      client.emit('error', { message: error.message });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.users.get(client.id);
    this.logger.log(
      `Client disconnected: ${client.id}, User: ${user?.email ?? 'Unknown'}`,
    );

    const timeout = this.heartbeatTimeouts.get(client.id);
    if (timeout) {
      clearTimeout(timeout);
      this.heartbeatTimeouts.delete(client.id);
    }

    this.users.delete(client.id);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() payload: MessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.users.get(client.id);
    if (!user) {
      throw new WsException('User not authenticated');
    }

    try {
      const { chatId, message } = payload;

      const [userMessage, aiMessage] = await Promise.all([
        this.chatService.sendMessage(chatId, { content: message }, user),
        this.chatService
          .getResponseFromAI(message)
          .then((aiResponse) =>
            this.chatService.sendAIMessage(chatId, aiResponse, user),
          ),
      ]);

      const response = {
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          sender: userMessage.sender,
          timestamp: userMessage.createdAt,
        },
        aiMessage: {
          id: aiMessage.id,
          content: aiMessage.content,
          sender: aiMessage.sender,
          timestamp: aiMessage.createdAt,
        },
      };

      client.broadcast.to(`chat_${chatId}`).emit('receive_message', response);
      client.emit('message_sent', response);

      this.logger.debug(`Message processed for chat ${chatId}`);
    } catch (error) {
      this.logger.error('Error handling message:', error.stack);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @MessageBody() payload: ChatPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.users.get(client.id);
    if (!user) {
      throw new WsException('User not authenticated');
    }

    try {
      const { chatId } = payload;
      const chats = await this.chatService.getUserChats(user);
      const chat = chats.find((c) => c.id === chatId);

      if (!chat) {
        throw new ForbiddenException('You do not have access to this chat');
      }

      const rooms = client.rooms;
      rooms.forEach((room) => {
        if (room.startsWith('chat_')) {
          client.leave(room);
        }
      });

      client.join(`chat_${chatId}`);

      client.emit('joined_chat', {
        chatId,
        name: chat.title,
        messages: chat.messages,
        message: 'Successfully joined chat',
      });

      this.logger.log(`User ${user.email} joined chat ${chatId}`);
    } catch (error) {
      this.logger.error('Error joining chat:', error.stack);
      throw new WsException(error.message);
    }
  }
}
