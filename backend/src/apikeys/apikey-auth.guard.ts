import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from './apikeys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

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

    request.user = {
      userId: result.userId,
      apiKey: true,
      scopes: result.scopes,
    };

    return true;
  }
}
