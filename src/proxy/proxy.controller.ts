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
  } from '@nestjs/common';
  import { HttpService } from '@nestjs/axios';
  import { Request, Response } from 'express';
  import { firstValueFrom } from 'rxjs';
  import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
  import * as admin from 'firebase-admin'; 
  
  @Controller('')
  export class ProxyController {
    private readonly serviceMap: Record<string, string>;
    private readonly adminToken: string | undefined;
  
    constructor(
      private readonly http: HttpService,
      @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin, 
    ) {
      this.serviceMap = {
        users: process.env.USERS_URL ?? 'http://localhost:3001',
        education: process.env.EDUCATION_URL ?? 'http://localhost:3002',
        admins: process.env.ADMINS_URL ?? 'http://localhost:3004',
      };
      this.adminToken = process.env.ADMIN_TOKEN ?? "admin-token";
    }

    @All('/admins')
    async admins(@Req() req: Request, @Res() res: Response) {
      logger.log('Attempting to reroute request to admins');
      return await this.handleReRoute(req, res, undefined); 
    }

    @All('/admins/*')
    async adminsPlus(@Req() req: Request, @Res() res: Response) {
      logger.log('Attempting to reroute request to admins');
      return await this.handleReRoute(req, res, undefined); 
    }
  
    @Get('/users/*/check-lock-status')
    async usersCheckLockStatus(@Req() req: Request, @Res() res: Response) {
      logger.log('Attempting to check-lock-status');
      return await this.handleReRoute(req, res, undefined);
    }
  
    @Patch('/users/*/failed-attempts')
    async usersFailedAttempts(@Req() req: Request, @Res() res: Response) {
      logger.log('Attempting to modify failed-attempts');
      return await this.handleReRoute(req, res, undefined);
    }
  
    @Post('/users')
    async usersCreate(@Req() req: Request, @Res() res: Response) {
      logger.log('Attempting to post a new user');
      return await this.handleReRoute(req, res, undefined);
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
      try {
        this.replaceMe(req);
      } catch (error) {
        return res.status(error.getStatus()).send({ message: error.getResponse() });
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
        return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Failed to resolve user UID' });
      }
  
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
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Failed to update email in Firebase' });
        }
      }
  
      return await this.handleReRoute(req, res, async (_) => {
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

    @Get('/admin-backend/*')
    async adminBackendProxy(@Req() req: Request, @Res() res: Response) {
      const authHeader = req.headers['authorization'];
      if (!authHeader || authHeader.split('Bearer ')[1] !== this.adminToken) {
        logger.error('Unauthorized access attempt to admin backend');
        return res.status(HttpStatus.UNAUTHORIZED).send({ message: 'Unauthorized' });
      }

      const newPath = req.path.replace('/admin-backend', '');
      logger.log(`Attempting to reroute request to ${newPath}`);
      req.url = newPath;

      return await this.handleReRoute(req, res, undefined);
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
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const status = error?.response?.status || error?.status || 500;
        logger.error(`Error during reroute: ${message}`);
        return res.status(status).send({ message });
      }
    }
  
    async reRoute(req: Request) {
      const parts = req.path.split('/');
      if (parts.length < 2) {
        throw new HttpException('No service was provided', HttpStatus.BAD_REQUEST);
      }
  
      const service = parts[1];
      const serviceBaseUrl = this.serviceMap[service];
      if (!serviceBaseUrl) {
        throw new HttpException(`Unknown service: ${service}`, HttpStatus.BAD_REQUEST);
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
  
