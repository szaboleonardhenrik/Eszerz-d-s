import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from './apikeys.service';
import { REQUIRED_SCOPES_KEY } from './require-scope.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer szp_')) {
      throw new UnauthorizedException('Érvénytelen API kulcs');
    }

    const rawKey = authHeader.replace('Bearer ', '');
    const result = await this.apiKeysService.validateKey(rawKey);

    if (!result) {
      throw new UnauthorizedException('Érvénytelen vagy lejárt API kulcs');
    }

    // Check required scopes
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredScopes && requiredScopes.length > 0) {
      const missing = requiredScopes.filter(s => !result.scopes.includes(s));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Hiányzó API kulcs jogosultság: ${missing.join(', ')}`,
        );
      }
    }

    request.user = {
      userId: result.userId,
      apiKey: true,
      scopes: result.scopes,
    };

    return true;
  }
}
