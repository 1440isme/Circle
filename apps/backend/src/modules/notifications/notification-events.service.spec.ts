import { NotificationType } from '@circle/types';
import { PrismaService } from '../../database/prisma.service';
import { NotificationEventsService } from './notification-events.service';
import { NotificationsService } from './notifications.service';

describe('NotificationEventsService', () => {
  const member = (userId: string, notificationLevel = 'ALL', mutedUntil: Date | null = null) => ({
    userId,
    nickname: null,
    notificationLevel,
    mutedUntil,
    user: { email: `${userId}@example.invalid`, profile: { displayName: userId, handle: userId } },
  });
  const event = { circleId: 'circle', actorId: 'sender', targetId: 'message', channelId: 'channel' };
  let findFirst: jest.Mock;
  let createNotification: jest.Mock;
  let service: NotificationEventsService;

  beforeEach(() => {
    findFirst = jest.fn();
    createNotification = jest.fn().mockResolvedValue({});
    service = new NotificationEventsService(
      { circle: { findFirst } } as unknown as PrismaService,
      { createNotification } as unknown as NotificationsService,
    );
  });

  it('sends an in-app notification to allowed members without exposing message text', async () => {
    findFirst.mockResolvedValue({
      name: 'Circle QA',
      members: [
        member('Lin', 'ALL', new Date(Date.now() + 60_000)),
        member('Bình', 'MENTIONS'),
        member('Bình An', 'MENTIONS'),
        member('An', 'NONE'),
        member('Unmentioned', 'MENTIONS'),
      ],
    });
    await service.notifyCircle({ ...event, type: NotificationType.CHAT_MESSAGE, message: '@Bình nội dung riêng' });

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'circle', deletedAt: null },
      select: expect.objectContaining({
        members: expect.objectContaining({ where: { userId: { not: 'sender' } } }),
      }),
    }));
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'Lin', sendPush: false, targetId: 'message',
      metadata: { circleId: 'circle', circleName: 'Circle QA', channelId: 'channel', mention: false },
    }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'Bình', sendPush: true, metadata: expect.objectContaining({ mention: true }),
    }));
    expect(JSON.stringify(createNotification.mock.calls)).not.toContain('nội dung riêng');
  });

  it('does not treat email addresses or a longer name as a mention', async () => {
    findFirst.mockResolvedValue({ name: 'Circle', members: [member('An', 'MENTIONS')] });
    await service.notifyCircle({ ...event, type: NotificationType.CHAT_MESSAGE, message: 'first@an.invalid @Anna' });

    expect(createNotification).not.toHaveBeenCalled();
  });

  it('prefers a full member name over a shorter name with the same prefix', async () => {
    findFirst.mockResolvedValue({ name: 'Circle', members: [member('Bình', 'MENTIONS'), member('Bình An', 'MENTIONS')] });
    await service.notifyCircle({ ...event, type: NotificationType.CHAT_MESSAGE, message: '@Bình An kiểm tra giúp' });

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'Bình An' }));
  });

  it('limits invitations to the affected account and approvals to Circle owners', async () => {
    findFirst.mockResolvedValue({ name: 'Circle', members: [] });
    await service.notifyCircle({ ...event, type: NotificationType.CIRCLE_INVITE, userIds: ['invitee', 'invitee'] });
    await service.notifyCircle({ ...event, type: NotificationType.CIRCLE_JOIN_REQUEST, ownerOnly: true });

    expect(findFirst).toHaveBeenNthCalledWith(1, expect.objectContaining({
      select: expect.objectContaining({
        members: expect.objectContaining({ where: { userId: { not: 'sender', in: ['invitee'] } } }),
      }),
    }));
    expect(findFirst).toHaveBeenNthCalledWith(2, expect.objectContaining({
      select: expect.objectContaining({
        members: expect.objectContaining({ where: { userId: { not: 'sender' }, role: 'OWNER' } }),
      }),
    }));
  });

  it('sends only one notification to members of multiple Circles sharing one moment', async () => {
    findFirst
      .mockResolvedValueOnce({ name: 'First', members: [member('reader')] })
      .mockResolvedValueOnce({ name: 'Second', members: [member('reader'), member('other')] });

    await service.notifyMoment('sender', 'moment', ['first', 'first', 'second']);

    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(createNotification.mock.calls.map(([notification]) => notification.userId)).toEqual(['reader', 'other']);
  });
});
