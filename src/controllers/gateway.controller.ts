import {
  Controller,
  All,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Post,
  Get,
  Patch,
  Logger,
  HttpException,
  Inject,
  Param,
  Body,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GatewayTokenGuard } from '../auth/gateway-auth.guard';
import { ProxyService } from '../services/proxy.service';
import { NotificationService } from '../services/notification.service';
import * as admin from 'firebase-admin';
import { firstValueFrom } from 'rxjs';

@Controller('')
export class GatewayController {
  private readonly serviceMap: Record<string, string> = {
    users: process.env.USERS_URL ?? 'http://localhost:3001',
    courses: process.env.EDUCATION_URL ?? 'http://localhost:3002',
    evaluations: process.env.EDUCATION_URL ?? 'http://localhost:3002',
    admins: process.env.ADMINS_URL ?? 'http://localhost:3004',
  };

  constructor(
    private readonly http: HttpService,
    private readonly notification: NotificationService,
    private readonly proxy: ProxyService,
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
  ) { }


  async fetchUser(uid: string): Promise<any> {
    const url = `${this.serviceMap['users']}/users/${uid}`;
    try {
      return (await firstValueFrom(this.http.get(url))).data;
    } catch (e) {
      throw new HttpException("Coudn't reach users service", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/notifications')
  @UseGuards(GatewayTokenGuard)
  async notifyUser(
    @Body('uuid') uid: string,
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('topic') topic: string,
  ) {
    logger.log(`Attempting to notify user ${uid} through push notification`);
    const user = await this.fetchUser(uid);
    await this.notification.notifyUser(user, title, body, topic);
  }

  @Post('/email/student-enrollment')
  async sendEnrollmentEmail(
    @Body('uuid') uid: string,
    @Body('toName') toName: string,
    @Body('courseName') courseName: string,
    @Body('studentEmail') studentEmail: string,
    @Body('topic') topic: string,
  ) {
    logger.log('Attempting to send enrollment email');
    const user = await this.fetchUser(uid);
    await this.notification.sendEnrollmentEmail(user, toName, courseName, studentEmail, topic);
  }


  @Post('/email/assistant-assignment')
  async sendAssistantAssignmentEmail(
    @Body('uuid') uid: string,
    @Body('toName') toName: string,
    @Body('professorName') professorName: string,
    @Body('courseName') courseName: string,
    @Body('studentEmail') studentEmail: string,
    @Body('topic') topic: string,
  ) {
    logger.log('Attempting to send assistant assignment email');
    const user = await this.fetchUser(uid);
    await this.notification.sendAssistantAssignmentEmail(user, toName, professorName, courseName, studentEmail, topic);
  }

  @All('/admins')
  async admins(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request to admins');
    await this.proxy.reRoute(req, res, undefined);
  }

  @All('/admins/*')
  async adminsPlus(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request to admins');
    await this.proxy.reRoute(req, res, undefined);
  }

  @Get('/users/*/check-lock-status')
  async usersCheckLockStatus(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to check-lock-status');
    await this.proxy.reRoute(req, res, undefined);
  }

  @Patch('/users/*/failed-attempts')
  async usersFailedAttempts(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to modify failed-attempts');
    await this.proxy.reRoute(req, res, undefined);
  }

  @Post('/users')
  async usersCreate(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to post a new user');
    await this.proxy.reRoute(req, res, undefined);
  }

  replaceMe(req: Request): string {
    const firebaseUser = req['user'];
    const uid = firebaseUser?.uid;
    if (!uid) {
      throw new HttpException('No user UID found in body', HttpStatus.BAD_REQUEST);
    }
    req.url = req.url.replaceAll('me', uid);
    return uid;
  }

  @Get('/users/me')
  @UseGuards(FirebaseAuthGuard)
  async usersGet(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to get a user');
    this.replaceMe(req);
    await this.proxy.reRoute(req, res, undefined);
  }

  @Patch('/users/me')
  @UseGuards(FirebaseAuthGuard)
  async usersPatch(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to patch a user');

    const uid = this.replaceMe(req);
    const { email: newEmail } = req.body;
    let oldEmail: string | null = null;

    if (newEmail) {
      try {
        const userRecord = await this.firebaseAdmin.auth().getUser(uid);
        oldEmail = userRecord.email || null;

        if (oldEmail !== newEmail) {
          await this.firebaseAdmin.auth().updateUser(uid, { email: newEmail });
          logger.log(`✅ Updated Firebase email for UID ${uid}`);
        } else {
          logger.log(`ℹ️ Emails are the same, no update needed in Firebase.`);
        }
      } catch (error) {
        logger.error(`Failed to update email in Firebase: ${error}`);
        throw new HttpException('Failed to update email in Firebase', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    await this.proxy.reRoute(req, res, async (_) => {
      if (oldEmail && oldEmail !== newEmail) {
        try {
          await this.firebaseAdmin.auth().updateUser(uid, { email: oldEmail });
          logger.warn(`Rolled back email change for user ${uid}`);
        } catch (rollbackError) {
          logger.error(`Failed to rollback email for user ${uid}: ${rollbackError}`);
        }
      }
    });
  }

  @All('/admin-backend/*')
  @UseGuards(GatewayTokenGuard)
  async adminBackendProxy(@Req() req: Request, @Res() res: Response) {
    const newPath = req.path.replace('/admin-backend', '');
    logger.log(`Attempting to reroute request to ${newPath}`);
    req.url = newPath;
    await this.proxy.reRoute(req, res, undefined);
  }

  @Patch('/admin-backend/users/:uid/lock-status')
  @UseGuards(GatewayTokenGuard)
  async updateUserLockStatus(
    @Param('uid') uid: string,
    @Body('locked') locked: boolean,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.firebaseAdmin.auth().updateUser(uid, { disabled: locked });

      const statusText = locked ? 'Blocked' : 'Unblocked';
      logger.log(`✅ ${statusText} Firebase user with UID ${uid}`);

      const newPath = req.path.replace('/admin-backend', '');
      logger.log(`Attempting to reroute request to ${newPath}`);
      req.url = newPath;
      await this.proxy.reRoute(req, res, undefined);
    } catch (error) {
      logger.error(`❌ Failed to update lock status for user ${uid}: ${error}`);
      throw new HttpException('Failed to update user lock status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @All('*')
  @UseGuards(FirebaseAuthGuard)
  async default(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request');
    await this.proxy.reRoute(req, res, undefined);
  }
}

const logger = new Logger(GatewayController.name);
