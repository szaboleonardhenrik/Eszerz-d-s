import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications-gateway/notifications.gateway';

@Injectable()
export class InAppNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(
    userId: string,
    data: { type: string; title: string; message: string; link?: string },
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    // Push via WebSocket in real-time
    this.gateway.sendNotification(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link ?? undefined,
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendUnreadCount(userId, unreadCount);

    return notification;
  }

  async findAllByUser(userId: string, unreadOnly?: boolean) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendUnreadCount(userId, unreadCount);

    return result;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    this.gateway.sendUnreadCount(userId, 0);

    return result;
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async delete(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }
}
