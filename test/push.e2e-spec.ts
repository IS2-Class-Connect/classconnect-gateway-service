import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from '../src/services/push.service';
import { HttpException } from '@nestjs/common';
import Expo from 'expo-server-sdk';

jest.mock('expo-server-sdk');

describe('PushService', () => {
  let service: PushService;
  let expoMock: jest.Mocked<Expo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushService],
    }).compile();

    service = module.get<PushService>(PushService);

    // Replace the internal Expo instance with a mock
    expoMock = new Expo() as jest.Mocked<Expo>;
    (service as any).expo = expoMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send a push notification successfully', async () => {
    expoMock.sendPushNotificationsAsync = jest.fn().mockResolvedValue([
      { status: 'ok' },
    ]);

    await expect(
      service.notifyUser('ExponentPushToken[valid]', 'Hello', 'World'),
    ).resolves.toBeUndefined();

    expect(expoMock.sendPushNotificationsAsync).toHaveBeenCalledWith([
      expect.objectContaining({
        to: 'ExponentPushToken[valid]',
        title: 'Hello',
        body: 'World',
        sound: 'default',
      }),
    ]);
  });

  it('should throw an HttpException if receipt has error status', async () => {
    expoMock.sendPushNotificationsAsync = jest.fn().mockResolvedValue([
      { status: 'error', message: 'Failed', details: { error: 'DeviceNotRegistered' } },
    ]);

    await expect(
      service.notifyUser('ExponentPushToken[invalid]', 'Oops', 'Something went wrong'),
    ).rejects.toThrow(HttpException);

    expect(expoMock.sendPushNotificationsAsync).toHaveBeenCalled();
  });

  it('should throw an HttpException if sending throws', async () => {
    expoMock.sendPushNotificationsAsync = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      service.notifyUser('ExponentPushToken[fail]', 'Oops', 'Error occurred'),
    ).rejects.toThrow(HttpException);
  });
});
