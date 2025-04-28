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
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import * as admin from 'firebase-admin';

@Controller('')
export class ProxyController {
  private readonly serviceMap: Record<string, string>;

  constructor(private readonly http: HttpService) {
    this.serviceMap = {
      users: process.env.USERS_URL ?? 'http://localhost:3001',
      education: process.env.EDUCATION_URL ?? 'http://localhost:3002',
    };
  }

  // (unprotected)
  @Get('/users/*/check-lock-status')
  async usersCheckLockStatus(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to check-lock-status');
    return await this.handleReRoute(req, res, undefined);
  }

  // (unprotected)
  @Patch('/users/*/failed-attempts')
  async usersFailedAttempts(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to modify failed-attempts');
    return await this.handleReRoute(req, res, undefined);
  }

  // (unprotected)
  @Post('/users')
  async usersCreate(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to post a new user');
    return await this.handleReRoute(req, res, undefined);
  }

  replaceMe(req: Request): string {
    const firebaseUser = req['user'];
    const uid = firebaseUser?.uid;
    if (!uid) {
      logger.error('no uid inside the request body');
      throw new Error('No user UID found in body');
    }
    req.url = req.url.replaceAll('me', uid);
    return uid;
  }

  @Get('/users/me')
  @UseGuards(FirebaseAuthGuard)
  async usersGet(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to get a user');
    try {
      this.replaceMe(req);
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: String(error) });
    }

    return await this.handleReRoute(req, res, undefined);
  }

  @Patch('/users/me')
  @UseGuards(FirebaseAuthGuard)
  async usersPatch(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to patch a user');
    let uid = "";
    try {
      uid = this.replaceMe(req);
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: String(error) });
    }

    const { newEmail } = req.body;
    let oldEmail: string | null = null;
    if (newEmail) {
      try {
        const userRecord = await admin.auth().getUser(uid);
        oldEmail = userRecord.email || null;
        await admin.auth().updateUser(uid, { email: newEmail });
      } catch (error) {
        logger.error(`Failed to update email in Firebase: ${error}`);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Failed to update email in Firebase' });
      }
    }

    return await this.handleReRoute(req, res, async (error) => {
      if (oldEmail) {
        try {
          await admin.auth().updateUser(uid, { email: oldEmail });
          logger.warn(`Rolled back email change for user ${uid}`);
        } catch (rollbackError) {
          logger.error(`Failed to rollback email for user ${uid}: ${rollbackError}`);
        }
      }
    });
  }

  @All('*')
  @UseGuards(FirebaseAuthGuard)
  async proxy(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to reroute request');
    return await this.handleReRoute(req, res, undefined);
  }

  async handleReRoute(req: Request, res: Response, onError?: (error: Error) => any) {
    try {
      const response = await this.reRoute(req);
      return res.status(response.status).send(response.data);
    } catch (error) {
      if (onError) {
        await onError(error);
      }

      logger.error(`Error during reroute ${error}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' })
    }
  }

  async reRoute(req: Request) {
    const parts = req.path.split('/');
    if (parts.length < 2) {
      throw new Error('No service was provided');
    }

    const service = parts[1];
    const serviceBaseUrl = this.serviceMap[service];
    if (!serviceBaseUrl) {
      throw new Error(`Unknown service: ${service}`);
    }

    const targetUrl = `${serviceBaseUrl}${req.path}`;
    const { host, connection, 'content-length': _, ...safeHeaders } = req.headers;

    logger.log(`Sending a request to url ${targetUrl}`);
    return await firstValueFrom(
      this.http.request({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: safeHeaders,
      }),
    );
  }
}

const logger = new Logger(ProxyController.name);
