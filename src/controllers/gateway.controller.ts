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
import { MultiAuthGuard } from '../auth/firebase-auth.guard';
import { GatewayTokenGuard } from '../auth/gateway-auth.guard';
import { ProxyService } from '../services/proxy.service';
import { NotificationService } from '../services/notification.service';
import * as admin from 'firebase-admin';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

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

  /**
    * Fetches a user from the users service.
    *
    * @param uid - The user id to lookup.
    *
    * @throws {HttpException} - If the user was not found or the request failed.
    *
    * @return The user if found.
    */
  async fetchUser(uid: string): Promise<any> {
    logger.log(`Fetching user ${uid} from users`);
    const url = `${this.serviceMap['users']}/users/${uid}`;

    let res: AxiosResponse;
    try {
      res = await firstValueFrom(this.http.get(url));
    } catch (e) {
      logger.warn(`Couldn't reach users service: ${e}`);
      throw new HttpException(e.response, e.status);
    }

    if (res.data?.error) {
      throw new HttpException(`Failed to fetch user: ${res.data.error}`, 500);
    }

    return res.data;
  }

  /**
    * Fetches a user from the users service.
    *
    * @throws {HttpException} - If the users service couldn't be reached.
    *
    * @return A list of users.
    */
  async fetchUsers(): Promise<any[]> {
    logger.log(`Fetching users`);
    const url = `${this.serviceMap['users']}/users`;

    let res: AxiosResponse;
    try {
      res = await firstValueFrom(this.http.get(url));
    } catch (e) {
      logger.warn(`Couldn't reach users service: ${e}`);
      throw new HttpException(e.response, e.status);
    }

    if (res.data?.error) {
      throw new HttpException(`Failed to fetch users: ${res.data.error}`, 500);
    }

    return res.data;
  }

  /**
    * Sends a push notification to a given user.
    *
    * @throws {HttpException} - If the notification couldn't be sent.
    */
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

  /**
    * Sends an email to a given user regarding an enrollment to a certain course.
    *
    * @throws {HttpException} - If the email couldn't be sent.
    */
  @Post('/email/student-enrollment')
  @UseGuards(GatewayTokenGuard)
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

  /**
    * Sends an email to a given user regarding an assistant assignment to a certain course.
    *
    * @throws {HttpException} - If the email couldn't be sent.
    */
  @Post('/email/assistant-assignment')
  @UseGuards(GatewayTokenGuard)
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

  /**
    * Sends an email to all users regarding the new rules and policies of the application.
    *
    * @throws {HttpException} - If the email couldn't be sent.
    */
  @Post('/email/rules')
  @UseGuards(GatewayTokenGuard)
  async sendRulesEmail(
    @Body('rules') rules: any[],
  ) {
    logger.log('Attempting to send rules email');
    const users = await this.fetchUsers();
    await this.notification.sendNewRulesEmails(users, rules);
  }

  /**
    * Redirects requests directly with the path prefix of /admins given that the backoffice implements it's own auth.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @All('/admins')
  async admins(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request to admins');
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Redirects requests directly with the path prefix of /admins/* given that the backoffice implements it's own auth.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @All('/admins/*')
  async adminsPlus(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request to admins');
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Bypasses the auth check for this particular endpoint, leaving it unprotected.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @Get('/users/*/check-lock-status')
  async usersCheckLockStatus(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to check-lock-status');
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Bypasses the auth check for this particular endpoint, leaving it unprotected.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @Patch('/users/*/failed-attempts')
  async usersFailedAttempts(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to modify failed-attempts');
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Bypasses the auth check for this particular endpoint, leaving it unprotected.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @Post('/users')
  async userCreate(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to post a new user');
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Replaces the uid in the request path with the actual uid.
    *
    * @throws {HttpException} - If the suffix couldn't be replaced.
    */
  replaceMe(req: Request): string {
    const firebaseUser = req['user'];
    const uid = firebaseUser?.uid;
    if (!uid) {
      throw new HttpException(`Couldn't replace me, user uid wasn't found in body`, HttpStatus.BAD_REQUEST);
    }
    req.url = req.url.replaceAll('me', uid);
    return uid;
  }

  /**
    * Replaces the /me suffix with the actual uid using firebase, it then
    * redirects the request to the users service and returns it's reponse.
    *
    * @throws {HttpException} - If the suffix couldn't be replaced.
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @Get('/users/me')
  @UseGuards(MultiAuthGuard)
  async userGet(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to get a user');
    this.replaceMe(req);
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Replaces the /me suffix with the actual uid using firebase, it then
    * redirects the request to the users service and returns it's reponse.
    *
    * @throws {HttpException} - If the suffix couldn't be replaced.
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @Patch('/users/me')
  @UseGuards(MultiAuthGuard)
  async userPatch(@Req() req: Request, @Res() res: Response) {
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

  /**
    * Redirects requests directly with the path prefix of /admin-backend/* using the {GatewayTokenGuard}.
    * So that the backoffice can make requests to other services through the gateway without being logged in
    * in Firebase.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @All('/admin-backend/*')
  @UseGuards(GatewayTokenGuard)
  async adminBackendProxy(@Req() req: Request, @Res() res: Response) {
    const newPath = req.path.replace('/admin-backend', '');
    logger.log(`Attempting to reroute request to ${newPath}`);
    req.url = newPath;
    await this.proxy.reRoute(req, res, undefined);
  }

  /**
    * Updates the user's lock status, this needs to make sure that changing it also changes it in Firebase too.
    * If an error occurs, then it will try to revert the change made previously.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @Patch()
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

  /**
    * General proxy default gateway for requests that don't match previous handler definitions.
    *
    * @throws {HttpException} - If there was an error redirecting the request.
    */
  @All('*')
  @UseGuards(MultiAuthGuard)
  async default(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request');
    await this.proxy.reRoute(req, res, undefined);
  }
}

const logger = new Logger(GatewayController.name);
