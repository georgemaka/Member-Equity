import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;

    return data ? user?.[data] : user;
  },
);

export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;
    // TODO: Remove default after JWT is enabled - using seeded company ID
    return user?.companyId || 'cmbno3kq80000596mblh2id26';
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;
    return user?.userId;
  },
);

export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;
    return user?.role;
  },
);