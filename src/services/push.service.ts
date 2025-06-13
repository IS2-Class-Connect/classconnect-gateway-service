import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import Expo, { ExpoPushMessage } from "expo-server-sdk";

@Injectable()
export class PushService {
  private readonly expo: Expo = new Expo();

  constructor() { }

  /**
    * Sends a push notification to a specific user.
    *
    * @param pushToken - The Expo push token.
    * @param title     - The title the user will see in the notification.
    * @param body      - The body the user will see in the notification.
    *
    * @throws {HttpException} - If Expo fails to deliver the notification.
    */
  async notifyUser(pushToken: string, title: string, body: string) {
    const msg: ExpoPushMessage = {
      to: pushToken,
      title,
      body,
      sound: 'default',
    };

    try {
      const receipts = await this.expo.sendPushNotificationsAsync([msg]);
      const failed = receipts.find((r: any) => r.status === 'error');
      if (failed) {
        throw new Error('receipt returned an error');
      }
    } catch (error) {
      logger.warn(`Expo push notification failed: ${error}`);
      throw new HttpException('Expo failed to deliver the push notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

const logger = new Logger(PushService.name);
