import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { env } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.useLogger(new Logger());
  await app.listen(env.PORT, () =>
    console.log(`Server started on port ${env.PORT}`),
  );
}
bootstrap();
