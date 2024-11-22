import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/modules/auth/entity/user.entity';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;

    return data ? user?.[data] : user;
  },
);
