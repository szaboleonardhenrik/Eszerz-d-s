import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsGatewayModule {}
