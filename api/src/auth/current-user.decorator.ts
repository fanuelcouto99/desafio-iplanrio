import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './auth-user';

interface RequestWithUser {
  user: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
