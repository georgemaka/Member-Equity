import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/auth.decorator';

@Injectable()
export class DevAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // In development mode, check for mock auth header
    const mockAuth = request.headers['x-mock-auth'];
    if (mockAuth) {
      try {
        const mockUser = JSON.parse(mockAuth);
        request.user = {
          userId: mockUser.id || 'dev-user-id',
          email: mockUser.email || 'dev@example.com',
          companyId: mockUser.companyId || 'cmbno3kq80000596mblh2id26',
          role: mockUser.role || 'admin',
          permissions: mockUser.permissions || ['*'],
        };
        return true;
      } catch (e) {
        // Fall through to JWT auth
      }
    }

    // Fall back to JWT auth if available
    return super.canActivate(context);
  }
}