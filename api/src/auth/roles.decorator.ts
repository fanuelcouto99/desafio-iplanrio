import { SetMetadata } from '@nestjs/common';
import { Role } from './auth-user';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
